"""Phase 1: calibration run.

Steps:
  1. Create Aegis (PixelLab standard mode).
  2. Animate Aegis breathing-idle south (template mode).
  3. Animate Aegis "getting hit and staggering" south (v3 mode, frame_count=8).
  4. Download character ZIP -> apps/web/public/sprites/aegis/
  5. Generate Schema island with Gemini-3-pro-image-preview.

Reports balance delta after each PixelLab call. No retries, no post-processing.
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pixellab import client as px
from gemini import generate_island as gi

REPO_ROOT = Path(__file__).resolve().parents[1]
SPRITES_DIR = REPO_ROOT / "apps" / "web" / "public" / "sprites"
ISLANDS_DIR = REPO_ROOT / "apps" / "web" / "public" / "islands"

AEGIS_DESCRIPTION = (
    "Chibi pixel art robot paladin. Bipedal stocky proportions, large rounded "
    "helmet head with horizontal visor slit emitting two glowing amber-orange "
    "eye lights. Bone-white and cream armored plating with visible panel lines. "
    "Heavy rounded shoulder pauldrons, gauntleted three-finger hands, armored "
    "boots. Small orange power core glowing on chest center. Holds a kite-shaped "
    "knight shield in the right hand featuring a large stylized orange T emblem "
    "on its face. Color palette: bone white, cream, stone gray, orange accents. "
    "Soft cel-shading, crisp dark outline."
)

SCHEMA_ISLAND_PROMPT = (
    "Floating island in the sky, isometric 3/4 game view, wide horizontal "
    "composition. On top: a circular stone platform with large cyan crystals "
    "rising vertically from the center. arcane runes glowing softly on the "
    "floor, smaller crystal formations scattered around, stone pillars framing "
    "the platform, mossy green grass between the stones, cyan and turquoise "
    "accent colors throughout. Around the edges: rocky brown cliffs descending. "
    "The bottom of the island tapers down to a rough rocky point, as if torn "
    "from the ground floating freely. A few small chunks of rock float around "
    "the base. Painterly pixel art style, soft cel-shading, warm sunlight from "
    "the upper left, vibrant but readable colors. Style reminiscent of Octopath "
    "Traveler and Zelda Skyward Sword sky islands. No characters, no people, no "
    "robots, no text. Solid plain light blue sky background so the island can "
    "be easily isolated. THE ISLAND MUST BE WIDE AND FILL 90% OF THE FRAME "
    "HORIZONTALLY, stretched across the canvas, with the main feature "
    "prominently centered. Minimal sky visible above and below. High resolution, "
    "sharp details, crisp rendering. 16:9 aspect ratio."
)


def _gens_remaining() -> float | None:
    bal = px.get_balance()
    if not bal:
        return None
    sub = bal.get("subscription") or {}
    if "generations" in sub:
        return float(sub["generations"])
    return None


def _step(name: str, fn):
    print(f"\n=== {name} ===", flush=True)
    before = _gens_remaining()
    t0 = time.monotonic()
    result = fn()
    elapsed = time.monotonic() - t0
    after = _gens_remaining()
    delta = (before - after) if (before is not None and after is not None) else None
    print(f"[step] {name}: elapsed={elapsed:.1f}s before={before} after={after} delta={delta}", flush=True)
    return result, before, after, delta, elapsed


def run() -> None:
    report: dict = {"steps": []}

    # Step 1: create Aegis
    def _create():
        return px.create_character(AEGIS_DESCRIPTION, name="aegis")

    res, b0, a0, d0, t0 = _step("1. create Aegis (standard)", _create)
    aegis_id = res["character_id"]
    print(f"[step] character_id = {aegis_id}")
    report["steps"].append({"step": "create_aegis", "id": aegis_id, "gens_before": b0, "gens_after": a0, "gens_used": d0, "elapsed_s": t0})

    # Step 2: animate breathing-idle (template)
    def _idle():
        return px.animate_character(aegis_id, template_animation_id="breathing-idle", directions=["south"])

    _, b1, a1, d1, t1 = _step("2. animate breathing-idle (template south)", _idle)
    report["steps"].append({"step": "animate_idle_template", "gens_before": b1, "gens_after": a1, "gens_used": d1, "elapsed_s": t1})

    # Step 3: animate hit (v3 calibration)
    def _hit():
        return px.animate_character(
            aegis_id,
            action_description="getting hit and staggering",
            directions=["south"],
            frame_count=8,
        )

    _, b2, a2, d2, t2 = _step("3. animate hit v3 (frame_count=8 south)", _hit)
    report["steps"].append({"step": "animate_hit_v3", "gens_before": b2, "gens_after": a2, "gens_used": d2, "elapsed_s": t2})

    # Step 4: download ZIP
    out_dir = SPRITES_DIR / "aegis"

    def _zip():
        return px.download_zip(aegis_id, out_dir)

    files, _, _, _, t3 = _step("4. download aegis zip", _zip)
    report["steps"].append({"step": "download_zip", "files": [f.name for f in files], "out_dir": str(out_dir), "elapsed_s": t3})

    # Step 5: Gemini Schema island
    schema_raw = ISLANDS_DIR / "schema_raw.png"

    def _schema():
        return gi.generate(SCHEMA_ISLAND_PROMPT, schema_raw, model="gemini-3-pro-image-preview")

    res_path, _, _, _, t4 = _step("5. gemini schema island (gemini-3-pro-image-preview)", _schema)
    report["steps"].append({"step": "gemini_schema", "path": str(res_path), "bytes": res_path.stat().st_size, "elapsed_s": t4})

    print("\n=== REPORT ===")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    run()
