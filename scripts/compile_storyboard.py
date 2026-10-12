#!/usr/bin/env python3
"""Compile a validated v2 JSON plan into a new editable project (no network/install)."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import fnmatch
import hashlib
import importlib.util
import json
from pathlib import Path
import stat
import sys


SCRIPT_ROOT = Path(__file__).absolute().parent
SKILL_ROOT = SCRIPT_ROOT.parent
TEMPLATE_ROOT = SKILL_ROOT / "assets" / "adaptive-template"
IGNORED = ("node_modules", "out", ".git", "__pycache__", ".env", ".env.*", "*.pyc", "*.pyo", "test-results", "playwright-report", ".pytest_cache")


def load_validator():
    # Loading by sibling path works both as a CLI and under importlib/tests, and
    # does not accidentally import a similarly named module from another cwd.
    spec = importlib.util.spec_from_file_location("portrait_storyboard_validator", SCRIPT_ROOT / "validate_storyboard.py")
    if spec is None or spec.loader is None:
        raise RuntimeError("Missing sibling validate_storyboard.py; restore the complete scripts folder.")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load_validator()


class CompileError(ValueError):
    def __init__(self, path, message, fix):
        self.issue = {"path": path, "message": message, "fix": fix}
        super().__init__(f"{path}: {message} Fix: {fix}")


def is_link(path):
    if path.is_symlink():
        return True
    try:
        attributes = getattr(path.lstat(), "st_file_attributes", 0)
    except FileNotFoundError:
        return False
    return bool(attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))


def reject_link_ancestors(path, field):
    for candidate in (path, *path.parents):
        if is_link(candidate):
            raise CompileError(field, "symbolic links and Windows junctions/reparse points are not allowed", "Copy the actual files into a regular local directory and use that path.")


def regular_path(path, field):
    path = Path(path).expanduser().absolute()
    reject_link_ancestors(path, field)
    return path.resolve()


def ensure_empty_destination(destination):
    reject_link_ancestors(destination, "--out")
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise CompileError("--out", "destination already exists and is not an empty directory", "Choose a new or empty output folder; the compiler never deletes or overwrites existing files.")


def file_signature(path):
    value = path.stat()
    return (value.st_size, value.st_mtime_ns, value.st_dev, value.st_ino)


def snapshot_file(origin, relative, field):
    reject_link_ancestors(origin, field)
    if not origin.is_file():
        raise CompileError(field, f"referenced regular file is missing: {relative}", "Place the actual file under --media-dir using the exact relative path, or correct the JSON reference.")
    before = file_signature(origin)
    digest = hashlib.sha256()
    with origin.open("rb") as stream:
        while chunk := stream.read(1024 * 1024):
            digest.update(chunk)
    if before != file_signature(origin):
        raise CompileError(field, "source file changed during preflight", "Wait for the export/save to finish, then rerun the compiler.")
    return {"origin": origin, "relative": relative, "field": field, "signature": before, "sha256": digest.hexdigest(), "bytes": before[0]}


def media_references(data):
    for name in ("presenter", "voice", "music"):
        value = data["media"].get(name)
        if value is not None:
            yield f"$.media.{name}", value
    for index, asset in enumerate(data["assets"]):
        yield f"$.assets[{index}].path", asset["path"]


def prepare_build(input_path, destination, media_dir=None, *, draft=False, template_root=None):
    """Complete validation, file inventory, and hashing before any output write."""
    input_path = regular_path(input_path, "--input")
    destination = regular_path(destination, "--out")
    template = regular_path(template_root or TEMPLATE_ROOT, "template")
    skill_root = regular_path(SKILL_ROOT, "template")
    media_root = regular_path(media_dir if media_dir is not None else input_path.parent, "--media-dir")
    for protected in (skill_root, template):
        if destination == protected or protected in destination.parents or destination in protected.parents:
            raise CompileError("--out", "destination overlaps the Skill/template or one of its ancestors", "Choose a new output folder outside the installed Skill and template tree.")
    if destination == media_root or destination in media_root.parents or destination == input_path or destination in input_path.parents:
        raise CompileError("--out", "destination would contain or replace input/source data", "Choose a separate new output directory that is not an ancestor of input or media sources.")
    ensure_empty_destination(destination)
    try:
        data, raw = validator.load_storyboard(input_path)
    except (OSError, UnicodeError, ValueError, RecursionError) as exc:
        raise CompileError("$", f"cannot read unambiguous UTF-8 JSON: {exc}", "Correct the input path, encoding or JSON syntax and rerun.") from exc
    mode = "draft" if draft else "production"
    report = validator.validate_storyboard(data, mode)
    if not report["valid"]:
        return {"validation": report, "destination": destination}
    if not media_root.is_dir():
        raise CompileError("--media-dir", "media source root is not a directory", "Supply the directory containing all media/asset relative paths (default: input JSON directory).")
    if not template.is_dir() or not (template / "package.json").is_file() or not (template / "src").is_dir():
        raise CompileError("template", "adaptive template is incomplete or missing", "Restore assets/adaptive-template with package.json and src, then compile again.")

    files, directories, occupied = [], set(), {}

    def reserve(relative, field):
        key = relative.as_posix().casefold()
        if key in occupied:
            raise CompileError(field, f"output path collides with {occupied[key]}: {relative.as_posix()}", "Rename the media path in the JSON and source folder to a unique portable path.")
        occupied[key] = field

    for generated in (Path("src/episode.json"), Path("BUILD_REPORT.json")):
        reserve(generated, "compiler generated file")

    def visit(path):
        reject_link_ancestors(path, "template")
        if any(fnmatch.fnmatchcase(path.name.casefold(), pattern) for pattern in IGNORED):
            return
        relative = path.relative_to(template)
        if relative.as_posix() in {"src/episode.json", "BUILD_REPORT.json"}:
            if not path.is_file():
                raise CompileError("template", "generated file location is not a regular file", "Restore the adaptive template directory layout.")
            return
        if path.is_dir():
            directories.add(relative)
            for child in sorted(path.iterdir(), key=lambda item: item.name):
                visit(child)
        elif path.is_file():
            reserve(relative, "template")
            files.append(snapshot_file(path, relative, "template"))
        else:
            raise CompileError("template", "template contains a nonregular file", "Keep only ordinary files and directories in the template.")

    for child in sorted(template.iterdir(), key=lambda item: item.name):
        visit(child)

    copied_media = {}
    for field, relative_text in media_references(data):
        # This has already passed the JSON validator. Keep this check close to I/O.
        if validator.media_path_error(relative_text):
            raise CompileError(field, "unsafe media path", "Use a local relative path with forward slashes and no '..' segments.")
        relative = Path(*relative_text.split("/"))
        origin = regular_path(media_root / relative, field)
        if not origin.is_relative_to(media_root):
            raise CompileError(field, "resolved file escapes --media-dir", "Put the real file inside the media root without links/junctions.")
        if destination == origin or destination in origin.parents:
            raise CompileError("--out", "destination would contain a referenced input file", "Choose a separate new project directory.")
        output_relative = Path("public") / relative
        previous = copied_media.get(output_relative.as_posix().casefold())
        if previous:
            if previous["relative"] != output_relative:
                raise CompileError(field, "two media paths differ only in case", "Use the same exact relative spelling for a shared file.")
            previous["references"].append(field)
            continue
        reserve(output_relative, field)
        entry = snapshot_file(origin, output_relative, field)
        if entry["bytes"] == 0:
            raise CompileError(field, "referenced media file is empty", "Finish exporting the actual media; an empty placeholder cannot be compiled as a supplied asset.")
        entry["references"] = [field]
        copied_media[output_relative.as_posix().casefold()] = entry
        files.append(entry)
        directories.update(parent for parent in output_relative.parents if parent != Path("."))

    # Detect file/directory and case-only collisions before creating even an empty output folder.
    for relative in directories:
        if relative.as_posix().casefold() in occupied:
            raise CompileError("--out", f"planned file/directory collision at {relative.as_posix()}", "Rename the conflicting media path and compile again.")
    directory_keys = {}
    for relative in directories:
        key = relative.as_posix().casefold()
        if key in directory_keys and directory_keys[key] != relative:
            raise CompileError("--out", "planned directories differ only in case", "Use consistent case in all media directory names.")
        directory_keys[key] = relative

    # Preserve every user field; the compiler only stamps explicit build mode.
    episode = dict(data)
    episode["renderMode"] = mode
    episode_bytes = (json.dumps(episode, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")
    build_report = {
        "compiler": "portrait-editorial-explainer/storyboard-v2",
        "createdUtc": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "sourceJson": {"filename": input_path.name, "sha256": hashlib.sha256(raw).hexdigest()},
        "episodeSha256": hashlib.sha256(episode_bytes).hexdigest(),
        "video": {key: data[key] for key in ("title", "duration", "fps", "width", "height")},
        "validation": report,
        "media": [{"path": entry["relative"].relative_to("public").as_posix(), "sha256": entry["sha256"], "bytes": entry["bytes"], "references": entry["references"]} for entry in copied_media.values()],
        "templateFiles": [{"path": entry["relative"].as_posix(), "sha256": entry["sha256"]} for entry in files if "references" not in entry],
        "verificationBoundary": "Checked JSON structure, declared timing, path safety and file bytes. Did not verify codec/decode, actual voice alignment, facts, asset rights, or the truth of ChatCut/roughcut declarations. Review the actual ChatCut project/export and media before production.",
    }
    return {"validation": report, "destination": destination, "files": files, "directories": directories, "episode": episode_bytes, "report": (json.dumps(build_report, ensure_ascii=False, indent=2, allow_nan=False) + "\n").encode("utf-8")}


def execute_build(plan):
    if not plan["validation"]["valid"]:
        raise CompileError("$", "invalid storyboard cannot be compiled", "Correct every reported JSON field before compiling.")
    destination = plan["destination"]
    ensure_empty_destination(destination)
    # Revalidate every source before the first output write, then again per copy.
    for entry in plan["files"]:
        reject_link_ancestors(entry["origin"], entry["field"])
        if file_signature(entry["origin"]) != entry["signature"]:
            raise CompileError(entry["field"], "source changed after preflight", "Finish saves/exports and run compilation again.")
    destination.mkdir(parents=True, exist_ok=True)
    for relative in sorted(plan["directories"], key=lambda item: (len(item.parts), item.as_posix())):
        target = destination / relative
        reject_link_ancestors(target, "--out")
        target.mkdir(parents=True, exist_ok=True)
    for entry in plan["files"]:
        target = destination / entry["relative"]
        reject_link_ancestors(entry["origin"], entry["field"])
        reject_link_ancestors(target, "--out")
        target.parent.mkdir(parents=True, exist_ok=True)
        digest = hashlib.sha256()
        with entry["origin"].open("rb") as reader, target.open("xb") as writer:
            while chunk := reader.read(1024 * 1024):
                writer.write(chunk)
                digest.update(chunk)
        if digest.hexdigest() != entry["sha256"]:
            raise CompileError(entry["field"], "source changed while copying; new project is incomplete", "Inspect and move aside the partial new directory, then rerun to another new empty folder.")
    for relative, content in (("src/episode.json", plan["episode"]), ("BUILD_REPORT.json", plan["report"])):
        target = destination / relative
        reject_link_ancestors(target, "--out")
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("xb") as writer:
            writer.write(content)
    return destination


def compile_storyboard(input_path, destination, media_dir=None, *, draft=False, template_root=None):
    plan = prepare_build(input_path, destination, media_dir, draft=draft, template_root=template_root)
    if plan["validation"]["valid"]:
        execute_build(plan)
    return plan


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="UTF-8 v2 storyboard JSON.")
    parser.add_argument("--out", required=True, type=Path, help="New or empty editable project directory.")
    parser.add_argument("--media-dir", type=Path, help="Root for media/asset paths (default: input JSON's directory).")
    parser.add_argument("--draft", action="store_true", help="Allow explicitly marked previews with estimated timing or missing unsupplied media.")
    args = parser.parse_args()
    try:
        plan = compile_storyboard(args.input, args.out, args.media_dir, draft=args.draft)
        validator.print_issues(plan["validation"])
        if not plan["validation"]["valid"]:
            print("No output was written. Correct the field errors and rerun.", file=sys.stderr)
            return 1
    except (CompileError, OSError, UnicodeError, ValueError, RecursionError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print("Existing files were not deleted or replaced. A preflight failure writes nothing; a copy/I/O failure may leave a partial new project. Inspect it and choose a new empty --out before retrying.", file=sys.stderr)
        return 1
    print(f"Created {'DRAFT / 示意' if args.draft else 'production-input'} editable project: {plan['destination']}")
    print("Saved src/episode.json, referenced local media, and BUILD_REPORT.json with source/media hashes.")
    print("No AI calls, network access, dependency installation, or rendering were performed.")
    print("Next in the new project: npm ci; npm run dev. Review actual voice alignment, ChatCut export and asset provenance before rendering.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
