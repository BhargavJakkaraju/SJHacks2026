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

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
GENERATED_DIR = STATIC_DIR / "generated"
MOCK_GLB_PATH = STATIC_DIR / "mock_model.glb"
MOCK_GLB_PUBLIC_URL = os.getenv("MOCK_GLB_PUBLIC_URL", "/static/mock_model.glb")

# Whether to mirror the GLB Meshy returns into our /static dir so the frontend
# can load it from same-origin without dealing with the upstream signed URL
# expiring or hitting CORS. On by default; set MESHY_MIRROR_GLB=0 to disable.
MIRROR_MESHY_GLB = os.getenv("MESHY_MIRROR_GLB", "1") not in {"0", "false", "False"}


@dataclass
class GlbResult:
    glb_url: str
    source: str  # "meshy" | "mock" | provider name
    used_fallback: bool
    job_id: str | None = None
    fallback_reason: str | None = None


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
            reason = str(exc).strip() or type(exc).__name__
            logger.warning("callImageTo3DApi: meshy call failed (%s); using mock fallback", reason)
            return _mock_result(reason=f"meshy_error: {reason}")

    if not MESHY_API_KEY:
        logger.warning("callImageTo3DApi: no MESHY_API_KEY set; using mock fallback")
        return _mock_result(reason="MESHY_API_KEY not set")
    logger.warning("callImageTo3DApi: provider %r not implemented; using mock fallback", PROVIDER)
    return _mock_result(reason=f"unsupported_provider:{PROVIDER}")


async def _call_meshy(image_path: Path) -> GlbResult:
    image_bytes = image_path.read_bytes()
    data_uri = "data:image/png;base64," + base64.b64encode(image_bytes).decode("ascii")

    headers = {"Authorization": f"Bearer {MESHY_API_KEY}"}
    # Defaults tuned to produce a usable model from a single PNG sketch.
    # See https://docs.meshy.ai/api/image-to-3d
    ai_model = os.getenv("MESHY_AI_MODEL", "meshy-6")
    create_payload: dict[str, object] = {
        "image_url": data_uri,
        "ai_model": ai_model,
        "topology": os.getenv("MESHY_TOPOLOGY", "triangle"),
        "target_polycount": int(os.getenv("MESHY_TARGET_POLYCOUNT", "30000")),
        "should_remesh": True,
        "should_texture": True,
        "symmetry_mode": os.getenv("MESHY_SYMMETRY_MODE", "auto"),
    }
    # enable_pbr is only valid on legacy models (meshy-3 and older); meshy-4+
    # rejects the field with HTTP 400.
    if ai_model not in {"meshy-4", "meshy-5", "meshy-6"}:
        create_payload["enable_pbr"] = os.getenv("MESHY_ENABLE_PBR", "1") not in {"0", "false", "False"}

    # Ignore host-level proxy env vars (HTTP_PROXY/HTTPS_PROXY/etc) so local
    # proxy tooling cannot intercept Meshy calls and cause false 403s.
    # Meshy can take >60s to accept queued create requests under load, so keep
    # a larger read timeout to avoid spurious fallback on the initial POST.
    timeout = httpx.Timeout(connect=10.0, read=180.0, write=60.0, pool=10.0)
    async with httpx.AsyncClient(timeout=timeout, trust_env=False) as client:
        create_url = f"{MESHY_BASE_URL}/image-to-3d"
        logger.info("callImageTo3DApi: POST %s (payload keys=%s)", create_url, list(create_payload))
        try:
            create_resp = await client.post(create_url, headers=headers, json=create_payload)
            create_resp.raise_for_status()
        except httpx.TimeoutException as exc:
            raise RuntimeError("Meshy create timed out while waiting for response") from exc
        except httpx.HTTPStatusError as exc:
            # Meshy returns useful error JSON; surface it instead of just a status code.
            raise RuntimeError(
                f"Meshy create failed {exc.response.status_code}: {exc.response.text[:500]}"
            ) from exc

        body = create_resp.json()
        job_id = body.get("result") or body.get("id") or body.get("task_id")
        if not job_id:
            raise RuntimeError(f"Meshy create-job response missing id: {body}")
        logger.info("callImageTo3DApi: meshy job %s queued; polling for completion", job_id)

        deadline = time.monotonic() + POLL_TIMEOUT_SECONDS
        last_progress: int | None = None
        while True:
            if time.monotonic() > deadline:
                raise TimeoutError(f"Meshy job {job_id} did not finish in {POLL_TIMEOUT_SECONDS}s")
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
            poll = await client.get(
                f"{MESHY_BASE_URL}/image-to-3d/{job_id}",
                headers=headers,
            )
            try:
                poll.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise RuntimeError(
                    f"Meshy poll failed {exc.response.status_code}: {exc.response.text[:500]}"
                ) from exc
            data = poll.json()
            status = (data.get("status") or "").upper()
            progress = data.get("progress")
            if progress != last_progress:
                logger.info("callImageTo3DApi: meshy job %s status=%s progress=%s", job_id, status, progress)
                last_progress = progress
            if status in {"SUCCEEDED", "SUCCESS", "COMPLETED"}:
                glb_url = (data.get("model_urls") or {}).get("glb") or data.get("model_url")
                if not glb_url:
                    raise RuntimeError(f"Meshy job {job_id} succeeded but no GLB url in response: {data}")
                if MIRROR_MESHY_GLB:
                    try:
                        local_url = await _mirror_glb(client, glb_url, str(job_id))
                        return GlbResult(glb_url=local_url, source="meshy", used_fallback=False, job_id=str(job_id))
                    except Exception as exc:  # noqa: BLE001
                        logger.warning("callImageTo3DApi: failed to mirror GLB locally (%s); returning upstream URL", exc)
                return GlbResult(glb_url=glb_url, source="meshy", used_fallback=False, job_id=str(job_id))
            if status in {"FAILED", "CANCELED", "EXPIRED"}:
                raise RuntimeError(f"Meshy job {job_id} ended with status {status}: {data.get('task_error') or data}")


async def _mirror_glb(client: httpx.AsyncClient, glb_url: str, job_id: str) -> str:
    """Download the GLB to backend/static/generated/ and return its public URL."""
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = GENERATED_DIR / f"meshy_{job_id}.glb"
    logger.info("callImageTo3DApi: downloading GLB for job %s to %s", job_id, out_path)
    resp = await client.get(glb_url, timeout=120.0)
    resp.raise_for_status()
    out_path.write_bytes(resp.content)
    return f"/static/generated/{out_path.name}"


def _mock_result(reason: str) -> GlbResult:
    if not MOCK_GLB_PATH.exists():
        logger.error("callImageTo3DApi: mock GLB missing at %s", MOCK_GLB_PATH)
        raise FileNotFoundError(
            f"Mock GLB not found at {MOCK_GLB_PATH}. "
            "Add a sample .glb there or set MESHY_API_KEY."
        )
    logger.info("callImageTo3DApi: returning mock GLB (%s)", reason)
    return GlbResult(
        glb_url=MOCK_GLB_PUBLIC_URL,
        source="mock",
        used_fallback=True,
        fallback_reason=reason,
    )


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
        "fallback_reason": result.fallback_reason,
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
