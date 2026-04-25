from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

_BACKEND_DIR = Path(__file__).resolve().parent
load_dotenv(_BACKEND_DIR / ".env", override=True)

from backend.routes.chat import router as chat_router
from backend.routes.generate import router as generate_router
from backend.routes.predict import router as predict_router
from backend.routes.sketch_to_3d import router as sketch_to_3d_router

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

_STATIC_DIR = _BACKEND_DIR / "static"
_STATIC_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(_STATIC_DIR)), name="static")
