#!/usr/bin/env python3
"""Compile this episode's storyboard, or explicitly copy a calibration case."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys


SKILL_ROOT = Path(__file__).resolve().parents[1]
IGNORED = shutil.ignore_patterns("node_modules", "out", ".git", ".env", ".env.*", "__pycache__", "*.pyc")


def create_episode(input_path: Path, destination: Path, media_dir: Path | None, *, draft: bool) -> int:
    """Use the storyboard compiler's preflight and copy checks without bypasses."""
    try:
        supplied=json.loads(input_path.read_text(encoding='utf-8-sig'))
        if isinstance(supplied,dict) and supplied.get('version')==3:
            from source_episode import build, Invalid
            build(input_path,destination,media_dir or input_path.parent,production=not draft)
            print(f'Created full effect-library episode: {destination}')
            print('Next: npm ci; npm run dev; npm run render (opening); npm run render:full (when requested).')
            return 0
    except (OSError,ValueError,TypeError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr);return 1
    import compile_storyboard as compiler

    try:
        plan = compiler.prepare_build(input_path, destination, media_dir, draft=draft)
        compiler.validator.print_issues(plan["validation"])
        if not plan["validation"]["valid"]:
            print("No output was written. Correct the storyboard errors and rerun.", file=sys.stderr)
            return 1
        # Include the direction in the same checked copy plan, before any write.
        # Do not inject a workstation path or silently replace a template file.
        relative = Path("STYLE_TARGET.md")
        if any(entry["relative"].as_posix().casefold() == relative.as_posix().casefold() for entry in plan["files"]) or any(path.as_posix().casefold() == relative.as_posix().casefold() for path in plan["directories"]):
            raise compiler.CompileError("STYLE_TARGET.md", "reserved style direction path collides with the template", "Restore the bundled template without a conflicting STYLE_TARGET.md file or directory.")
        direction = SKILL_ROOT / "references" / "approved-editing-direction.md"
        if not direction.is_file():
            raise compiler.CompileError("style direction", "approved editing direction is missing", "Restore references/approved-editing-direction.md from the complete Skill package.")
        entry = compiler.snapshot_file(direction, relative, "style direction")
        if entry["bytes"] == 0:
            raise compiler.CompileError("style direction", "approved editing direction is empty", "Restore references/approved-editing-direction.md from the complete Skill package.")
        plan["files"].append(entry)
        report = json.loads(plan["report"])
        report["styleTarget"] = {"path": relative.as_posix(), "sha256": entry["sha256"], "bytes": entry["bytes"]}
        plan["report"] = (json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
        compiler.execute_build(plan)
    except (compiler.CompileError, OSError, UnicodeError, ValueError, RecursionError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print("Preflight failures write nothing. A copy/I/O failure may leave an incomplete new project; existing files are never deleted or replaced.", file=sys.stderr)
        return 1
    print(f"Created {'DRAFT / 示意' if draft else 'production-input'} episode project: {plan['destination']}")
    print("Compiled the supplied storyboard and media; saved STYLE_TARGET.md and BUILD_REPORT.json.")
    print("先按 STYLE_TARGET.md 制作本期开头 10–15 秒，人工确认风格后再延展全片。")
    print("结构检查不代表剪辑风格通过；不得直接把校准案例或通用 UI 演示当成本期成片。")
    print("No dependencies were installed and no video was rendered. Next: npm ci; npm run dev.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="This episode's UTF-8 v3 effect-library JSON or v2 free-layer storyboard.")
    parser.add_argument("--media-dir", type=Path, help="Media root for relative asset paths (default: input JSON's directory).")
    parser.add_argument("--draft", action="store_true", help="Compile an explicitly marked draft using the storyboard compiler's draft checks.")
    parser.add_argument("--case", choices=("source-style", "adaptive", "presenter-v3", "approved-reference"), help="Explicit calibration/helper case only; never selected automatically.")
    parser.add_argument("--out", required=True, type=Path, help="Destination must not exist or must be empty.")
    args = parser.parse_args()
    if args.case is not None and (args.input is not None or args.media_dir is not None or args.draft):
        parser.error("--case cannot be combined with --input, --media-dir or --draft; choose an episode build or an explicit calibration case.")
    if args.case is None:
        if args.input is None:
            parser.error("需要本期分镜 JSON：--input PLAN --media-dir MEDIA_ROOT --out NEW [--draft]。不会自动生成 UI 演示或套用旧 V3。仅查看风格校准示例时，可显式运行：--case presenter-v3 --out NEW")
        return create_episode(args.input, args.out, args.media_dir, draft=args.draft)
    if args.case == "source-style":
        from source_episode import build, Invalid
        try:
            build(SKILL_ROOT / "assets/source-style-template/src/episode.json", args.out, SKILL_ROOT / "assets/source-style-template/public")
        except (Invalid, OSError, ValueError) as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 2
        print(f"Created source-style UI helper calibration case: {args.out}")
        print("仅辅助 UI 组件校准，不是视频剪辑风格默认，也不是本期成片。")
        print("For an episode, supply its storyboard with --input PLAN --media-dir MEDIA_ROOT --out NEW.")
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
    print(f"Created explicit editable calibration case: {destination}")
    print("这是校准/辅助案例，不是默认成片；必须按本期口播重新编排。")
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
