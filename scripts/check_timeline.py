#!/usr/bin/env python3
"""Validate narration-linked motion events; optionally export a UTF-8 CSV."""

from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
import sys


def number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def nonempty(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def validate(data: object) -> tuple[list[str], list[dict]]:
    errors: list[str] = []
    rows: list[dict] = []
    if not isinstance(data, dict):
        return ["Root must be a JSON object."], rows
    fps, duration = data.get("fps"), data.get("duration")
    if not number(fps) or fps <= 0:
        errors.append("fps must be a finite positive number.")
    if not number(duration) or duration <= 0:
        errors.append("duration must be a finite positive number of seconds.")
    captions, events = data.get("captions"), data.get("events")
    if not isinstance(captions, list) or not captions:
        errors.append("captions must be a nonempty array.")
        captions = []
    if not isinstance(events, list) or not events:
        errors.append("events must be a nonempty array.")
        events = []

    cue_by_id: dict[str, dict] = {}
    seen_cue_ids: set[str] = set()
    tracks: dict[str, list[dict]] = {}
    valid_duration = number(duration) and duration > 0
    epsilon = 1e-7
    for index, cue in enumerate(captions):
        label = f"captions[{index}]"
        if not isinstance(cue, dict):
            errors.append(f"{label} must be an object.")
            continue
        cid = cue.get("id")
        if not nonempty(cid):
            errors.append(f"{label}.id must be a nonempty stable string.")
        elif cid in seen_cue_ids:
            errors.append(f"Duplicate caption id: {cid}")
        else:
            seen_cue_ids.add(cid)
        if not nonempty(cue.get("text")):
            errors.append(f"{label}.text must be a nonempty string.")
        track = cue.get("track", "main")
        if not nonempty(track):
            errors.append(f"{label}.track must be a nonempty string when present.")
        start, end = cue.get("start"), cue.get("end")
        valid_times = number(start) and number(end) and 0 <= start < end
        if not valid_times:
            errors.append(f"{label}: require finite times 0 <= start < end.")
        elif valid_duration and end > duration + epsilon:
            errors.append(f"{label}: caption ends outside the project duration.")
        if valid_times and nonempty(cid):
            # Preserve the first definition: duplicates already make validation fail.
            cue_by_id.setdefault(cid, cue)
            if nonempty(track):
                tracks.setdefault(track, []).append(cue)

    for track, cues in tracks.items():
        furthest: dict | None = None
        for cue in sorted(cues, key=lambda item: item["start"]):
            if furthest and cue["start"] < furthest["end"] - epsilon:
                errors.append(f"Caption overlap on track '{track}': {furthest['id']} / {cue['id']}")
            if furthest is None or cue["end"] > furthest["end"]:
                furthest = cue

    event_ids: set[str] = set()
    for index, event in enumerate(events):
        label = f"events[{index}]"
        if not isinstance(event, dict):
            errors.append(f"{label} must be an object.")
            continue
        eid = event.get("id")
        if not nonempty(eid):
            errors.append(f"{label}.id must be a nonempty stable string.")
        elif eid in event_ids:
            errors.append(f"Duplicate event id: {eid}")
        else:
            event_ids.add(eid)
        for field in ("cueId", "action", "objectId"):
            if not nonempty(event.get(field)):
                errors.append(f"{label}.{field} must be a nonempty string.")
        phase = event.get("phase")
        if phase not in ("prepare", "land", "exit"):
            errors.append(f"{label}.phase must be prepare, land or exit.")
        offset, event_duration = event.get("offset"), event.get("duration", 0)
        if not number(offset):
            errors.append(f"{label}.offset must be a finite number of seconds.")
        elif offset < 0:
            if phase != "prepare":
                errors.append(f"{label}: a negative offset is allowed only for prepare.")
            elif not nonempty(event.get("anticipationReason")):
                errors.append(f"{label}: early prepare requires anticipationReason.")
        if not number(event_duration) or event_duration < 0:
            errors.append(f"{label}.duration must be a finite nonnegative number.")
        for field in ("camera", "sfx", "anticipationReason"):
            if field in event and not nonempty(event[field]):
                errors.append(f"{label}.{field} must be a nonempty string when present.")
        cue_id = event.get("cueId")
        cue = cue_by_id.get(cue_id) if isinstance(cue_id, str) else None
        if cue is None:
            errors.append(f"{label}: cueId does not reference a caption with valid times.")
            continue
        if not number(offset) or not number(event_duration) or event_duration < 0:
            continue
        start = cue["start"] + offset
        end = start + event_duration
        if start < -epsilon or (valid_duration and end > duration + epsilon):
            errors.append(f"{label}: event interval [{start:.6f}, {end:.6f}] is outside the project.")
        frame = math.floor(start * fps + 0.5) if number(fps) and fps > 0 else ""
        rows.append({
            "event_id": eid, "cue_id": cue_id, "caption": cue.get("text", ""),
            "cue_start": cue["start"], "cue_end": cue["end"], "phase": phase,
            "offset": offset, "start_seconds": start, "start_frame": frame,
            "duration": event_duration, "end_seconds": end,
            "object_id": event.get("objectId", ""), "action": event.get("action", ""),
            "camera": event.get("camera", ""), "sfx": event.get("sfx", ""),
            "anticipation_reason": event.get("anticipationReason", ""),
        })
    return errors, sorted(rows, key=lambda row: row["start_seconds"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("timeline", type=Path, help="Timeline JSON (times in seconds).")
    parser.add_argument("--csv", type=Path, help="Export a new alignment table (refuses an existing file).")
    args = parser.parse_args()
    try:
        data = json.loads(args.timeline.read_text(encoding="utf-8-sig"))
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        print(f"ERROR: Cannot read timeline: {exc}", file=sys.stderr)
        return 2
    errors, rows = validate(data)
    if errors:
        for error in errors:
            print(f"ERROR: {error}", file=sys.stderr)
        print(f"FAIL: {len(errors)} issue(s). No CSV written.", file=sys.stderr)
        return 1
    if args.csv:
        try:
            args.csv.parent.mkdir(parents=True, exist_ok=True)
            with args.csv.open("x", encoding="utf-8-sig", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
                writer.writeheader()
                for row in rows:
                    writer.writerow({key: f"{value:.6f}" if isinstance(value, float) else value for key, value in row.items()})
        except OSError as exc:
            print(f"ERROR: Cannot write CSV: {exc}", file=sys.stderr)
            return 2
    print(f"PASS: {len(data['captions'])} captions, {len(rows)} events, {data['duration']} seconds at {data['fps']} fps.")
    print("Checks cover timing structure, not ASR accuracy, visual clarity or aesthetic approval.")
    return 0


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
