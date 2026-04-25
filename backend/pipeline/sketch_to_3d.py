"""Minimal sketch -> 3D pipeline.

Takes a single PNG sketch from the frontend, ships it to a hosted
image-to-3D service (Meshy by default), and returns a GLB URL.
Falls back to a bundled mock GLB if no API key is configured or the
upstream call fails. Quality is intentionally not a goal here -- the
point is a working end-to-end demo.
"""

from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
import tempfile
import time
import uuid
from dataclasses import dataclass
from pathlib import Path

import httpx

logger = logging.getLogger("sketch_to_3d")
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[%(asctime)s] %(name)s %(levelname)s: %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


PROVIDER = os.getenv("SKETCH_TO_3D_PROVIDER", "meshy").lower()
MESHY_API_KEY = os.getenv("MESHY_API_KEY", "").strip()
MESHY_BASE_URL = os.getenv("MESHY_BASE_URL", "https://api.meshy.ai/openapi/v1").rstrip("/")
POLL_INTERVAL_SECONDS = float(os.getenv("SKETCH_TO_3D_POLL_INTERVAL", "3"))
POLL_TIMEOUT_SECONDS = float(os.getenv("SKETCH_TO_3D_POLL_TIMEOUT", "300"))

MOCK_GLB_PATH = Path(__file__).resolve().parent.parent / "static" / "mock_model.glb"
MOCK_GLB_PUBLIC_URL = os.getenv("MOCK_GLB_PUBLIC_URL", "/static/mock_model.glb")


@dataclass
class GlbResult:
    glb_url: str
    source: str  # "meshy" | "mock" | provider name
    used_fallback: bool
    job_id: str | None = None


_DATA_URL_RE = re.compile(r"^data:image/[A-Za-z0-9.+-]+;base64,(?P<b64>.+)$", re.DOTALL)


def receiveSketchImage(
    *,
    data_url: str | None = None,
    base64_payload: str | None = None,
    file_bytes: bytes | None = None,
) -> bytes:
    """Normalize whatever the frontend sent into raw PNG bytes.

    Accepts a base64 data URL (e.g. "data:image/png;base64,..."), a bare
    base64 string, or raw bytes from a multipart upload.
    """
    logger.info("step 1/5 receiveSketchImage: normalizing inbound sketch image")

    if file_bytes:
        if not file_bytes:
            raise ValueError("Multipart file is empty")
        logger.info("receiveSketchImage: got %d bytes from multipart upload", len(file_bytes))
        return file_bytes

    raw_b64 = base64_payload
    if data_url:
        match = _DATA_URL_RE.match(data_url.strip())
        if match:
            raw_b64 = match.group("b64")
        else:
            # Allow callers to pass already-stripped base64 in the data_url field.
            raw_b64 = data_url.strip()

    if not raw_b64:
        raise ValueError("No sketch image provided (expected data_url, base64, or file)")

    try:
        decoded = base64.b64decode(raw_b64, validate=False)
    except Exception as exc:  # noqa: BLE001
        raise ValueError(f"Could not decode base64 sketch: {exc}") from exc

    if not decoded:
        raise ValueError("Decoded sketch payload is empty")

    logger.info("receiveSketchImage: decoded %d bytes from base64", len(decoded))
    return decoded


def saveTempImage(image_bytes: bytes) -> Path:
    """Persist the PNG to a temp file and return the path."""
    logger.info("step 2/5 saveTempImage: writing PNG to temp dir")
    temp_dir = Path(tempfile.gettempdir()) / "artforge_sketches"
    temp_dir.mkdir(parents=True, exist_ok=True)
    path = temp_dir / f"sketch_{uuid.uuid4().hex}.png"
    path.write_bytes(image_bytes)
    logger.info("saveTempImage: saved %s (%d bytes)", path, len(image_bytes))
    return path


async def callImageTo3DApi(image_path: Path) -> GlbResult:
    """Send the saved PNG to the configured image-to-3D provider.

    Returns a GlbResult with a downloadable .glb URL. Falls back to the
    bundled mock GLB if no API key is set or the upstream call fails.
    """
    logger.info("step 3/5 callImageTo3DApi: provider=%s", PROVIDER)

    if PROVIDER == "meshy" and MESHY_API_KEY:
        try:
            return await _call_meshy(image_path)
        except Exception as exc:  # noqa: BLE001
            logger.warning("callImageTo3DApi: meshy call failed (%s); using mock fallback", exc)
            return _mock_result(reason=f"meshy_error:{exc}")

    if not MESHY_API_KEY:
        logger.warning("callImageTo3DApi: no MESHY_API_KEY set; using mock fallback")
    else:
        logger.warning("callImageTo3DApi: provider %r not implemented; using mock fallback", PROVIDER)
    return _mock_result(reason="no_api_key_or_unsupported_provider")


