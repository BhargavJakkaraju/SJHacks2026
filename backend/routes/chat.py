from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(tags=["chat"])


class SceneObject(BaseModel):
    id: str
    name: str
    position: tuple[float, float, float] = (0.0, 0.0, 0.0)
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0)
    scale: tuple[float, float, float] = (1.0, 1.0, 1.0)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    scene_graph: list[SceneObject] = Field(default_factory=list)


class SceneCommand(BaseModel):
    action: str
    target: str
    axis: str | None = None
    factor: float | None = None
    x: float | None = None
    y: float | None = None
    z: float | None = None


class ChatResponse(BaseModel):
    reply: str
    commands: list[SceneCommand]


@router.post("/chat", response_model=ChatResponse)
async def chat_edit(payload: ChatRequest) -> ChatResponse:
    # TODO: Replace heuristic parsing with a strict JSON LLM response.
    message = payload.message.lower()
    commands: list[SceneCommand] = []

    if "bigger" in message or "larger" in message:
        commands.append(
            SceneCommand(action="scale", target="selected", axis="all", factor=1.2)
        )
    if "smaller" in message:
        commands.append(
            SceneCommand(action="scale", target="selected", axis="all", factor=0.8)
        )
    if "up" in message:
        commands.append(SceneCommand(action="move", target="selected", y=0.2))
    if "down" in message:
        commands.append(SceneCommand(action="move", target="selected", y=-0.2))
    if "left" in message:
        commands.append(SceneCommand(action="move", target="selected", x=-0.2))
    if "right" in message:
        commands.append(SceneCommand(action="move", target="selected", x=0.2))
    if "rotate" in message:
        commands.append(SceneCommand(action="rotate", target="selected", axis="y", factor=0.3))

    if not commands:
        commands.append(SceneCommand(action="noop", target="scene"))

    return ChatResponse(
        reply="Parsed request into scene commands. Apply these on the frontend scene.",
        commands=commands,
    )
