#!/usr/bin/env python3
"""Generate the Skill's original, deterministic short editing sound kit.

Pure Python standard library. No downloads, reference-video audio, network
requests, voice clones or third-party music. Example:
  python scripts/make_sounds.py --out assets/source-style-template/public/sfx
Existing files are preserved unless --replace is explicitly supplied.
"""
from __future__ import annotations

import argparse
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
PEAK = 0.60
TAU = 2 * math.pi
DURATIONS = {"whoosh": .48, "tick": .15, "pop": .22, "chime": .52, "drop": .54}


def _window(t: float, duration: float, attack: float = .007, release: float = .045) -> float:
    return min(1.0, max(0.0, t / attack)) * min(1.0, max(0.0, (duration - t) / release))


def synthesise(name: str) -> list[float]:
    """Finite-duration signals. A fixed seed makes regeneration byte-identical."""
    duration = DURATIONS[name]
    rng = random.Random(f"portrait-editorial-sound-kit-v1/{name}")
    samples: list[float] = []
    filtered = 0.0
    previous = 0.0
    for i in range(round(RATE * duration)):
        t = i / RATE
        q = t / duration
        noise = rng.uniform(-1, 1)
        if name == "whoosh":
            # Sweeping first-order low-pass with a gentle high-pass difference.
            alpha = .045 + .42 * math.sin(math.pi * q) ** 2
            filtered += alpha * (noise - filtered)
            high = filtered - previous * .8
            previous = filtered
            env = math.sin(math.pi * q) ** 1.9
            tone = math.sin(TAU * (160 * t + 380 * t * t)) * .085
            value = (high + tone) * env
        elif name == "tick":
            # Short soft click, followed by a tiny damped upper-mid ring.
            value = noise * math.exp(-t * 155) * .55
            value += math.sin(TAU * 1650 * t) * math.exp(-t * 92) * .28
        elif name == "pop":
            # Integral of a declining fundamental creates a rounded pop.
            phase = TAU * (92 * t + 160 * (1 - math.exp(-t * 24)) / 24)
            value = math.sin(phase) * math.exp(-t * 21)
            value += noise * math.exp(-t * 95) * .12
        elif name == "chime":
            value = 0.0
            for delay, hz, gain in ((0, 880, .65), (.07, 1108.73, .46), (.14, 1318.51, .36)):
                a = t - delay
                if a >= 0:
                    value += math.sin(TAU * hz * a) * math.exp(-a * 8.2) * gain * min(1, a / .006)
                    value += math.sin(TAU * hz * 2.003 * a) * math.exp(-a * 17) * gain * .13 * min(1, a / .004)
        else:  # Three progressively lighter contact bounces.
            value = 0.0
            for delay, gain, hz in ((0, .9, 1680), (.17, .53, 1840), (.31, .26, 2090)):
                a = t - delay
                if a >= 0:
                    value += (math.sin(TAU * hz * a) + .36 * math.sin(TAU * hz * 1.413 * a)) * math.exp(-a * 33) * gain * min(1, a / .002)
                    value += noise * math.exp(-a * 90) * gain * .18
        samples.append(value * _window(t, duration, .003 if name in {"tick", "drop"} else .007))
    peak = max(map(abs, samples), default=1.0) or 1.0
    return [sample / peak * PEAK for sample in samples]


def write_sound(path: Path, samples: list[float], replace: bool) -> None:
    # Exclusive creation enforces non-overwrite even if the directory changes
    # between initial validation and writing this file.
    with path.open("wb" if replace else "xb") as output:
        with wave.open(output, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(RATE)
            wav.writeframes(b"".join(struct.pack("<h", round(s * 32767)) for s in samples))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, required=True, help="Destination directory for five WAV files")
    parser.add_argument("--replace", action="store_true", help="Explicitly allow replacing existing kit WAVs")
    args = parser.parse_args()
    target = args.out.expanduser().resolve()
    collisions = [target / f"{name}.wav" for name in DURATIONS if (target / f"{name}.wav").exists()]
    if collisions and not args.replace:
        parser.error("Refusing to overwrite: " + ", ".join(str(path) for path in collisions) + ". Use --replace explicitly.")
    target.mkdir(parents=True, exist_ok=True)
    for name in DURATIONS:
        path = target / f"{name}.wav"
        samples = synthesise(name)
        write_sound(path, samples, args.replace)
        print(f"{path.name}: {len(samples) / RATE:.2f}s, mono PCM16/{RATE}Hz, peak <= {PEAK:.2f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
