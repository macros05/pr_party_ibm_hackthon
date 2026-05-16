"""Reorganize a downloaded PixelLab character export into a canonical layout.

Source structure (from ZIP):
  {character_dir}/
    <ugly_description_slug>/
      rotations/{direction}.png
      animations/<ugly_anim_slug>/south/frame_NNN.png
    metadata.json

Target structure:
  {character_dir}/
    rotations/{direction}.png
    animations/{friendly}/south/frame_NNN.png
    metadata.json
    manifest.json   (per-character: anim -> {frames, fps, loop})
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

# Map folder prefix -> friendly name. Frame count is a tiebreaker for
# generic prefixes (e.g. plain "animating-" comes from breathing-idle when we
# forgot animation_name).
PREFIX_MAP: dict[str, str] = {
    "walking": "walk",
    "looking_around_and_scanning": "scan",
    "cheering_victory_pose": "victory",
    "getting_hit_and_staggering": "hit",
    # breathing-idle template with no animation_name:
    "animating": "idle",
}

# Default playback metadata per friendly name.
ANIM_DEFAULTS: dict[str, dict] = {
    "idle":    {"fps": 6,  "loop": True},
    "walk":    {"fps": 10, "loop": True},
    "scan":    {"fps": 8,  "loop": True},
    "victory": {"fps": 10, "loop": False},
    "hit":     {"fps": 12, "loop": False},
    "float":   {"fps": 4,  "loop": True},
}


def _friendly_name(folder_name: str) -> str | None:
    base = folder_name.rsplit("-", 1)[0]  # strip "-hash"
    return PREFIX_MAP.get(base)


def reorganize(character_dir: Path) -> dict:
    """Flatten one character dir into the canonical layout. Returns manifest dict."""
    # Find the single state subdir (ugly slug)
    state_dirs = [d for d in character_dir.iterdir() if d.is_dir() and d.name not in {"rotations", "animations"}]
    if not state_dirs:
        # already reorganized
        state_dir = None
    elif len(state_dirs) == 1:
        state_dir = state_dirs[0]
    else:
        raise RuntimeError(f"expected 1 state dir, got {len(state_dirs)} in {character_dir}")

    if state_dir is not None:
        # rotations: move {state}/rotations/*.png -> {character}/rotations/*.png
        src_rot = state_dir / "rotations"
        if src_rot.exists():
            dst_rot = character_dir / "rotations"
            dst_rot.mkdir(parents=True, exist_ok=True)
            for f in src_rot.iterdir():
                shutil.move(str(f), str(dst_rot / f.name))

        # animations: move {state}/animations/<ugly>/south/*.png -> {character}/animations/<friendly>/south/*.png
        src_anim = state_dir / "animations"
        if src_anim.exists():
            dst_anim = character_dir / "animations"
            dst_anim.mkdir(parents=True, exist_ok=True)
            for ugly_dir in src_anim.iterdir():
                if not ugly_dir.is_dir():
                    continue
                friendly = _friendly_name(ugly_dir.name)
                if not friendly:
                    print(f"[reorg] WARN no mapping for {ugly_dir.name}, keeping ugly name", file=sys.stderr)
                    friendly = ugly_dir.name
                dst = dst_anim / friendly
                if dst.exists():
                    print(f"[reorg] WARN target {dst} exists, skipping {ugly_dir}", file=sys.stderr)
                    continue
                shutil.move(str(ugly_dir), str(dst))

        # remove now-empty state dir
        shutil.rmtree(state_dir, ignore_errors=True)

    # Build manifest by listing animations folder
    manifest: dict = {"animations": {}, "rotations": []}
    rot_dir = character_dir / "rotations"
    if rot_dir.exists():
        manifest["rotations"] = sorted(f.stem for f in rot_dir.glob("*.png"))
    anim_root = character_dir / "animations"
    if anim_root.exists():
        for adir in sorted(anim_root.iterdir()):
            if not adir.is_dir():
                continue
            south = adir / "south"
            if not south.exists():
                continue
            frames = sorted(f.name for f in south.glob("frame_*.png"))
            if not frames:
                continue
            defaults = ANIM_DEFAULTS.get(adir.name, {"fps": 8, "loop": True})
            manifest["animations"][adir.name] = {
                "frames": frames,
                "frame_count": len(frames),
                "south_dir": f"animations/{adir.name}/south",
                **defaults,
            }

    # Sample frame size from rotations south.png if present
    south_png = rot_dir / "south.png"
    if south_png.exists():
        try:
            from PIL import Image
            with Image.open(south_png) as im:
                manifest["frame_size"] = list(im.size)
        except Exception:
            pass

    out_manifest = character_dir / "manifest.json"
    out_manifest.write_text(json.dumps(manifest, indent=2))
    print(f"[reorg] {character_dir.name}: {len(manifest['animations'])} anims, manifest at {out_manifest}")
    return manifest


if __name__ == "__main__":
    target = Path(sys.argv[1])
    reorganize(target)
