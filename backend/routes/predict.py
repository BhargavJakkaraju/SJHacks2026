from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.pipeline.clip_classifier import classify_sketch

router = APIRouter(tags=["predict"])


class PredictRequest(BaseModel):
    sketch_data_url: str = Field(
        ...,
        description="Base64 PNG data URL snapshot from canvas",
        min_length=32,
    )


class PredictResponse(BaseModel):
    label: str
    confidence: float
    should_suggest_autocomplete: bool
    suggestion: str | None = None


@router.post("/predict", response_model=PredictResponse)
async def predict_sketch(payload: PredictRequest) -> PredictResponse:
    label, confidence = await classify_sketch(payload.sketch_data_url)
    threshold = 0.8

    return PredictResponse(
        label=label,
        confidence=confidence,
        should_suggest_autocomplete=confidence >= threshold,
        suggestion=(
            f"Looks like a {label} - autocomplete?"
            if confidence >= threshold
            else None
        ),
    )
