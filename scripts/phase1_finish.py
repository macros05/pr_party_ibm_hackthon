"""Finish Phase 1: wait for in-flight animations -> download ZIP -> Schema island."""

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
AEGIS_ID = "548b096b-85eb-4cab-a3aa-b75f802a42e8"

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


def main() -> None:
    bal_start = px.get_balance()
    print(f"[finish] start balance: {bal_start}")

    # Step A: wait for ZIP ready, then download
    out_dir = SPRITES_DIR / "aegis"
    t0 = time.monotonic()
    px.wait_for_zip_ready(AEGIS_ID, timeout=240)
    print(f"[finish] zip ready after {time.monotonic() - t0:.1f}s")
    files = px.download_zip(AEGIS_ID, out_dir)
    print(f"[finish] downloaded {len(files)} files into {out_dir}")
    for f in sorted(files):
        size = f.stat().st_size
        print(f"  - {f.name} ({size} bytes)")

    bal_after_zip = px.get_balance()
    print(f"[finish] balance after zip: {bal_after_zip}")

    # Step B: Schema island via Gemini-3-pro-image-preview
    schema_raw = ISLANDS_DIR / "schema_raw.png"
    t1 = time.monotonic()
    try:
        gi.generate(SCHEMA_ISLAND_PROMPT, schema_raw, model="gemini-3-pro-image-preview")
    except Exception as exc:
        print(f"[finish] Gemini 3 Pro FAILED: {exc}")
        print("[finish] downgrading to gemini-2.5-flash-image")
        gi.generate(SCHEMA_ISLAND_PROMPT, schema_raw, model="gemini-2.5-flash-image")
    t_island = time.monotonic() - t1
    size = schema_raw.stat().st_size
    print(f"[finish] schema island -> {schema_raw} ({size} bytes, {t_island:.1f}s)")

    report = {
        "balance_start": bal_start,
        "balance_after_zip": bal_after_zip,
        "aegis_files": [f.name for f in sorted(files)],
        "aegis_dir": str(out_dir),
        "schema_island": str(schema_raw),
        "schema_bytes": size,
        "schema_elapsed_s": t_island,
    }
    print("\n=== FINAL ===")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
