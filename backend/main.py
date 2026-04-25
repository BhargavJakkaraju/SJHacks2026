from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.chat import router as chat_router
from backend.routes.generate import router as generate_router
from backend.routes.predict import router as predict_router

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
