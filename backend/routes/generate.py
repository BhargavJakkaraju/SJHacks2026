from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.pipeline.controlnet import render_from_sketch
from backend.pipeline.triposr import mesh_from_image, postprocess_mesh

router = APIRouter(tags=["generate"])


class GenerateRequest(BaseModel):
    sketch_data_url: str = Field(
        ...,
        description="Base64 PNG data URL from sketch canvas export",
        min_length=32,
    )
    prompt: str | None = Field(
        default=None,
        description="Optional style/object prompt to guide generation",
    )


class GenerateResponse(BaseModel):
    glb_url: str
    rendered_image_url: str
    status: str


@router.post("/generate", response_model=GenerateResponse)
async def generate_model(payload: GenerateRequest) -> GenerateResponse:
    # TODO: swap stub pipeline with real ControlNet + TripoSR integration.
    rendered_image_url = await render_from_sketch(payload.sketch_data_url, payload.prompt)
    raw_mesh_url = await mesh_from_image(rendered_image_url)
    glb_url = await postprocess_mesh(raw_mesh_url)

    return GenerateResponse(
        glb_url=glb_url,
        rendered_image_url=rendered_image_url,
        status="queued_for_render",
    )
