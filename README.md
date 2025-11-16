# Plan2Scene Web Demo – 2D Floorplan → 3D Scene + Walkthrough

This project is a small full-stack web application that demonstrates a workflow for converting **2D floorplans** into **3D-ready scene data** and a **walkthrough video preview**, following the structure of the [Plan2Scene](https://github.com/3dlg-hcvc/plan2scene/) pipeline.

> **Live demo (frontend):** https://fluffy-horse-badef8.netlify.app  
> **Backend API (Railway):** https://plan2scene-web-demo-production.up.railway.app  
> **Repository:** https://github.com/nandasai3/plan2scene-web-demo

---

## 1. High-level overview

The app lets a user:

1. Upload a 2D floorplan image (PNG/JPEG) from the browser.
2. The React frontend sends the file to a FastAPI backend.
3. The backend simulates running the Plan2Scene pipeline and returns:
   - A `scene.json` file in the Plan2Scene-style format.
   - A walkthrough `sample.mp4` video.
4. The frontend shows:
   - Job status (queued → running → done).
   - A download link for `scene.json`.
   - An embedded video player for the walkthrough.

> **Note:** Because the real Plan2Scene pipeline is heavy (GPU, large models, long-running jobs), this demo uses **precomputed sample outputs** (`sample.scene.json` and `sample.mp4`) and a lightweight image-processing step to keep things fast and deployable on free tiers.  
> The backend and job API are structured so that a real GPU Plan2Scene worker can be plugged in later.

---

## 2. Tech stack

**Frontend**

- React + TypeScript (Vite)
- Fetch API for HTTP calls
- Custom dark “3D interior studio” theme (pure CSS)

**Backend**

- Python 3 + FastAPI
- Uvicorn ASGI server
- `python-multipart` for file uploads
- `StaticFiles` for serving `scene.json` and `sample.mp4`

**Deployment**

- **Backend:** Railway (FastAPI app, exposed over HTTPS)
- **Frontend:** Netlify (builds `frontend` via `npm run build` and serves `dist`)
- **Environment variables:** 
  - Backend: `PUBLIC_BASE_URL`
  - Frontend: `VITE_API_BASE`

---

## 3. Project structure

```text
floor3d_new/
  backend/
    app.py
    requirements.txt
    uploads/        # uploaded floorplan images
    files/
      sample.scene.json
      sample.mp4
      ...           # (optional) generated preview assets
  frontend/
    index.html
    package.json
    vite.config.ts
    src/
      App.tsx
      api.ts
      main.tsx
      index.css
