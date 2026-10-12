#!/usr/bin/env python3
"""Validate a v2 storyboard without packages, AI calls, or media modification."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path, PurePosixPath
import re
import sys

MECHANISMS = {
    "object-focus", "compare-pan", "route-transfer", "group-sort",
    "evidence-zoom", "metric-build", "question-thread", "presenter",
}
KINDS = {"document", "message", "folder", "device", "product", "person", "coin", "chart", "image", "symbol"}
ACTIONS = {"reveal", "focus", "transfer", "group", "select", "result", "count", "connect"}
SOURCE_TYPES = {"raw-presenter", "roughcut-presenter", "digital-human", "narration", "demo"}
ROUGH_CUTS = {"pending", "done", "skipped-digital", "not-needed"}
EPSILON = 1e-6
CUE_TOLERANCE = 0.12


def is_choice(value, choices):
    return isinstance(value, str) and value in choices


def finite_number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return False
    try:
        return math.isfinite(value)
    except (OverflowError, TypeError):
        return False


def media_path_error(value):
    """Use the same portable lexical rules on Windows, Linux, and macOS."""
    if not isinstance(value, str) or not value.strip():
        return "must be a nonempty local relative path"
    if value != value.strip() or "\\" in value or ":" in value or value.startswith("/"):
        return "must use a local relative path with forward slashes, without drive letters or URLs"
    if any(ord(char) < 32 or char in '<>"|?*' for char in value):
        return "contains a control character or a nonportable filename character"
    parts = value.split("/")
    if any(part in {"", ".", ".."} for part in parts):
        return "must not contain empty, '.' or '..' path components"
    # Windows normalizes these names, which can escape the intended file mapping.
    reserved = re.compile(r"^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)", re.I)
    if any(part.endswith((".", " ")) or reserved.match(part) for part in parts):
        return "contains a Windows reserved name or a trailing dot/space"
    if PurePosixPath(value).is_absolute():
        return "must not be an absolute path"
    return None


def load_storyboard(path):
    raw = Path(path).read_bytes()

    def unique_keys(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"Duplicate JSON key {key!r}; keep one unambiguous value.")
            result[key] = value
        return result

    # Keep nonfinite constants for field-specific diagnostics in validate_storyboard.
    return json.loads(raw.decode("utf-8-sig"), object_pairs_hook=unique_keys), raw


def validate_storyboard(data, mode="production"):
    """Return JSON-friendly errors and warnings; never mutate the supplied plan."""
    if mode not in {"production", "draft"}:
        raise ValueError("mode must be 'production' or 'draft'")
    errors, warnings = [], []

    def issue(path, message, fix, warning=False):
        (warnings if warning else errors).append({"path": path, "message": message, "fix": fix})

    def object_at(value, path, required, optional=()):
        if not isinstance(value, dict):
            issue(path, "must be an object", "Use a JSON object with the fields in storyboard-contract.md.")
            return {}
        for key in required:
            if key not in value:
                issue(f"{path}.{key}", "required field is missing", f"Add {key!r} using the v2 contract.")
        for key in value.keys() - set(required) - set(optional):
            issue(f"{path}.{key}", "extension field is preserved but has no built-in rendering behavior", "Remove it if accidental, or implement its behavior in the renderer.", True)
        return value

    def array_at(value, path):
        if not isinstance(value, list):
            issue(path, "must be an array", "Use a JSON array; use [] when this field permits no entries.")
            return []
        return value

    def string_at(value, path, minimum=1, maximum=None):
        if not isinstance(value, str) or len(value.strip()) < minimum:
            issue(path, f"must be a string containing at least {minimum} visible character(s)", "Supply the real short text for this field.")
            return False
        if maximum is not None and len(value) > maximum:
            issue(path, f"has {len(value)} characters; maximum is {maximum}", "Shorten the on-screen text without inventing or changing the spoken facts.")
            return False
        return True

    def enum_at(value, path, choices):
        if not isinstance(value, str) or value not in choices:
            issue(path, f"must be one of: {', '.join(sorted(choices))}", "Choose an implemented value, or extend the renderer and contract together.")
            return False
        return True

    def number_at(value, path, minimum=None, maximum=None):
        if not finite_number(value):
            issue(path, "must be a finite number (not a boolean)", "Replace NaN/Infinity/text with a measured numeric value.")
            return False
        if minimum is not None and value < minimum or maximum is not None and value > maximum:
            issue(path, f"must be between {minimum if minimum is not None else '-infinity'} and {maximum if maximum is not None else 'infinity'}", "Use a value within the contract bounds; do not fabricate a replacement fact.")
            return False
        return True

    def path_at(value, path, nullable=False):
        if value is None and nullable:
            return
        problem = media_path_error(value)
        if problem:
            issue(path, problem, "Place the file under --media-dir and reference it as e.g. media/voice.wav.")

    def not_ready(path, message, fix):
        issue(path, message, fix, mode == "draft")

    def references(values, path, available):
        result = []
        seen = set()
        for index, identifier in enumerate(array_at(values, path)):
            item_path = f"{path}[{index}]"
            if not isinstance(identifier, str) or identifier not in available:
                issue(item_path, f"unknown reference {identifier!r}", "Use an id declared in the corresponding root array.")
            elif identifier in seen:
                issue(item_path, f"duplicate reference {identifier!r}", "List each referenced id once.")
            else:
                seen.add(identifier)
                result.append(identifier)
        return result

    def index_entries(entries, path):
        indexed = {}
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            identifier = entry.get("id")
            item_path = f"{path}[{index}].id"
            if string_at(identifier, item_path):
                if identifier in indexed:
                    issue(item_path, f"duplicate id {identifier!r}", "Give distinct entries unique ids; reuse an object by reference instead of redefining it.")
                else:
                    indexed[identifier] = entry
        return indexed

    def positive_at(value, path):
        if number_at(value, path, 0) and value <= 0:
            issue(path, "must be greater than zero", "Use a positive measured size, scale, or interval.")

    def boolean_at(value, path):
        if not isinstance(value, bool):
            issue(path, "must be a boolean", "Use JSON true or false.")

    def asset_reference(value, path):
        if not isinstance(value, str) or value not in asset_index:
            issue(path, "unknown asset id", "Declare this asset in $.assets with a portable relative path.")

    def local_time(value, path, scene_duration):
        return number_at(value, path, -1.5, scene_duration)

    def interval_at(value, path, first, last, scene_duration):
        first_ok = local_time(value.get(first), path + "." + first, scene_duration)
        last_ok = local_time(value.get(last), path + "." + last, scene_duration)
        if first_ok and last_ok and value[last] <= value[first]:
            issue(path + "." + last, f"must be later than {first}", "Use a nonzero interval in scene-local seconds.")

    def validate_keys(values, path, scene_duration, camera=False):
        previous_at = None
        for key_index, raw_key in enumerate(array_at(values, path)):
            key_path = f"{path}[{key_index}]"
            key = object_at(raw_key, key_path, ("at", "x", "y", "z") if camera else ("at",), () if camera else ("x", "y", "w", "h", "rotation", "scale", "opacity"))
            at = key.get("at")
            if local_time(at, key_path + ".at", scene_duration):
                if previous_at is not None and at <= previous_at:
                    issue(key_path + ".at", "key times must be strictly increasing", "Order keys by scene-local time and merge duplicate-time keys.")
                previous_at = at
            for field in ("x", "y", "rotation"):
                if field in key:
                    number_at(key[field], key_path + "." + field)
            for field in ("w", "h", "scale", "z"):
                if field in key:
                    positive_at(key[field], key_path + "." + field)
            if "opacity" in key:
                number_at(key["opacity"], key_path + ".opacity", 0, 1)
            if not camera and not any(field in key for field in ("x", "y", "w", "h", "rotation", "scale", "opacity")):
                issue(key_path, "key has no pose fields", "Specify the property being animated, or remove the redundant key.", True)

    def validate_editorial(scene, path, scene_duration):
        config = object_at(scene.get("editorial"), path, ("background", "layers"), ("title", "eyebrow", "titleKeys", "camera", "connections", "filmstrip", "evidence"))
        enum_at(config.get("background"), path + ".background", {"paper", "ink", "comic"})
        for text in ("title", "eyebrow"):
            if text in config:
                string_at(config[text], path + "." + text, minimum=0, maximum=40)
        if "titleKeys" in config:
            previous_title_at = None
            for key_index, raw_key in enumerate(array_at(config["titleKeys"], path + ".titleKeys")):
                key_path = f"{path}.titleKeys[{key_index}]"
                key = object_at(raw_key, key_path, ("at", "title"), ("eyebrow",))
                at = key.get("at")
                if local_time(at, key_path + ".at", scene_duration):
                    if previous_title_at is not None and at <= previous_title_at:
                        issue(key_path + ".at", "title key times must be strictly increasing", "Order title changes by scene-local spoken time and merge duplicate-time keys.")
                    previous_title_at = at
                string_at(key.get("title"), key_path + ".title", minimum=0, maximum=40)
                if "eyebrow" in key:
                    string_at(key["eyebrow"], key_path + ".eyebrow", minimum=0, maximum=40)
        layers = array_at(config.get("layers"), path + ".layers")
        layer_index = index_entries(layers, path + ".layers")
        for layer_number, raw_layer in enumerate(layers):
            layer_path = f"{path}.layers[{layer_number}]"
            layer = object_at(raw_layer, layer_path, ("id", "assetId", "x", "y", "w", "h"), ("rotation", "scale", "opacity", "keys", "shadow", "foreground"))
            asset_reference(layer.get("assetId"), layer_path + ".assetId")
            for field in ("x", "y"):
                number_at(layer.get(field), layer_path + "." + field)
            for field in ("w", "h"):
                positive_at(layer.get(field), layer_path + "." + field)
            if "rotation" in layer:
                number_at(layer["rotation"], layer_path + ".rotation")
            if "scale" in layer:
                positive_at(layer["scale"], layer_path + ".scale")
            if "opacity" in layer:
                number_at(layer["opacity"], layer_path + ".opacity", 0, 1)
            for field in ("shadow", "foreground"):
                if field in layer:
                    boolean_at(layer[field], layer_path + "." + field)
            if "keys" in layer:
                validate_keys(layer["keys"], layer_path + ".keys", scene_duration)
        if "camera" in config:
            validate_keys(config["camera"], path + ".camera", scene_duration, camera=True)
        if "connections" in config:
            connections = array_at(config["connections"], path + ".connections")
            index_entries(connections, path + ".connections")
            for connection_index, raw_connection in enumerate(connections):
                connection_path = f"{path}.connections[{connection_index}]"
                connection = object_at(raw_connection, connection_path, ("id", "points", "start", "end"), ("color", "width"))
                points = array_at(connection.get("points"), connection_path + ".points")
                if len(points) < 2:
                    issue(connection_path + ".points", "needs at least two points", "Author the actual spatial route between objects.")
                for point_index, raw_point in enumerate(points):
                    point_path = f"{connection_path}.points[{point_index}]"
                    point = object_at(raw_point, point_path, ("x", "y"))
                    number_at(point.get("x"), point_path + ".x")
                    number_at(point.get("y"), point_path + ".y")
                interval_at(connection, connection_path, "start", "end", scene_duration)
                if "width" in connection:
                    positive_at(connection["width"], connection_path + ".width")
                if "color" in connection and (not isinstance(connection["color"], str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", connection["color"])):
                    issue(connection_path + ".color", "must be a #RRGGBB color", "Use a six-digit hexadecimal stroke color.")
        if "filmstrip" in config:
            film_path = path + ".filmstrip"
            strip = object_at(config["filmstrip"], film_path, ("assetIds", "x", "y", "w", "h", "enterAt", "settleAt", "threadAt", "threadEnd"), ("rotation",))
            frame_assets = array_at(strip.get("assetIds"), film_path + ".assetIds")
            if not 2 <= len(frame_assets) <= 12:
                issue(film_path + ".assetIds", "needs 2 to 12 frames", "Choose actual frame assets; repeated source ids are permitted.")
            for frame_index, asset in enumerate(frame_assets):
                asset_reference(asset, f"{film_path}.assetIds[{frame_index}]")
            for field in ("x", "y"):
                number_at(strip.get(field), film_path + "." + field)
            for field in ("w", "h"):
                positive_at(strip.get(field), film_path + "." + field)
            if "rotation" in strip:
                number_at(strip["rotation"], film_path + ".rotation")
            interval_at(strip, film_path, "enterAt", "settleAt", scene_duration)
            interval_at(strip, film_path, "threadAt", "threadEnd", scene_duration)
        if "evidence" in config:
            evidence_path = path + ".evidence"
            evidence = object_at(config["evidence"], evidence_path, ("assetId",), ("title", "subtitle", "note", "noteAt", "lensStrength"))
            asset_reference(evidence.get("assetId"), evidence_path + ".assetId")
            for field in ("title", "subtitle", "note"):
                if field in evidence:
                    string_at(evidence[field], evidence_path + "." + field, minimum=0)
            if "noteAt" in evidence:
                local_time(evidence["noteAt"], evidence_path + ".noteAt", scene_duration)
            if "lensStrength" in evidence:
                number_at(evidence["lensStrength"], evidence_path + ".lensStrength", 0)
        if not layers and "filmstrip" not in config and "evidence" not in config and scene.get("presenter") != "full":
            issue(path, "editorial scene has no material, evidence, or film frames", "Provide semantic visual assets; only a full-screen presenter scene may omit them.")
        return layer_index

    def validate_presenter_style(value, path):
        style = object_at(value, path, ("shape",), ("x", "y", "w", "h", "rotation", "radius"))
        enum_at(style.get("shape"), path + ".shape", {"portrait", "circle"})
        for field in ("x", "y", "rotation"):
            if field in style:
                number_at(style[field], path + "." + field)
        for field in ("w", "h"):
            if field in style:
                positive_at(style[field], path + "." + field)
        if "radius" in style:
            number_at(style["radius"], path + ".radius", 0)

    def validate_anchor(value, path, scene, scene_duration, layers):
        anchor = object_at(value, path, ("rect", "space", "start", "duration"), ("layerId", "borderRadius"))
        enum_at(anchor.get("space"), path + ".space", {"layer", "screen"})
        if not is_choice(scene.get("transition"), {"circle", "window"}):
            issue(path, "transitionAnchor is only used by circle/window transitions", "Choose an actual object-driven circle/window transition, or remove this anchor.")
        start_ok = local_time(anchor.get("start"), path + ".start", scene_duration)
        positive_at(anchor.get("duration"), path + ".duration")
        if start_ok and finite_number(anchor.get("duration")) and anchor["duration"] > 0 and scene_duration is not None:
            fps = root.get("fps") if root.get("fps") in (25, 30, 50, 60) else 30
            if abs(anchor["start"] + anchor["duration"] - scene_duration) > 1 / fps + EPSILON:
                issue(path + ".duration", "transition must finish at the scene end (within one frame)", "Set duration to scene.end - scene.start - transitionAnchor.start.")
        if "borderRadius" in anchor:
            number_at(anchor["borderRadius"], path + ".borderRadius", 0)
        rect = object_at(anchor.get("rect"), path + ".rect", ("x", "y", "w", "h"))
        for field in ("x", "y"):
            number_at(rect.get(field), path + ".rect." + field, 0)
        for field in ("w", "h"):
            positive_at(rect.get(field), path + ".rect." + field)
        bounds = (540, 960) if anchor.get("space") == "screen" else None
        if anchor.get("space") == "layer":
            layer_id = anchor.get("layerId")
            if not isinstance(layer_id, str) or layer_id not in layers:
                issue(path + ".layerId", "unknown editorial layer id", "Anchor the opening to an existing layer in this scene, using its base dimensions.")
            else:
                bounds = (layers[layer_id].get("w"), layers[layer_id].get("h"))
        elif "layerId" in anchor:
            issue(path + ".layerId", "screen-space anchors ignore layerId", "Remove layerId or select space='layer'.", True)
        if bounds and all(finite_number(v) for v in bounds) and all(finite_number(rect.get(v)) for v in ("x", "y", "w", "h")):
            if rect["x"] + rect["w"] > bounds[0] + EPSILON or rect["y"] + rect["h"] > bounds[1] + EPSILON:
                issue(path + ".rect", "anchor rectangle extends outside its base surface", "Measure the visible object surface within layer.w/layer.h, or within the 540 x 960 screen.")

    root = object_at(data, "$", ("version", "title", "width", "height", "fps", "duration", "timing", "source", "media", "assets", "objects", "captions", "scenes"), ("theme", "renderMode"))
    if root.get("version") != 2 or isinstance(root.get("version"), bool):
        issue("$.version", "must be 2", "Migrate the JSON to storyboard-contract.md v2.")
    string_at(root.get("title"), "$.title", maximum=80)
    for key, expected in (("width", 1080), ("height", 1920)):
        if root.get(key) != expected:
            issue(f"$.{key}", f"must be {expected}", "Use the supported 1080 x 1920 portrait canvas.")
    if root.get("fps") not in (25, 30, 50, 60):
        issue("$.fps", "must be 25, 30, 50, or 60", "Select one supported frame rate.")
    duration = root.get("duration")
    valid_duration = number_at(duration, "$.duration", 0, 1800)
    if valid_duration and duration <= 0:
        issue("$.duration", "must be greater than zero", "Use the final voice duration in seconds.")
        valid_duration = False
    enum_at(root.get("timing"), "$.timing", {"measured", "estimated", "demo"})
    if root.get("timing") != "measured":
        not_ready("$.timing", "production requires measured timing", "Measure the final voice and align captions/scenes; use --draft for estimates.")
    if "renderMode" in root:
        enum_at(root["renderMode"], "$.renderMode", {"draft", "production"})
        if mode == "production" and root["renderMode"] == "draft":
            issue("$.renderMode", "this plan is explicitly marked draft", "Finish the voice, timing and media checks, then set renderMode to production or omit the field.")

    source = object_at(root.get("source"), "$.source", ("type", "roughcut"), ("tool",))
    enum_at(source.get("type"), "$.source.type", SOURCE_TYPES)
    enum_at(source.get("roughcut"), "$.source.roughcut", ROUGH_CUTS)
    if "tool" in source:
        string_at(source["tool"], "$.source.tool")
    if is_choice(source.get("type"), {"raw-presenter", "roughcut-presenter"}):
        if source.get("roughcut") != "done":
            not_ready("$.source.roughcut", "presenter footage still needs a completed rough cut", "Finish the rough cut in ChatCut, export it, then set roughcut='done' and tool='ChatCut'.")
        if source.get("roughcut") == "done" and source.get("tool") != "ChatCut":
            not_ready("$.source.tool", "a completed presenter rough cut must record ChatCut", "Record tool='ChatCut' only after the actual ChatCut rough cut is complete.")
    elif source.get("type") == "digital-human":
        if not is_choice(source.get("roughcut"), {"skipped-digital", "done"}):
            not_ready("$.source.roughcut", "digital-human material needs an explicit rough-cut exemption or completion", "Use skipped-digital for the normal digital-human route, or record an actual completed rough cut.")
        if source.get("roughcut") == "done" and source.get("tool") != "ChatCut":
            not_ready("$.source.tool", "completed rough cut must record ChatCut", "Record the actual ChatCut processing, or use the digital-human exemption when applicable.")
    elif is_choice(source.get("type"), {"narration", "demo"}) and source.get("roughcut") != "not-needed":
        not_ready("$.source.roughcut", "narration/demo must record not-needed", "Set roughcut='not-needed' for this source type.")

    media = object_at(root.get("media"), "$.media", ("presenter", "voice"), ("music",))
    for key in ("presenter", "voice", "music"):
        if key in media:
            path_at(media[key], f"$.media.{key}", True)
    if not media.get("voice"):
        not_ready("$.media.voice", "production requires a final voice file", "Add the final voice file under --media-dir and reference its relative path; use --draft for a silent preview.")
    if is_choice(source.get("type"), {"raw-presenter", "roughcut-presenter", "digital-human"}) and not media.get("presenter"):
        not_ready("$.media.presenter", "this source type requires presenter media", "Provide the actual presenter file; use --draft for a clearly marked placeholder.")
    if "theme" in root:
        theme = object_at(root["theme"], "$.theme", ("paper", "ink", "accent", "comic"))
        for key in ("paper", "ink", "accent", "comic"):
            if not isinstance(theme.get(key), str) or not re.fullmatch(r"#[0-9a-fA-F]{6}", theme[key]):
                issue(f"$.theme.{key}", "must be a #RRGGBB color", "Use a six-digit hexadecimal color, for example #F5F2ED.")

    assets = array_at(root.get("assets"), "$.assets")
    asset_index = index_entries(assets, "$.assets")
    for index, item in enumerate(assets):
        path = f"$.assets[{index}]"
        item = object_at(item, path, ("id", "path", "role"), ("source",))
        path_at(item.get("path"), path + ".path")
        enum_at(item.get("role"), path + ".role", {"illustration", "evidence", "brand"})
        if not isinstance(item.get("source"), str) or not item["source"].strip():
            not_ready(path + ".source", "production assets require a traceable source description", "Record the actual source URL or 'user supplied'; never invent provenance.")
        elif string_at(item["source"], path + ".source"):
            if re.search(r"(?i)(?:api[_-]?key|access[_-]?token|secret|password)\s*[=:]", item["source"]):
                issue(path + ".source", "source description appears to contain credentials", "Remove credentials and retain only a public source URL or attribution.")

    objects = array_at(root.get("objects"), "$.objects")
    object_index = index_entries(objects, "$.objects")
    for index, item in enumerate(objects):
        path = f"$.objects[{index}]"
        item = object_at(item, path, ("id", "kind", "label"), ("detail", "assetId"))
        enum_at(item.get("kind"), path + ".kind", KINDS)
        string_at(item.get("label"), path + ".label", maximum=16)
        if "detail" in item:
            string_at(item["detail"], path + ".detail", minimum=0, maximum=60)
        if "assetId" in item and (not isinstance(item["assetId"], str) or item["assetId"] not in asset_index):
            issue(path + ".assetId", "unknown asset id", "Reference an id from $.assets or omit assetId for a drawn object.")

    captions = array_at(root.get("captions"), "$.captions")
    caption_index = index_entries(captions, "$.captions")
    previous_end = None
    for index, item in enumerate(captions):
        path = f"$.captions[{index}]"
        item = object_at(item, path, ("id", "start", "end", "text"))
        start, end = item.get("start"), item.get("end")
        valid_start = number_at(start, path + ".start", 0, duration if valid_duration else None)
        valid_end = number_at(end, path + ".end", 0, duration if valid_duration else None)
        string_at(item.get("text"), path + ".text", maximum=54)
        if valid_start and valid_end:
            if end <= start:
                issue(path + ".end", "must be later than start", "Use the actual nonzero subtitle interval.")
            if previous_end is not None and start < previous_end - EPSILON:
                issue(path + ".start", "captions overlap or are not sorted", "Order captions by start time and remove same-track overlaps.")
            previous_end = end
            if end > start and isinstance(item.get("text"), str) and len(item["text"]) / (end - start) > 12:
                issue(path + ".text", "subtitle reading speed exceeds 12 characters per second", "Review playback; split or retime if the actual voice allows it.", True)

    scenes = array_at(root.get("scenes"), "$.scenes")
    index_entries(scenes, "$.scenes")
    if not scenes:
        issue("$.scenes", "must contain at least one scene", "Build scenes covering the whole final voice timeline.")
    previous_end = 0.0
    for index, item in enumerate(scenes):
        path = f"$.scenes[{index}]"
        item = object_at(item, path, ("id", "start", "end", "cueIds", "intent", "mechanism", "title", "objectIds", "beats", "transition", "presenter"), ("metric", "evidenceAssetId", "editorial", "presenterStyle", "transitionAnchor"))
        start, end = item.get("start"), item.get("end")
        valid_start = number_at(start, path + ".start", 0, duration if valid_duration else None)
        valid_end = number_at(end, path + ".end", 0, duration if valid_duration else None)
        if valid_start and valid_end:
            if end - start < 0.8 - EPSILON:
                issue(path + ".end", "scene must last at least 0.8 seconds", "Adjust scene boundaries to a real semantic interval of at least 0.8 seconds.")
            if previous_end is not None and abs(start - previous_end) > EPSILON:
                issue(path + ".start", f"expected {previous_end:g} to cover the timeline without a gap/overlap", "Set this boundary and the previous scene end to the same measured time.")
            previous_end = end
        else:
            previous_end = None
        string_at(item.get("intent"), path + ".intent", maximum=100)
        string_at(item.get("title"), path + ".title", minimum=0, maximum=24)
        mechanism = item.get("mechanism")
        enum_at(mechanism, path + ".mechanism", MECHANISMS)
        enum_at(item.get("transition"), path + ".transition", {"circle", "window", "match", "cut"})
        enum_at(item.get("presenter"), path + ".presenter", {"full", "pip", "hidden"})
        has_editorial = "editorial" in item
        scene_duration = end - start if valid_start and valid_end and end > start else None
        editorial_layers = validate_editorial(item, path + ".editorial", scene_duration) if has_editorial else {}
        if "presenterStyle" in item:
            validate_presenter_style(item["presenterStyle"], path + ".presenterStyle")
        if "transitionAnchor" in item:
            validate_anchor(item["transitionAnchor"], path + ".transitionAnchor", item, scene_duration, editorial_layers)
        scene_objects = references(item.get("objectIds"), path + ".objectIds", object_index)
        if isinstance(item.get("objectIds"), list) and len(item["objectIds"]) > 6:
            issue(path + ".objectIds", "maximum is 6 on-screen objects per scene", "Simplify this composition or split it at a real semantic boundary.")
        scene_cues = references(item.get("cueIds"), path + ".cueIds", caption_index)
        for cue_id in scene_cues:
            cue = caption_index[cue_id]
            if valid_start and valid_end and finite_number(cue.get("start")) and finite_number(cue.get("end")):
                if cue["end"] <= start or cue["start"] >= end:
                    issue(path + ".cueIds", f"caption {cue_id!r} does not overlap this scene", "Reference captions that actually overlap this scene's measured interval.")

        beats = array_at(item.get("beats"), path + ".beats")
        usable_beats = []
        for beat_index, beat in enumerate(beats):
            beat_path = f"{path}.beats[{beat_index}]"
            beat = object_at(beat, beat_path, ("at", "cueId", "action", "targetId"), ("withId",))
            at = beat.get("at")
            valid_at = number_at(at, beat_path + ".at", 0, duration if valid_duration else None)
            if valid_at and valid_start and valid_end and not start <= at < end:
                issue(beat_path + ".at", "must fall inside this scene (start <= at < end)", "Move this beat to its actual spoken time inside the scene, or change the scene boundary.")
            cue_id = beat.get("cueId")
            if not isinstance(cue_id, str) or cue_id not in scene_cues:
                issue(beat_path + ".cueId", "must reference one of this scene's cueIds", "Use the id of the actual caption that triggers this event and include it in cueIds.")
            else:
                cue = caption_index[cue_id]
                if valid_at and finite_number(cue.get("start")) and finite_number(cue.get("end")) and not cue["start"] - CUE_TOLERANCE - EPSILON <= at <= cue["end"] + CUE_TOLERANCE + EPSILON:
                    issue(beat_path + ".at", f"does not fall inside caption {cue_id!r} (+/- 0.12 s quantization allowance)", "Use the real trigger time within the referenced subtitle interval; do not retime unrelated captions.")
            enum_at(beat.get("action"), beat_path + ".action", ACTIONS)
            for key in ("targetId", "withId"):
                if key == "targetId" or key in beat:
                    if not isinstance(beat.get(key), str) or beat[key] not in scene_objects:
                        issue(beat_path + "." + key, "must reference one of this scene's objectIds", "Declare the object once in $.objects and include its id in this scene's objectIds.")
            if is_choice(beat.get("action"), {"transfer", "group", "connect"}):
                if "withId" not in beat:
                    issue(beat_path + ".withId", "this action needs a destination/container/other object", "Supply a different object id from this scene's objectIds.")
                elif beat.get("withId") == beat.get("targetId"):
                    issue(beat_path + ".withId", "must differ from targetId for this action", "Reference the actual destination/container/other object.")
            usable_beats.append(beat)

        minima = {"object-focus": 1, "compare-pan": 2, "route-transfer": 3, "group-sort": 3, "evidence-zoom": 1, "metric-build": 1, "question-thread": 2, "presenter": 0}
        if not has_editorial and isinstance(mechanism, str) and mechanism in minima and len(scene_objects) < minima[mechanism]:
            issue(path + ".objectIds", f"{mechanism} needs at least {minima[mechanism]} distinct objects", "Add the real semantic participants, or choose a mechanism that fits this explanation.")
        required_actions = {"object-focus": {"focus", "reveal", "result"}, "route-transfer": {"transfer"}, "group-sort": {"group"}, "evidence-zoom": {"focus", "select", "result"}, "metric-build": {"count"}, "question-thread": {"connect"}}
        if not has_editorial and isinstance(mechanism, str) and mechanism in required_actions and not any(is_choice(beat.get("action"), required_actions[mechanism]) for beat in usable_beats):
            issue(path + ".beats", f"{mechanism} needs an action from {', '.join(sorted(required_actions[mechanism]))}", "Tie the required semantic action to the actual triggering caption and object.")
        if not has_editorial and mechanism == "compare-pan":
            targets = {beat.get("targetId") for beat in usable_beats if is_choice(beat.get("action"), {"focus", "select"}) and isinstance(beat.get("targetId"), str) and beat["targetId"] in scene_objects}
            if len(targets) < 2:
                issue(path + ".beats", "compare-pan needs focus/select events on at least two different objects", "Add caption-aligned comparison events for both compared objects.")

        if not has_editorial and mechanism == "metric-build" and "metric" not in item:
            issue(path + ".metric", "metric-build requires metric data", "Supply the real numeric value from the narration; do not invent statistics.")
        if "metric" in item:
            if mechanism != "metric-build":
                issue(path + ".metric", "only metric-build uses metric data", "Remove unused metric data or choose metric-build when it matches the narration.")
            metric = object_at(item["metric"], path + ".metric", ("value", "unit"), ("total",))
            value_ok = number_at(metric.get("value"), path + ".metric.value", 0)
            string_at(metric.get("unit"), path + ".metric.unit", minimum=0)
            if "total" in metric:
                total_ok = number_at(metric["total"], path + ".metric.total", 0)
                if total_ok and metric["total"] <= 0:
                    issue(path + ".metric.total", "must be greater than zero", "Use the actual positive whole/subset denominator.")
                if total_ok and value_ok and metric["value"] > metric["total"]:
                    issue(path + ".metric.value", "must not exceed total", "Correct the value/total from the source; do not clamp or fabricate it.")
            if isinstance(metric.get("unit"), str) and metric["unit"].strip().lower() in {"%", "％", "percent", "percentage", "百分比"}:
                for key in ("value", "total"):
                    if finite_number(metric.get(key)) and metric[key] > 100:
                        issue(path + ".metric." + key, "percentage must not exceed 100", "Confirm whether the source means a percentage, a growth rate, or a count; encode the correct unit/value.")
        if "evidenceAssetId" in item:
            if mechanism != "evidence-zoom":
                issue(path + ".evidenceAssetId", "only evidence-zoom uses evidenceAssetId", "Use this field on an evidence-zoom scene.")
            if not isinstance(item["evidenceAssetId"], str) or item["evidenceAssetId"] not in asset_index:
                issue(path + ".evidenceAssetId", "unknown asset id", "Reference the actual evidence file in $.assets, or omit it to render a labeled schematic.")

    if valid_duration and previous_end is not None and abs(previous_end - duration) > EPSILON:
        issue("$.scenes", f"last scene must end at duration={duration:g}", "Cover the complete final voice duration with contiguous scenes.")
    if scenes and all(isinstance(scene, dict) and scene.get("mechanism") == "presenter" for scene in scenes):
        issue("$.scenes", "all scenes use presenter; no semantic explanation is implemented", "Review whether actual explanatory passages would benefit from object/relationship/evidence mechanisms.", True)
    if mode == "draft":
        issue("$", "DRAFT / 示意: not a production-ready video", "Complete final media and measured timing, then validate again in production mode.", True)
    # Extension values are preserved, but NaN/Infinity are never legal portable JSON.
    def check_extensions(value, path):
        if isinstance(value, float) and not math.isfinite(value):
            if not any(entry["path"] == path for entry in errors):
                issue(path, "nonfinite values are not valid portable JSON", "Use a finite value or remove this extension field.")
        elif isinstance(value, dict):
            for key, child in value.items():
                check_extensions(child, f"{path}.{key}")
        elif isinstance(value, list):
            for index, child in enumerate(value):
                check_extensions(child, f"{path}[{index}]")
    check_extensions(data, "$")
    return {"valid": not errors, "mode": mode, "errors": errors, "warnings": warnings}


def print_issues(report, stream=None):
    stream = stream or sys.stderr
    for severity in ("errors", "warnings"):
        for entry in report[severity]:
            print(f"{'ERROR' if severity == 'errors' else 'WARNING'} {entry['path']}: {entry['message']}\n  Fix: {entry['fix']}", file=stream)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--mode", choices=("draft", "production"), default="production")
    parser.add_argument("--json", action="store_true", dest="json_output")
    args = parser.parse_args()
    try:
        data, _ = load_storyboard(args.input)
        report = validate_storyboard(data, args.mode)
    except (OSError, UnicodeError, ValueError, RecursionError) as exc:
        report = {"valid": False, "mode": args.mode, "errors": [{"path": "$", "message": f"Cannot read unambiguous UTF-8 JSON: {exc}", "fix": "Correct the input path, encoding or JSON syntax and rerun."}], "warnings": []}
    if args.json_output:
        print(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False))
    else:
        print_issues(report)
        print(f"{'VALID' if report['valid'] else 'INVALID'} ({args.mode}); {len(report['errors'])} error(s), {len(report['warnings'])} warning(s).")
        if report["valid"]:
            print("Structure/timing declarations checked. Actual media files are checked by compile_storyboard.py; audio alignment and factual claims still need source verification.")
    return 0 if report["valid"] else 1


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    raise SystemExit(main())
