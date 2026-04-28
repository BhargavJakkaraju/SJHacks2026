# 🏆 Bloom (SJHacks2026)

Bloom is a web-based creative IDE that turns **sketches, voice, and simple descriptions into 3D models**.

Built with accessibility in mind, Bloom removes the need for complex 3D tools—users can draw, speak, and describe their ideas, while the app handles the heavy lifting and guides them through the process.

Devpost: [View our project on Devpost](https://devpost.com/software/boom-ytjp4a)

### Core Capabilities

- **Sketch → 3D** — draw on a 2D canvas and generate `.glb` assets in one step  
- **Voice + Chat Input** — use speech-to-text or natural language to refine your model  
- **Interactive 3D Workspace** — preview, rotate, and transform models in real time  
- **Context-Aware AI** — get suggestions based on your current sketch and workflow  

<p align="center">
  <img src="https://github.com/user-attachments/assets/fe2c9155-22b7-4ffa-8f63-1b491d4ab7f4" width="700" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/f84444df-a506-4eb8-8735-de1bd150c712" width="700" />
</p>


## Project Structure

```text
SJHacks2026/
├── frontend/   # Next.js app (landing page, workspace UI, AI chat route)
├── backend/    # FastAPI app (sketch-to-3D pipeline + API routes)
├── README.md
└── RUN_APP.md
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind, Fabric.js, Three.js (`@react-three/fiber` + `@react-three/drei`), Zustand
- Backend: FastAPI, Pydantic, HTTPX, Uvicorn, Python dotenv
- AI/Generation:
  - Meshy Image-to-3D API (backend)
  - Google Gemini (frontend chat route)

## Features

- Sketchpad with clear/toggle prediction controls
- One-click sketch compile to 3D model (`Compile & Generate`)
- 3D model viewport with transform gizmo and generation metadata
- Fallback behavior to local mock model if Meshy is unavailable
- Context-aware AI chat that can inspect current sketch data URL

## Quick Start

### 1) Clone and install dependencies

```bash
git clone <your-repo-url>
cd SJHacks2026
```

Backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Frontend dependencies:

```bash
cd ../frontend
npm install
```

### 2) Configure environment variables

Create `backend/.env` (you can copy `backend/.env.example`):

```env
MESHY_API_KEY=your_meshy_api_key
# Optional
# MESHY_AI_MODEL=meshy-6
# SKETCH_TO_3D_PROVIDER=meshy
# SKETCH_TO_3D_POLL_INTERVAL=3
# SKETCH_TO_3D_POLL_TIMEOUT=300
```

Create `frontend/.env.local`:

```env
# Empty value means same-origin; set this when backend runs on another origin.
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Required for AI chat route
GEMINI_API_KEY=your_gemini_api_key
# Optional
# GEMINI_MODEL=gemini-1.5-flash
```

### 3) Run backend

From repo root:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### 4) Run frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Open:
- `http://localhost:3000` (landing page)
- `http://localhost:3000/workspace` (main app)

## How Generation Works

1. Frontend exports sketch canvas as PNG data URL.
2. `POST /api/sketch-to-3d` sends sketch to backend.
3. Backend pipeline:
   - decodes base64
   - writes a temp `.png`
   - sends to Meshy Image-to-3D
   - polls until completion
   - optionally mirrors returned `.glb` into `backend/static/generated/`
4. Frontend loads returned `glb_url` in the 3D viewport.

If Meshy fails or no API key is configured, backend falls back to `backend/static/mock_model.glb`.

