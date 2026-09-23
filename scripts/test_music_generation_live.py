#!/usr/bin/env python3
"""
Test Live Music Generation via POST /api/music and acoustically verify all 3 models:
1. ACE-Step v1.5 / v3.5 (XL Turbo BF16)
2. YuE2-3B (M-A-P Foundation Music)
3. MiniMax H3 Music 3 DiT

Mathematical & Acoustic Verification Criteria:
- Spectral Flatness Measure (SFM) < 0.25 (white noise is ~0.9-1.0, musical polyphony is <0.25)
- Dynamic Crest Factor > 11 dB
- Peak-to-RMS Transients
- Zero continuous white noise
"""

import sys
import os
import time
import json
import urllib.request
import urllib.error
import numpy as np
import scipy.io.wavfile
import scipy.signal
import soundfile as sf

API_URL = "http://localhost:3000/api/music"
OUTPUTS_DIR = os.path.join(os.getcwd(), "public", "outputs")

MODELS_TO_TEST = [
    {
        "model": "ace-step-v35",
        "name": "ACE-Step v1.5 / v3.5 (XL Turbo BF16)",
        "stylePrompt": "90s hip-hop, gangsta rap, g-funk, slow tempo 80 BPM, minor key, deep 808 bass, groovy",
        "bpm": 80,
        "key": "G Minor",
        "duration": 20
    },
    {
        "model": "yue2-3b",
        "name": "YuE2-3B (M-A-P Foundation Music)",
        "stylePrompt": "cyberpunk synthwave, analog synthesizers, 120 BPM electro beat, rolling bassline, neon leads",
        "bpm": 120,
        "key": "A Minor",
        "duration": 20
    },
    {
        "model": "minimax-h3",
        "name": "MiniMax H3 Music 3 DiT",
        "stylePrompt": "cinematic orchestral soundtrack, epic brass horns, soaring string section, taiko drums, 90 BPM",
        "bpm": 90,
        "key": "D Minor",
        "duration": 20
    }
]

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())
from music_engine import analyze_audio_quality

def test_model(cfg):
    print(f"\n=================================================================")
    print(f" TESTING MODEL: {cfg['name']} (ID: {cfg['model']})")
    print(f"=================================================================")
    payload = {
        "action": "generate",
        "model": cfg["model"],
        "title": f"Live Test {cfg['name']}",
        "stylePrompt": cfg["stylePrompt"],
        "bpm": cfg["bpm"],
        "key": cfg["key"],
        "duration": cfg["duration"],
        "lyrics": ""
    }

    req = urllib.request.Request(
        API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        print(f"HTTP Request failed: {e}")
        return False

    elapsed = time.time() - t0
    if not data.get("ok"):
        print(f"API returned error: {data}")
        return False

    track = data["track"]
    print(f" API Response: OK (elapsed: {elapsed:.2f}s)")
    print(f" Track ID: {track.get('id')}")
    print(f" Title: {track.get('title')}")
    print(f" Model Used: {track.get('model')} ({track.get('modelName')})")
    print(f" Output URL: {track.get('url')}")
    print(f" Output File: {track.get('filename')}")

    out_file = os.path.join(OUTPUTS_DIR, track.get("filename"))
    if not os.path.exists(out_file):
        print(f" File not found on disk: {out_file}")
        return False

    file_size_kb = os.path.getsize(out_file) / 1024
    print(f" File size on disk: {file_size_kb:.1f} KB")

    # Acoustically analyze the generated audio
    analysis = analyze_audio_quality(out_file)
    print(f"\n--- Acoustic Quality Telemetry ---")
    print(f" Sample Rate:          {analysis['sample_rate']} Hz")
    print(f" Duration:             {analysis['duration_sec']:.2f} s")
    print(f" Dynamic Crest Factor: {analysis['crest_factor_db']} dB (> 6 dB required for dynamic polyphony)")
    print(f" Spectral Flatness:    {analysis['spectral_flatness']} (< 0.25 required; white noise is ~1.0)")
    print(f" Is White Noise:       {analysis['is_white_noise']}")
    print(f" Is Real Music:        {analysis['is_real_music']}")
    print(f" VERDICT:              {analysis['status']}")

    if analysis["is_real_music"] and not analysis["is_white_noise"]:
        print(f" PASS: Real polyphonic music confirmed with rich harmonics and zero white noise.")
        return True
    else:
        print(f" FAIL: Audio quality check failed.")
        return False

def main():
    print("=================================================================")
    print(" LIVE TEST: Music Generation Across All 3 SOTA Models")
    print(f" Target Endpoint: {API_URL}")
    print("=================================================================")

    results = {}
    for cfg in MODELS_TO_TEST:
        success = test_model(cfg)
        results[cfg["model"]] = success

    print("\n=================================================================")
    print(" OVERALL TEST SUMMARY")
    print("=================================================================")
    all_passed = True
    for model, success in results.items():
        status_str = "PASSED" if success else "FAILED"
        print(f" - {model:15}: {status_str}")
        if not success:
            all_passed = False

    if all_passed:
        print("\n ALL 3 MODELS SUCCESSFULLY GENERATE REAL AUDIBLE MUSIC (ZERO WHITE NOISE).")
        sys.exit(0)
    else:
        print("\n SOME MODELS FAILED VERIFICATION.")
        sys.exit(1)

if __name__ == "__main__":
    main()
