# SJHacks2026 Setup and Run Guide

This guide is for a new developer (or another AI IDE) to get the project running and continue work safely.

## 1) What to install first

- Git
- Node.js LTS (recommended: Node 20+)
- npm (comes with Node)
- Python 3.11+ (project currently runs on Python 3.13 as well)

Optional but helpful:
- VS Code/Cursor
- Postman (for API testing)

## 2) Clone and open

```powershell
git clone <repo-url>
cd SJHacks2026
```

Project structure:
- `frontend/` -> Next.js app (UI + sketchpad + 3D preview)
- `backend/` -> FastAPI app (sketch-to-3D pipeline)

## 3) Backend setup

From repo root:

```powershell
cd backend
pip install -r requirements.txt
```

### Backend env file

Create/edit `backend/.env`:

```env
SKETCH_TO_3D_PROVIDER=meshy
MESHY_API_KEY=YOUR_MESHY_KEY_HERE
MESHY_BASE_URL=https://api.meshy.ai/openapi/v1
MESHY_AI_MODEL=meshy-4
SKETCH_TO_3D_POLL_INTERVAL=3
SKETCH_TO_3D_POLL_TIMEOUT=300
```

Important:
- Do not commit real secrets.
- `backend/.env` is gitignored by `backend/.gitignore`.

### Run backend

From repo root:

```powershell
uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

Expected:

```json
{"status":"ok"}
```

## 4) Frontend setup

In a new terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:
- `http://localhost:3000/workspace`

## 5) Full app test flow (manual)

1. Start backend on `127.0.0.1:8000`
2. Start frontend on `localhost:3000`
3. Open `/workspace`
4. Draw in sketchpad
5. Click **Compile & Generate**
6. Verify model appears in the 3D panel

Current frontend expects backend at:
- `http://127.0.0.1:8000` by default

If needed, set a frontend env variable in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Then restart `npm run dev`.

## 6) Key API endpoints

- `GET /health`
- `POST /api/sketch-to-3d` (JSON body with `sketch_data_url`)
- `POST /api/sketch-to-3d/upload` (multipart file upload)
- `GET /static/mock_model.glb` (fallback model)

## 7) Build/lint checks before pushing

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend quick check:

```powershell
cd ..
python -m py_compile backend/main.py
```

## 8) Common issues and fixes

### A) Port already in use

- Backend fails to start on `8000`: stop old process or use a different port.
- Frontend fails on `3000`: stop old process or run `npm run dev -- -p 3001`.

### B) Meshy not being charged / no generation

Usually means Meshy rejected request before job creation.

Check backend logs for:
- HTTP status from Meshy (often `400`)
- validation errors about image format or payload

### C) Always getting mock model

- `MESHY_API_KEY` missing/invalid in `backend/.env`
- backend not restarted after env change
- upstream Meshy request failed and fallback is enabled

### D) Viewer not showing model

- Verify backend returns a valid `glb_url`
- Open returned URL directly in browser
- Check browser console for model-viewer/runtime errors

## 9) Recommended workflow for continued development

1. Pull latest `main`
2. Create a feature branch
3. Run backend + frontend
4. Implement changes
5. Run lint/build checks
6. Commit with clear message
7. Push branch and open PR

## 10) Notes for AI IDEs

- Start by reading:
  - `frontend/src/app/workspace/page.tsx`
  - `frontend/src/components/sketchpad/Canvas.tsx`
  - `frontend/src/components/viewport/Scene.tsx`
  - `backend/main.py`
  - `backend/pipeline/sketch_to_3d.py`
  - `backend/routes/sketch_to_3d.py`
- Treat `backend/.env` as secret material.
- Do not commit `.pyc` or temporary/generated files.
