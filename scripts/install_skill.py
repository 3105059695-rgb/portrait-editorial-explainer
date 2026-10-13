#!/usr/bin/env python3
"""Install this Skill into a new or empty directory without installing dependencies."""

from __future__ import annotations

import argparse
import fnmatch
import os
from pathlib import Path
import shutil
import stat
import sys


SKILL_NAME = "portrait-editorial-explainer"
SOURCE_ROOT = Path(__file__).absolute().parents[1]
REQUIRED_ENTRIES = ("SKILL.md", "agents", "scripts", "references", "assets")
OPTIONAL_ENTRIES = ("README.md", "docs", "examples", "LICENSE", "THIRD_PARTY_NOTICES.md", "installer", "Install-Windows.cmd", "INSTALL_AGENT.md")
IGNORED_PATTERNS = (
    "node_modules", "out", ".git", "__pycache__", ".env", ".env.*", "*.pyc", "*.pyo",
    ".pytest_cache", ".mypy_cache", ".ruff_cache", ".coverage", ".coverage.*", "htmlcov",
    "coverage", "test-results", "test-output", "test-outputs", "playwright-report",
)


class InstallError(ValueError):
    """An unsafe or incomplete installation request."""


def is_link(path: Path) -> bool:
    """Also reject Windows junctions/reparse points on Python 3.10."""
    if path.is_symlink():
        return True
    try:
        attributes = getattr(path.lstat(), "st_file_attributes", 0)
    except FileNotFoundError:
        return False
    return bool(attributes & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400))


def reject_link_ancestors(path: Path) -> None:
    for candidate in (path, *path.parents):
        if is_link(candidate):
            raise InstallError(f"Symbolic links or junctions are not allowed: {candidate}")


def default_skills_dir() -> Path:
    codex_home = os.environ.get("CODEX_HOME")
    return (Path(codex_home).expanduser() if codex_home else Path.home() / ".codex") / "skills"


def ensure_empty_destination(destination: Path) -> None:
    reject_link_ancestors(destination)
    if destination.exists() and (not destination.is_dir() or any(destination.iterdir())):
        raise InstallError(f"Destination is not an empty directory: {destination}")


def build_plan(source: Path, destination: Path) -> tuple[Path, Path, list[Path], list[Path]]:
    source = source.expanduser().absolute()
    destination = destination.expanduser().absolute()
    reject_link_ancestors(source)
    reject_link_ancestors(destination)
    source, destination = source.resolve(), destination.resolve()
    if destination == source or source in destination.parents or destination in source.parents:
        raise InstallError("Choose a destination outside the source folder and its ancestors.")
    ensure_empty_destination(destination)
    for entry in REQUIRED_ENTRIES:
        path = source / entry
        if not path.exists():
            raise InstallError(f"Required Skill entry is missing: {path}")
        if (entry == "SKILL.md" and not path.is_file()) or (entry != "SKILL.md" and not path.is_dir()):
            raise InstallError(f"Required Skill entry has the wrong file type: {path}")

    directories: list[Path] = []
    files: list[Path] = []

    def visit(path: Path) -> None:
        if is_link(path):
            raise InstallError(f"Refusing to copy a symbolic link or junction: {path}")
        if any(fnmatch.fnmatchcase(path.name.casefold(), pattern) for pattern in IGNORED_PATTERNS):
            return
        relative = path.relative_to(source)
        if path.is_dir():
            directories.append(relative)
            for child in sorted(path.iterdir(), key=lambda item: item.name):
                visit(child)
        elif path.is_file():
            files.append(relative)
        else:
            raise InstallError(f"Only regular files and directories can be copied: {path}")

    for entry in (*REQUIRED_ENTRIES, *OPTIONAL_ENTRIES):
        path = source / entry
        if path.exists() or is_link(path):
            visit(path)
    return source, destination, directories, files


def install(source: Path, destination: Path, *, dry_run: bool = False) -> tuple[Path, int]:
    source, destination, directories, files = build_plan(source, destination)
    if dry_run:
        return destination, len(files)
    # Repeat the destination check immediately before writing. Never delete or replace files.
    ensure_empty_destination(destination)
    destination.mkdir(parents=True, exist_ok=True)
    for relative in directories:
        (destination / relative).mkdir(parents=True, exist_ok=True)
    for relative in files:
        origin, target = source / relative, destination / relative
        reject_link_ancestors(origin)
        reject_link_ancestors(target)
        # Exclusive creation also protects files added after the initial empty-directory check.
        with origin.open("rb") as reader, target.open("xb") as writer:
            shutil.copyfileobj(reader, writer)
        shutil.copystat(origin, target, follow_symlinks=False)
    return destination, len(files)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills-dir", type=Path, help="Parent Skills directory (default: $CODEX_HOME/skills or ~/.codex/skills).")
    parser.add_argument("--dry-run", action="store_true", help="Validate and report the planned copy without writing anything.")
    args = parser.parse_args()
    destination = (args.skills_dir if args.skills_dir is not None else default_skills_dir()) / SKILL_NAME
    try:
        destination, count = install(SOURCE_ROOT, destination, dry_run=args.dry_run)
    except (InstallError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        print("Nothing existing was deleted or replaced. A failed copy may leave a partial new directory.", file=sys.stderr)
        print("Recovery: inspect the destination; back up and move an old/partial folder yourself, or choose another --skills-dir.", file=sys.stderr)
        print("Then rerun this command. There is no --force option and no automatic cleanup.", file=sys.stderr)
        return 1
    print(f"{'Dry run: would copy' if args.dry_run else 'Installed'} {count} files to {destination}")
    print("Dependencies, credentials and agent configuration were not changed.")
    if not args.dry_run:
        print("Restart or refresh the agent if the Skill is not listed, then invoke portrait-editorial-explainer.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
