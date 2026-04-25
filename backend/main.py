from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load backend/.env before importing routes/pipeline so MESHY_API_KEY is visible
# at import time (pipeline reads it at module scope). override=True so values in
# .env win over a stale empty MESHY_API_KEY in the shell environment.
import os  # noqa: E402

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
print(
    f"[startup] MESHY_API_KEY: {'SET (' + str(len(os.getenv('MESHY_API_KEY', ''))) + ' chars)' if os.getenv('MESHY_API_KEY') else 'NOT SET — pipeline will fall back to mock GLB'}"
)

from backend.routes.chat import router as chat_router  # noqa: E402
from backend.routes.generate import router as generate_router  # noqa: E402
from backend.routes.predict import router as predict_router  # noqa: E402
from backend.routes.sketch_to_3d import router as sketch_to_3d_router  # noqa: E402

app = FastAPI(
    title="ArtForge Backend",
    description="Sketch-to-3D API service for ArtForge",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(generate_router, prefix="/api")
app.include_router(predict_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(sketch_to_3d_router, prefix="/api")

_STATIC_DIR = Path(__file__).resolve().parent / "static"
_STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")
