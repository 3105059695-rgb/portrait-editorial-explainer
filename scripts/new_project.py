#!/usr/bin/env python3
"""Copy a bundled editable motion case to a new or empty local folder."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import sys


SKILL_ROOT = Path(__file__).resolve().parents[1]
IGNORED = shutil.ignore_patterns("node_modules", "out", ".git", ".env", ".env.*", "__pycache__", "*.pyc")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", default="source-style", choices=("source-style", "adaptive", "presenter-v3", "approved-reference"))
    parser.add_argument("--out", required=True, type=Path, help="Destination must not exist or must be empty.")
    args = parser.parse_args()
    if args.case == "source-style":
        from source_episode import build, Invalid
        try:
            build(SKILL_ROOT / "assets/source-style-template/src/episode.json", args.out, SKILL_ROOT / "assets/source-style-template/public")
        except (Invalid, OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        print(f"Created source-style v3 project: {args.out}")
        print("Silent mechanism demo only. Replace episode.json using actual final narration.")
        print("Next: npm ci; npm run check; npm run render (opening only).")
        return 0
    case_folder = {"adaptive": "adaptive-template", "presenter-v3": "presenter-v3-template", "approved-reference": "approved-remotion-case"}[args.case]
    source = SKILL_ROOT / "assets" / case_folder
    destination = args.out.expanduser().resolve()
    if not (source / "package.json").is_file():
        print("ERROR: Bundled approved reference case is missing package.json.", file=sys.stderr)
        return 2
    if destination == SKILL_ROOT or SKILL_ROOT in destination.parents or destination in SKILL_ROOT.parents:
        print("ERROR: Choose a destination outside the installed Skill folder and its ancestors.", file=sys.stderr)
        return 2
    try:
        if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
            print("ERROR: Destination already exists and is not an empty directory; nothing was overwritten.", file=sys.stderr)
            return 2
        # Source links could unexpectedly pull private local files into a new project.
        if any(item.is_symlink() for item in source.rglob("*")):
            print("ERROR: Bundled case contains a symbolic link; refusing to copy.", file=sys.stderr)
            return 2
        destination.mkdir(parents=True, exist_ok=True)
        shutil.copytree(source, destination, dirs_exist_ok=True, ignore=IGNORED)
    except OSError as exc:
        print(f"ERROR: Copy failed; partial files may remain at {destination}: {exc}", file=sys.stderr)
        return 2
    print(f"Created editable reference project: {destination}")
    if args.case == "adaptive":
        print("Adaptive portrait engine: edit src/episode.json or compile a new storyboard JSON.")
        print("Scene order, duration, objects, assets and action timing come from the storyboard.")
        print("The bundled episode is a silent draft demonstration, not a finished new-topic video.")
        print("For your plan, use scripts/compile_storyboard.py --input PLAN --out NEW_PROJECT.")
    elif args.case == "presenter-v3":
        print("V3 portrait motion sample: 1080 x 1920, 50 fps, 10.74 seconds.")
        print("Presenter and interview use placeholders; audio is intentionally empty.")
        print("Configure src/mediaConfig.ts and rebuild captions, timing and shots for the new narration.")
        print("The historical topic and duration are examples, not automatic fitting for a new video.")
    else:
        print("This is a silent historical style case at its original 816 x 1080 ratio.")
        print("Its old topic and timings are examples, not a new-topic script or a 9:16 layout.")
    print("Choose objects and actions from the new narration, not the historical career topic.")
    print("Dependencies were not installed. Next: cd to this folder; npm ci; npm run dev.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
