#!/usr/bin/env python3
"""
Generate or edit photorealistic images with OpenAI's image API (gpt-image-1).

Text-to-image:
    python generate_image.py --prompt "..." --output "out.png"

Image edit / variation (keeps a reference photo's subject, framing, or product
consistent while changing details in the prompt):
    python generate_image.py --prompt "..." --input-image ref.jpg --output "out.png"
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

import requests

API_BASE = "https://api.openai.com/v1"
SIZES = ["1024x1024", "1024x1536", "1536x1024", "auto"]
QUALITIES = ["low", "medium", "high", "auto"]
BACKGROUNDS = ["transparent", "opaque", "auto"]
FORMATS = ["png", "jpeg", "webp"]


def load_env_file():
    """Load .env file by walking up from this script's location."""
    current = Path(__file__).resolve().parent
    for _ in range(10):
        env_path = current / ".env"
        if env_path.exists():
            with open(env_path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        value = value.strip().strip('"').strip("'")
                        os.environ.setdefault(key.strip(), value)
            return
        current = current.parent


def get_api_key():
    load_env_file()
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set", file=sys.stderr)
        print("Get a key from https://platform.openai.com/api-keys", file=sys.stderr)
        sys.exit(1)
    return api_key


def handle_response(resp):
    if resp.status_code != 200:
        try:
            detail = resp.json().get("error", {}).get("message", resp.text)
        except ValueError:
            detail = resp.text
        print(f"API error: {resp.status_code} - {detail}", file=sys.stderr)
        if resp.status_code == 401:
            print("Invalid API key. Check your OPENAI_API_KEY.", file=sys.stderr)
        elif resp.status_code == 429:
            print("Rate limit or quota exceeded. Wait and try again.", file=sys.stderr)
        elif resp.status_code == 400:
            print(
                "Bad request — often a content-policy rejection. Rephrase the "
                "prompt (avoid real named people, brands, or unsafe content).",
                file=sys.stderr,
            )
        sys.exit(1)
    return resp.json()


def generate(api_key: str, prompt: str, size: str, quality: str, background: str,
             output_format: str, n: int) -> list:
    payload = {
        "model": "gpt-image-1",
        "prompt": prompt,
        "size": size,
        "quality": quality,
        "background": background,
        "output_format": output_format,
        "n": n,
    }
    resp = requests.post(
        f"{API_BASE}/images/generations",
        headers={"Authorization": f"Bearer {api_key}"},
        json=payload,
        timeout=120,
    )
    return handle_response(resp)["data"]


def edit(api_key: str, prompt: str, input_images: list, mask: str, size: str,
          quality: str, n: int) -> list:
    files = [
        ("image[]", (Path(p).name, open(p, "rb"), "image/png"))
        for p in input_images
    ]
    if mask:
        files.append(("mask", (Path(mask).name, open(mask, "rb"), "image/png")))
    data = {"model": "gpt-image-1", "prompt": prompt, "size": size, "quality": quality, "n": str(n)}
    try:
        resp = requests.post(
            f"{API_BASE}/images/edits",
            headers={"Authorization": f"Bearer {api_key}"},
            data=data,
            files=files,
            timeout=120,
        )
    finally:
        for _, (_, fh, _) in files:
            fh.close()
    return handle_response(resp)["data"]


def main():
    parser = argparse.ArgumentParser(description="Generate or edit images with OpenAI's gpt-image-1")
    parser.add_argument("--prompt", required=True, help="Detailed image description")
    parser.add_argument("--output", required=True, help="Output file path (index suffixed if --n > 1)")
    parser.add_argument("--size", choices=SIZES, default="auto")
    parser.add_argument("--quality", choices=QUALITIES, default="high")
    parser.add_argument("--background", choices=BACKGROUNDS, default="opaque",
                         help="Text-to-image only; ignored for --input-image edits")
    parser.add_argument("--output-format", choices=FORMATS, default="png",
                         help="Text-to-image only; edits always return PNG")
    parser.add_argument("--n", type=int, default=1, help="Number of variations to generate (1-10)")
    parser.add_argument("--input-image", nargs="+",
                         help="One or more reference images to edit/vary instead of generating from scratch")
    parser.add_argument("--mask", help="Optional PNG mask for --input-image edits (transparent = area to replace)")
    args = parser.parse_args()

    api_key = get_api_key()

    if args.input_image:
        data = edit(api_key, args.prompt, args.input_image, args.mask, args.size, args.quality, args.n)
    else:
        data = generate(api_key, args.prompt, args.size, args.quality, args.background,
                         args.output_format, args.n)

    out_path = Path(args.output)
    written = []
    for i, item in enumerate(data):
        path = out_path if len(data) == 1 else out_path.with_stem(f"{out_path.stem}-{i + 1}")
        path.write_bytes(base64.b64decode(item["b64_json"]))
        written.append(str(path))

    print(json.dumps({"files": written}, indent=2))


if __name__ == "__main__":
    main()
