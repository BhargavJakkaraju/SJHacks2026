# ArtForge Run Guide (For Humans + AI IDEs)

This file is the single source of truth for how to install and run this project locally.

## Project Layout

- `frontend/` -> Next.js app (UI, sketch canvas, workspace)
- `backend/` -> FastAPI app (generate/predict/chat API stubs)

## Prerequisites

Install these first:

1. Node.js 20+ (includes npm)
2. Python 3.11+ (3.10+ may still work, but 3.11 is recommended)
3. Git

Optional but recommended:

- `venv` (Python virtual environment)

## Quick Start (Windows PowerShell)

Open two terminals from repo root (`SJHacks2026`).

### Terminal 1: Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend should be available at:

- API base: `http://localhost:8000`
- Health check: `http://localhost:8000/health`
- Swagger docs: `http://localhost:8000/docs`

### Terminal 2: Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend should be available at:

- `http://localhost:3000`
- Workspace page: `http://localhost:3000/workspace`

## Quick Start (macOS/Linux)

Use two terminals from repo root.

### Terminal 1: Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend

```bash
cd frontend
npm install
npm run dev
```

## Required Ports

- `3000` -> Next.js frontend
- `8000` -> FastAPI backend

If these are busy, stop conflicting processes or run with different ports.

## Current Environment Variables

No required `.env` variables are currently needed to boot this repo.

The backend AI pipeline is currently stubbed and does not require API keys to start.

## Validate Startup

After both services are running:

1. Open `http://localhost:3000/workspace`
2. Draw on the white sketch canvas (black ink)
3. Click **Clear Canvas** and confirm sketch resets
4. Open `http://localhost:8000/health` and verify response:

```json
{"status":"ok"}
```

## Useful Commands

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
python -m uvicorn main:app --reload
```

## Common Fixes

### PowerShell script execution blocked

If venv activation is blocked:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then re-run:

```powershell
.\.venv\Scripts\Activate.ps1
```

### `python` not found

Try `py` on Windows:

```powershell
py -m venv .venv
py -m pip install -r requirements.txt
py -m uvicorn main:app --reload --port 8000
```

### Clean reinstall frontend dependencies

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

