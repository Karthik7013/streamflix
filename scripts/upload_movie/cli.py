import argparse
import json
import os
import sys

from .ffmpeg import probe, transcode
from .upload import upload


def load_env(path: str | None = None):
    """Load .env file if available."""
    if path is None:
        path = os.path.join(os.path.dirname(__file__), ".env")
        if not os.path.exists(path):
            path = ".env"

    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip("\"'")
                if key not in os.environ:
                    os.environ[key] = value


def format_duration(seconds: float) -> str:
    h, r = divmod(int(seconds), 3600)
    m, s = divmod(r, 60)
    if h:
        return f"{h}h {m}m {s}s"
    return f"{m}m {s}s"


def main():
    parser = argparse.ArgumentParser(
        description="Upload a movie to the catalog: transcode with ffmpeg, upload to IA S3, print the URL.",
    )
    parser.add_argument("input", help="Path to the source video file")
    parser.add_argument("--title", help="Movie title (used for output naming)")
    parser.add_argument(
        "--crf",
        type=int,
        default=23,
        help="ffmpeg CRF value (0-51, lower = better quality, default: 23)",
    )
    parser.add_argument(
        "--resolution",
        type=int,
        help="Max output height (e.g. 720, 1080). Scales maintaining aspect ratio.",
    )
    parser.add_argument(
        "--folder",
        default="videos",
        help="IA S3 folder/key prefix (default: videos)",
    )
    parser.add_argument("--env", help="Path to .env file with IA credentials")
    parser.add_argument(
        "--skip-transcode",
        action="store_true",
        help="Skip ffmpeg step, upload file as-is",
    )
    parser.add_argument(
        "--output",
        help="Output path for transcoded file (default: temp dir)",
    )
    parser.add_argument(
        "--key",
        help="Deterministic S3 key (e.g. 'movies/2026/inception/videos/movie.mp4'). Overrides --folder.",
    )

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"File not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    load_env(args.env)

    # Probe source
    print(f"Probing {args.input}...", file=sys.stderr)
    info = probe(args.input)
    print(
        f"  {info['width']}x{info['height']}  |  {info['codec']}  |  {format_duration(info['duration_seconds'])}",
        file=sys.stderr,
    )
    print(file=sys.stderr)

    # Build output path from title if provided
    if args.output is None and args.title:
        safe_title = args.title.lower().replace(" ", "-")
        safe_title = "".join(c for c in safe_title if c.isalnum() or c in "-_")
        args.output = os.path.join(
            os.path.dirname(args.input) or ".",
            f"{safe_title}_optimized.mp4",
        )

    # Transcode
    if args.skip_transcode:
        transcoded = args.input
        print("Skipping transcode (--skip-transcode)", file=sys.stderr)
    else:
        transcoded = transcode(
            args.input,
            output_path=args.output,
            crf=args.crf,
            max_resolution=args.resolution,
        )

    print(file=sys.stderr)

    # Upload
    url = upload(transcoded, folder=args.folder, key=args.key)

    print(file=sys.stderr)

    # Output JSON result to stdout
    result = {
        "url": url,
        "duration": info["duration_seconds"],
        "size": os.path.getsize(transcoded),
        "original": os.path.basename(args.input),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
