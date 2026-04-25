"""Route exposing the sketch -> GLB pipeline.

Accepts either:
  * JSON body { "sketch_data_url": "data:image/png;base64,..." }
  * multipart/form-data with a "file" field (PNG)

Returns JSON { glb_url, source, used_fallback, job_id }.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from backend.pipeline.sketch_to_3d import runSketchTo3DPipeline

logger = logging.getLogger("sketch_to_3d.route")

router = APIRouter(tags=["sketch-to-3d"])


class SketchTo3DRequest(BaseModel):
    sketch_data_url: str = Field(
        ...,
        description="Base64 PNG data URL from the sketch canvas",
        min_length=32,
    )


class SketchTo3DResponse(BaseModel):
    glb_url: str
    source: str
    used_fallback: bool
    job_id: str | None = None
    fallback_reason: str | None = None


@router.post("/sketch-to-3d", response_model=SketchTo3DResponse)
async def sketch_to_3d_json(payload: SketchTo3DRequest) -> SketchTo3DResponse:
    try:
        result = await runSketchTo3DPipeline(data_url=payload.sketch_data_url)
    except ValueError as exc:
        logger.exception("sketch-to-3d: bad request")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("sketch-to-3d: pipeline failed")
        raise HTTPException(status_code=500, detail=f"pipeline_failed: {exc}") from exc
    return SketchTo3DResponse(**result)


@router.post("/sketch-to-3d/upload", response_model=SketchTo3DResponse)
async def sketch_to_3d_upload(file: UploadFile = File(...)) -> SketchTo3DResponse:
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload")
    try:
        result = await runSketchTo3DPipeline(file_bytes=raw)
    except ValueError as exc:
        logger.exception("sketch-to-3d upload: bad request")
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("sketch-to-3d upload: pipeline failed")
        raise HTTPException(status_code=500, detail=f"pipeline_failed: {exc}") from exc
    return SketchTo3DResponse(**result)