async def _call_meshy(image_path: Path) -> GlbResult:
    image_bytes = image_path.read_bytes()
    data_uri = "data:image/png;base64," + base64.b64encode(image_bytes).decode("ascii")

    headers = {
        "Authorization": f"Bearer {MESHY_API_KEY}",
        "Content-Type": "application/json",
    }
    create_payload = {
        "image_url": data_uri,
        "enable_pbr": False,
        "ai_model": os.getenv("MESHY_AI_MODEL", "meshy-4"),
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        logger.info("callImageTo3DApi: POST %s/image-to-3d", MESHY_BASE_URL)
        create_resp = await client.post(
            f"{MESHY_BASE_URL}/image-to-3d",
            headers=headers,
            json=create_payload,
        )
        create_resp.raise_for_status()
        body = create_resp.json()
        job_id = body.get("result") or body.get("id") or body.get("task_id")
        if not job_id:
            raise RuntimeError(f"Meshy create-job response missing id: {body}")
        logger.info("callImageTo3DApi: meshy job %s queued; polling for completion", job_id)

        deadline = time.monotonic() + POLL_TIMEOUT_SECONDS
        while True:
            if time.monotonic() > deadline:
                raise TimeoutError(f"Meshy job {job_id} did not finish in {POLL_TIMEOUT_SECONDS}s")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            poll = await client.get(
                f"{MESHY_BASE_URL}/image-to-3d/{job_id}",
                headers={"Authorization": f"Bearer {MESHY_API_KEY}"},
            )
            poll.raise_for_status()
            data = poll.json()
            status = (data.get("status") or "").upper()
            progress = data.get("progress")
            logger.info("callImageTo3DApi: meshy job %s status=%s progress=%s", job_id, status, progress)
            if status in {"SUCCEEDED", "SUCCESS", "COMPLETED"}:
                glb_url = (data.get("model_urls") or {}).get("glb") or data.get("model_url")
                if not glb_url:
                    raise RuntimeError(f"Meshy job {job_id} succeeded but no GLB url in response: {data}")
                return GlbResult(glb_url=glb_url, source="meshy", used_fallback=False, job_id=str(job_id))
            if status in {"FAILED", "CANCELED", "EXPIRED"}:
                raise RuntimeError(f"Meshy job {job_id} ended with status {status}: {data.get('task_error') or data}")


def _mock_result(reason: str) -> GlbResult:
    if not MOCK_GLB_PATH.exists():
        logger.error("callImageTo3DApi: mock GLB missing at %s", MOCK_GLB_PATH)
        raise FileNotFoundError(
            f"Mock GLB not found at {MOCK_GLB_PATH}. "
            "Add a sample .glb there or set MESHY_API_KEY."
        )
    logger.info("callImageTo3DApi: returning mock GLB (%s)", reason)
    return GlbResult(glb_url=MOCK_GLB_PUBLIC_URL, source="mock", used_fallback=True)


def returnGlbResult(result: GlbResult) -> dict[str, object]:
    """Shape the GlbResult into the JSON payload the frontend expects."""
    logger.info(
        "step 4/5 returnGlbResult: source=%s fallback=%s url=%s",
        result.source,
        result.used_fallback,
        result.glb_url,
    )
    return {
        "glb_url": result.glb_url,
        "source": result.source,
        "used_fallback": result.used_fallback,
        "job_id": result.job_id,
    }


async def runSketchTo3DPipeline(
    *,
    data_url: str | None = None,
    base64_payload: str | None = None,
    file_bytes: bytes | None = None,
) -> dict[str, object]:
    """End-to-end orchestrator: PNG in, GLB url out."""
    logger.info("step 0/5 runSketchTo3DPipeline: starting")
    image_bytes = receiveSketchImage(
        data_url=data_url,
        base64_payload=base64_payload,
        file_bytes=file_bytes,
    )
    image_path = saveTempImage(image_bytes)
    try:
        result = await callImageTo3DApi(image_path)
    finally:
        try:
            image_path.unlink(missing_ok=True)
        except OSError:
            logger.warning("runSketchTo3DPipeline: could not remove temp image %s", image_path)
    payload = returnGlbResult(result)
    logger.info("step 5/5 runSketchTo3DPipeline: done (%s)", payload["glb_url"])
    return payload
