"""PixelLab v2 REST client.

Docs: https://api.pixellab.ai/v2/llms.txt
Auth: Bearer token from apps/web/.env.local (PIXELLAB_API_TOKEN).
"""

from __future__ import annotations

import io
import os
import sys
import time
import zipfile
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / "apps" / "web" / ".env.local"
BASE_URL = "https://api.pixellab.ai/v2"
DEFAULT_TIMEOUT = 60
POLL_INTERVAL_S = 2.0
POLL_TIMEOUT_S = 300.0  # raised from 120 — v3 anims can take 130-180s for big chars


def _load_token() -> str:
    load_dotenv(ENV_PATH)
    token = os.environ.get("PIXELLAB_API_TOKEN")
    if not token:
        raise RuntimeError(f"PIXELLAB_API_TOKEN missing in {ENV_PATH}")
    return token


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {_load_token()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _log(msg: str) -> None:
    print(f"[pixellab] {msg}", file=sys.stderr, flush=True)


def authenticated_request(
    method: str,
    path: str,
    json: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
    accept: str | None = None,
    stream: bool = False,
) -> requests.Response:
    """Authenticated request against the PixelLab v2 API.

    `path` may be a full URL or a path beginning with `/`.
    """
    url = path if path.startswith("http") else f"{BASE_URL}{path}"
    headers = _headers()
    if accept:
        headers["Accept"] = accept
    # Sanitised log (no token).
    safe_payload = "(no body)" if json is None else f"keys={list(json.keys())}"
    _log(f"{method} {url} {safe_payload}")
    resp = requests.request(
        method,
        url,
        headers=headers,
        json=json,
        params=params,
        timeout=DEFAULT_TIMEOUT,
        stream=stream,
    )
    if resp.status_code == 401:
        raise RuntimeError(f"401 Unauthorized from PixelLab: {resp.text[:200]}")
    if resp.status_code == 402:
        raise RuntimeError(f"402 Payment required (out of credits): {resp.text[:200]}")
    return resp


def get_balance() -> dict[str, Any] | None:
    """GET /balance — best-effort; returns None if endpoint is absent."""
    try:
        resp = authenticated_request("GET", "/balance")
        if resp.status_code == 200:
            return resp.json()
        _log(f"GET /balance -> {resp.status_code} {resp.text[:120]}")
    except Exception as exc:  # noqa: BLE001
        _log(f"GET /balance failed: {exc}")
    return None


def list_animation_templates() -> list[dict[str, Any]] | None:
    """Try a few likely endpoints to enumerate template animation IDs."""
    candidates = [
        "/animations/templates",
        "/animate-character/templates",
        "/templates/animations",
        "/animation-templates",
    ]
    for path in candidates:
        try:
            resp = authenticated_request("GET", path)
        except Exception as exc:  # noqa: BLE001
            _log(f"GET {path} failed: {exc}")
            continue
        if resp.status_code == 200:
            data = resp.json()
            _log(f"animation templates found at {path}: {len(data) if isinstance(data, list) else 'dict'}")
            return data
        _log(f"GET {path} -> {resp.status_code}")
    return None


def wait_for_job(job_id: str, timeout: float = POLL_TIMEOUT_S) -> dict[str, Any]:
    """Poll GET /background-jobs/{id} every POLL_INTERVAL_S until completed/failed."""
    start = time.monotonic()
    last_status = ""
    while True:
        elapsed = time.monotonic() - start
        if elapsed > timeout:
            raise TimeoutError(f"job {job_id} not completed within {timeout}s (last status={last_status})")
        resp = authenticated_request("GET", f"/background-jobs/{job_id}")
        if resp.status_code != 200:
            raise RuntimeError(f"poll {job_id} -> {resp.status_code} {resp.text[:200]}")
        data = resp.json()
        status = data.get("status") or data.get("state") or ""
        if status != last_status:
            _log(f"job {job_id} status={status} (t={elapsed:.1f}s)")
            last_status = status
        if status in {"completed", "succeeded", "success"}:
            return data
        if status in {"failed", "error", "cancelled"}:
            raise RuntimeError(f"job {job_id} ended with status={status}: {data}")
        time.sleep(POLL_INTERVAL_S)


def create_character(description: str, name: str | None = None) -> dict[str, Any]:
    """POST /create-character-with-8-directions (mode=standard). Waits for job.

    The `name` arg is currently ignored: /create-character-with-8-directions does
    not accept a `name` field (only /create-character-v3 / pro do). Kept in
    signature for callers that pass it.
    """
    _ = name  # unused, see docstring
    # NOTE: /create-character-with-8-directions does NOT support `no_background`
    # (only /create-character-v3 and /create-character-pro do). Sending it would 422.
    payload: dict[str, Any] = {
        "mode": "standard",
        "description": description,
        "image_size": {"width": 64, "height": 64},
        "template_id": "mannequin",
        "view": "low top-down",
        "outline": "medium",
        "shading": "soft",
        "detail": "high",
    }
    resp = authenticated_request("POST", "/create-character-with-8-directions", json=payload)
    if resp.status_code not in (200, 202):
        raise RuntimeError(f"create character failed: {resp.status_code} {resp.text[:400]}")
    data = resp.json()
    job_id = data.get("background_job_id") or data.get("job_id")
    character_id = data.get("character_id") or data.get("id")
    if not character_id:
        raise RuntimeError(f"create character: no character_id returned: {data}")
    if job_id:
        wait_for_job(job_id)
    return {"character_id": character_id, "job_id": job_id, "raw": data}


def animate_character(
    character_id: str,
    *,
    template_animation_id: str | None = None,
    action_description: str | None = None,
    directions: list[str] | None = None,
    frame_count: int = 8,
    seed: int | None = None,
    animation_name: str | None = None,
) -> dict[str, Any]:
    """POST /animate-character. Mode=template if template id, else v3 with description.

    Always waits for the background job. Pass animation_name to control the
    folder name in the resulting ZIP (defaults to a generated one).
    """
    payload: dict[str, Any] = {
        "character_id": character_id,
        "directions": directions or ["south"],
    }
    if animation_name:
        payload["animation_name"] = animation_name
    if template_animation_id:
        payload["mode"] = "template"
        payload["template_animation_id"] = template_animation_id
    elif action_description:
        payload["mode"] = "v3"
        payload["action_description"] = action_description
        payload["frame_count"] = frame_count
    else:
        raise ValueError("Must provide template_animation_id or action_description")
    if seed is not None:
        payload["seed"] = seed

    resp = authenticated_request("POST", "/animate-character", json=payload)
    if resp.status_code not in (200, 202):
        raise RuntimeError(
            f"animate failed [{template_animation_id or action_description}]: "
            f"{resp.status_code} {resp.text[:400]}"
        )
    data = resp.json()
    # animate-character returns background_job_ids (plural, one per direction).
    job_ids: list[str] = list(data.get("background_job_ids") or [])
    single = data.get("background_job_id") or data.get("job_id")
    if single and single not in job_ids:
        job_ids.append(single)
    for jid in job_ids:
        wait_for_job(jid)
    return {"job_ids": job_ids, "raw": data}


def wait_for_zip_ready(character_id: str, timeout: float = 240.0) -> None:
    """Poll GET /characters/{id}/zip with HEAD-like behavior until ready (not 423)."""
    start = time.monotonic()
    while True:
        elapsed = time.monotonic() - start
        if elapsed > timeout:
            raise TimeoutError(f"zip not ready within {timeout}s for character {character_id}")
        resp = authenticated_request(
            "GET", f"/characters/{character_id}/zip", accept="application/zip", stream=True
        )
        if resp.status_code == 200:
            resp.close()
            return
        if resp.status_code == 423:
            _log(f"zip not ready (423), retry in 5s (t={elapsed:.1f}s)")
            time.sleep(5.0)
            continue
        raise RuntimeError(f"zip pre-check failed: {resp.status_code} {resp.text[:200]}")


def download_zip(character_id: str, output_dir: Path) -> list[Path]:
    """GET /characters/{id}/zip and unzip into output_dir. Returns extracted paths."""
    output_dir.mkdir(parents=True, exist_ok=True)
    resp = authenticated_request(
        "GET", f"/characters/{character_id}/zip", accept="application/zip", stream=True
    )
    if resp.status_code != 200:
        raise RuntimeError(f"download zip failed: {resp.status_code} {resp.text[:200]}")
    buf = io.BytesIO(resp.content)
    extracted: list[Path] = []
    with zipfile.ZipFile(buf) as zf:
        for member in zf.namelist():
            if member.endswith("/"):
                continue
            # Preserve subfolder structure (per-animation subdirs). Strip the
            # leading "character_name/" segment so the output is rooted at output_dir.
            rel = Path(member)
            if len(rel.parts) > 1:
                rel = Path(*rel.parts[1:])
            target = output_dir / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(member) as src, target.open("wb") as dst:
                dst.write(src.read())
            extracted.append(target)
    _log(f"unzipped {len(extracted)} files into {output_dir}")
    return extracted


if __name__ == "__main__":
    # Smoke check.
    _log(f"token loaded: {bool(_load_token())}")
    bal = get_balance()
    _log(f"balance: {bal}")
