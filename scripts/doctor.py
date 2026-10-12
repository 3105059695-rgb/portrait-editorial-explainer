#!/usr/bin/env python3
"""Read-only prerequisite checks; no downloads, installs, credentials or config changes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys


SKILL_ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = (
    "SKILL.md", "agents/openai.yaml", "scripts/install_skill.py", "scripts/doctor.py",
    "scripts/new_project.py", "scripts/check_timeline.py", "references/approved-presenter-v3.md",
    "references/presenter-workflow.md", "references/visual-grammar.md", "references/timing-format.md",
    "references/approved-case.md", "assets/timing-example/timeline.json",
    "assets/timing-example/alignment-example.csv",
    "scripts/validate_storyboard.py", "scripts/compile_storyboard.py",
    "references/storyboard-contract.md", "references/storyboard.schema.json",
    "references/director-playbook.md", "references/repair-recipes.md",
)
CASES = {
    "adaptive-template": (
        "package.json", "package-lock.json", "tsconfig.json", "render.cjs",
        "src/index.ts", "src/Root.tsx", "src/episode.json",
    ),
    "presenter-v3-template": (
        "package.json", "package-lock.json", "tsconfig.json", "render.cjs", "src/index.ts",
        "src/Root.tsx", "src/FilmV3.tsx", "src/mediaConfig.ts", "src/fonts.ts", "src/captions.json",
        "src/PresenterPlaceholder.tsx", "src/ComicThreadV3.tsx", "src/CareerActionV3.tsx", "src/PropsV2.tsx",
        "public/media/interview-placeholder.svg", "public/media/openai-wordmark.svg", "public/media/lens-map-v3.png",
    ),
    "approved-remotion-case": (
        "package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "src/index.ts",
        "src/Root.tsx", "src/SyncedFilm.tsx", "src/SyncedOpening.tsx", "src/SyncedResearchEditor.tsx",
        "src/SyncedProof.tsx", "src/SyncedComic.tsx", "src/PaperRelay.tsx", "src/CalibratedPosters.tsx",
        "src/fonts.ts", "src/captions.json", "asset-manifest.json", "public/assets/catalog-page.png",
        "public/assets/kinetic-opening/lens-map.png", "public/assets/math-license.txt",
    ),
}


def lock_issues(root: Path) -> list[str]:
    """Compare package identity and root dependency declarations, not installed modules."""
    try:
        package = json.loads((root / "package.json").read_text(encoding="utf-8-sig"))
        lock = json.loads((root / "package-lock.json").read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        return [f"Cannot read package/lock JSON: {exc}"]
    if not isinstance(package, dict) or not isinstance(lock, dict):
        return ["package.json and package-lock.json must be JSON objects."]
    packages = lock.get("packages")
    locked_root = packages.get("") if isinstance(packages, dict) else None
    if not isinstance(locked_root, dict):
        return ["package-lock.json has no packages[''] root entry (lockfile v2/v3 required)."]
    issues = []
    for field in ("name", "version"):
        if not package.get(field) or lock.get(field) != package.get(field):
            issues.append(f"Top-level lock {field} differs from package.json.")
    for field in ("name", "version", "license", "dependencies", "devDependencies", "optionalDependencies", "engines", "os", "cpu"):
        default = {} if field in ("dependencies", "devDependencies", "optionalDependencies", "engines") else None
        if package.get(field, default) != locked_root.get(field, default):
            issues.append(f"Lock root {field} differs from package.json.")
    return issues


def probe_tool(name: str, arguments: list[str], version_pattern: str) -> dict:
    executable = shutil.which(name)
    if executable is None:
        return {"name": name, "ok": False, "path": None, "version": None, "detail": "Not found on PATH."}
    try:
        result = subprocess.run([executable, *arguments], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=15, check=False)
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {"name": name, "ok": False, "path": executable, "version": None, "detail": f"Version check failed: {type(exc).__name__}."}
    lines = (result.stdout + "\n" + result.stderr).splitlines()
    version = next((line.strip() for line in lines if re.match(version_pattern, line.strip())), None)
    ok = result.returncode == 0 and version is not None
    return {
        "name": name, "ok": ok, "path": executable, "version": version[:300] if version else None,
        "detail": "Version command passed." if ok else f"Version command failed or returned an unrecognized version (exit {result.returncode}).",
    }


def run_checks(profile: str) -> dict:
    checks: list[dict] = []
    python_ok = sys.version_info >= (3, 10)
    checks.append({"name": "Python", "tier": "skill", "ok": python_ok, "version": ".".join(map(str, sys.version_info[:3])), "path": sys.executable, "detail": "Python 3.10+ is required for the helper scripts."})
    expected = list(REQUIRED_FILES)
    expected.extend(f"assets/{case}/{relative}" for case, relatives in CASES.items() for relative in relatives)
    missing = [relative for relative in expected if not (SKILL_ROOT / relative).is_file()]
    checks.append({"name": "Skill and template files", "tier": "skill", "ok": not missing, "detail": f"Checked {len(expected)} required files.", "missing": missing})
    for case in CASES:
        issues = lock_issues(SKILL_ROOT / "assets" / case)
        checks.append({"name": f"Lock root: {case}", "tier": "skill", "ok": not issues, "detail": "Package/lock root declarations agree." if not issues else "; ".join(issues)})
    for name, arguments, pattern in (
        ("node", ["--version"], r"^v\d+\.\d+\.\d+(?:[-+].*)?$"),
        ("npm", ["--version"], r"^\d+\.\d+\.\d+(?:[-+].*)?$"),
        ("ffmpeg", ["-version"], r"^ffmpeg version\s+\S+"),
        ("ffprobe", ["-version"], r"^ffprobe version\s+\S+"),
    ):
        check = probe_tool(name, arguments, pattern)
        check["tier"] = "production"
        checks.append(check)
    for check in checks:
        check["required"] = check["tier"] == "skill" or profile == "production"
    passed = all(check["ok"] for check in checks if check["required"])
    return {
        "profile": profile, "ok": passed, "skill_root": str(SKILL_ROOT), "checks": checks,
        "integration": {
            "name": "ChatCut MCP", "status": "not_checked", "expected": "mcp__chatcut tools connected in the agent session",
            "detail": "Python cannot verify ChatCut connection, authentication or account access. Check those in the agent before rough-cutting live-action footage. Digital-human footage skips rough-cutting by default.",
        },
        "notes": [
            "The skill profile checks the local Skill bundle and Python helpers. Reading SKILL.md itself does not require video tools.",
            "The production profile additionally requires working Node.js, npm, FFmpeg and ffprobe version commands for this documented workflow.",
            "node_modules is not required or inspected. No packages, browser binaries or media are downloaded by this check.",
            "Version output proves a tool can start; it does not establish dependency compatibility, browser readiness, a successful render, media rights or audiovisual quality.",
            "After choosing a new project and authorizing dependency downloads, run npm ci there and validate that project's actual render.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", choices=("skill", "production"), default="production", help="Required tier: skill (bundle/Python) or production (also video tools; default).")
    parser.add_argument("--json", action="store_true", help="Print structured JSON instead of human-readable output.")
    args = parser.parse_args()
    report = run_checks(args.profile)
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"{'PASS' if report['ok'] else 'FAIL'}: {args.profile} prerequisites")
        for check in report["checks"]:
            status = "OK" if check["ok"] else ("MISSING" if check["required"] else "OPTIONAL")
            version = f" ({check['version']})" if check.get("version") else ""
            print(f"[{status}] {check['name']}{version}: {check['detail']}")
            for missing in check.get("missing", []):
                print(f"  Missing: {missing}")
        print(f"[MANUAL] ChatCut MCP: {report['integration']['detail']}")
        print(f"Expected integration: {report['integration']['expected']}")
        for note in report["notes"]:
            print(note)
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
