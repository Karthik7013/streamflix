import os
import sys
import time
from urllib.parse import quote

import requests


def upload(file_path: str, folder: str = "videos", key: str | None = None) -> str:
    """Upload a file to Internet Archive S3-compatible storage.

    Uses the LOW auth scheme (access_key:secret_key in Authorization header).
    Returns the public URL of the uploaded file.

    If key is provided, upload to that exact key (deterministic path).
    Otherwise, generate a timestamped key from folder + filename.
    """
    access_key = os.environ.get("IA_S3_ACCESS_KEY")
    secret_key = os.environ.get("IA_S3_SECRET_KEY")
    bucket = os.environ.get("IA_S3_BUCKET")
    endpoint = os.environ.get("IA_S3_ENDPOINT")

    missing = [
        k
        for k, v in [
            ("IA_S3_ACCESS_KEY", access_key),
            ("IA_S3_SECRET_KEY", secret_key),
            ("IA_S3_BUCKET", bucket),
            ("IA_S3_ENDPOINT", endpoint),
        ]
        if not v
    ]
    if missing:
        print(f"Missing required env vars: {', '.join(missing)}", file=sys.stderr)
        print("Create a .env file or set them in your shell.", file=sys.stderr)
        sys.exit(1)

    if key is None:
        file_name = os.path.basename(file_path)
        key = f"{folder}/{int(time.time() * 1000)}-{file_name}"
    encoded_key = quote(key, safe="/")
    resource = f"/{bucket}/{encoded_key}"
    url = f"{endpoint.rstrip('/')}{resource}"

    file_size = os.path.getsize(file_path)

    print(f"Uploading to IA S3...", file=sys.stderr)
    print(f"  Bucket: {bucket}", file=sys.stderr)
    print(f"  Key:    {key}", file=sys.stderr)
    print(file=sys.stderr)

    class ProgressFile:
        def __init__(self, path):
            self.file = open(path, "rb")
            self.size = file_size
            self.read_so_far = 0

        def __iter__(self):
            return self

        def __next__(self):
            chunk = self.file.read(8192)
            if not chunk:
                raise StopIteration
            self.read_so_far += len(chunk)
            pct = (self.read_so_far / self.size) * 100
            print(
                f"\r  Uploading: {self.read_so_far / (1024*1024):.1f}/{self.size / (1024*1024):.1f} MB  ({pct:.0f}%)",
                end="",
                file=sys.stderr,
            )
            return chunk

        def __len__(self):
            return self.size

    try:
        resp = requests.put(
            url,
            data=ProgressFile(file_path),
            headers={
                "Authorization": f"LOW {access_key}:{secret_key}",
                "x-amz-auto-make-bucket": "1",
                "x-archive-meta-mediatype": "movies",
                "x-archive-meta-collection": "opensource",
                "Content-Type": "video/mp4",
            },
            timeout=3600,
        )
    except requests.exceptions.RequestException as e:
        print(f"\nUpload failed: {e}", file=sys.stderr)
        sys.exit(1)

    print(file=sys.stderr)

    if resp.status_code not in (200, 201):
        print(f"Upload failed (HTTP {resp.status_code}): {resp.text[:200]}", file=sys.stderr)
        sys.exit(1)

    print(f"  Done ({resp.status_code})", file=sys.stderr)
    return url
