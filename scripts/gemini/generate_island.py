"""Gemini REST client for island generation.

Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Auth: ?key=GEMINI_API_KEY
"""

from __future__ import annotations

import base64
import os
import sys
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_PATH = REPO_ROOT / "apps" / "web" / ".env.local"
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
DEFAULT_MODEL = "gemini-2.5-flash-image"
REQUEST_TIMEOUT_S = 120


def _load_key() -> str:
    # override=True so a freshly-rotated key in .env.local wins over any stale
    # value already present in os.environ (e.g. exported in the user's shell).
    load_dotenv(ENV_PATH, override=True)
    key = os.environ.get("GEMINI_API_KEY")
    if not key:
        raise RuntimeError(f"GEMINI_API_KEY missing in {ENV_PATH}")
    return key


def _log(msg: str) -> None:
    print(f"[gemini] {msg}", file=sys.stderr, flush=True)


def list_models() -> list[str]:
    """GET /models. Returns model names supporting image generation if filterable."""
    resp = requests.get(
        f"{BASE_URL}/models",
        params={"key": _load_key()},
        timeout=30,
    )
    if resp.status_code != 200:
        _log(f"list_models -> {resp.status_code} {resp.text[:200]}")
        return []
    data = resp.json()
    models = []
    for m in data.get("models", []):
        name = m.get("name", "")
        actions = m.get("supportedGenerationMethods", []) or m.get("supported_generation_methods", [])
        if "generateContent" in actions or "generate_content" in actions:
            models.append(name)
    return models


def generate(
    prompt: str,
    output_path: Path,
    *,
    model: str = DEFAULT_MODEL,
    aspect_ratio: str = "16:9",
) -> Path:
    """Generate one PNG via Gemini and write to output_path. Returns path."""
    url = f"{BASE_URL}/models/{model}:generateContent"
    payload: dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": aspect_ratio},
        },
    }
    _log(f"POST {url} prompt_len={len(prompt)} ar={aspect_ratio}")
    resp = requests.post(
        url,
        params={"key": _load_key()},
        json=payload,
        timeout=REQUEST_TIMEOUT_S,
    )
    if resp.status_code != 200:
        # Retry without imageConfig if 400 — some models reject the field name.
        if resp.status_code == 400 and "imageConfig" in resp.text:
            _log("imageConfig rejected, retrying without aspect_ratio")
            payload["generationConfig"].pop("imageConfig", None)
            resp = requests.post(
                url,
                params={"key": _load_key()},
                json=payload,
                timeout=REQUEST_TIMEOUT_S,
            )
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini {resp.status_code}: {resp.text[:500]}")
    data = resp.json()
    image_b64 = _extract_image_b64(data)
    if not image_b64:
        raise RuntimeError(f"No image returned. Response: {str(data)[:500]}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(base64.b64decode(image_b64))
    _log(f"wrote {output_path} ({output_path.stat().st_size} bytes)")
    return output_path


def _extract_image_b64(data: dict[str, Any]) -> str | None:
    for cand in data.get("candidates", []):
        for part in cand.get("content", {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return inline["data"]
    return None


def remove_sky_background(input_path: Path, output_path: Path) -> bool:
    """Try rembg; fallback to PIL blue-sky chroma key. Returns True if processed."""
    try:
        from rembg import remove  # type: ignore[import-not-found]

        with input_path.open("rb") as f:
            data = remove(f.read())
        output_path.write_bytes(data)
        _log(f"rembg -> {output_path}")
        return True
    except Exception as exc:  # noqa: BLE001
        _log(f"rembg unavailable ({type(exc).__name__}); using PIL fallback")

    try:
        from PIL import Image

        img = Image.open(input_path).convert("RGBA")
        pixels = img.load()
        w, h = img.size
        for y in range(h):
            for x in range(w):
                r, g, b, _ = pixels[x, y]
                # heuristic: light blue sky (high blue, low red, mid-high green)
                if b > 150 and b > r + 25 and b > g + 5 and r < 200:
                    pixels[x, y] = (r, g, b, 0)
        img.save(output_path)
        _log(f"PIL chroma key -> {output_path}")
        return True
    except Exception as exc:  # noqa: BLE001
        _log(f"PIL fallback failed: {exc}")
        return False


if __name__ == "__main__":
    _log(f"key loaded: {bool(_load_key())}")
    print("\n".join(list_models()[:25]))
