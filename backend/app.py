import os
import uuid

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from PIL import Image, ImageOps  # simpler: only what we need

# ---------- FOLDERS ----------
BASE_DIR = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
FILES_DIR = os.path.join(BASE_DIR, "files")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FILES_DIR, exist_ok=True)

# ---------- APP ----------
app = FastAPI(title="Plan2Scene Web Demo")

# Debug endpoint to inspect files folder
@app.get("/debug/files")
def debug_files():
    return {
        "BASE_DIR": BASE_DIR,
        "FILES_DIR": FILES_DIR,
        "exists": os.path.exists(FILES_DIR),
        "files": os.listdir(FILES_DIR) if os.path.exists(FILES_DIR) else [],
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # ok for demo
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve /files/<filename>
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")

# In-memory jobs
JOBS = {}  # job_id -> {status, scene_url, video_url, error}

# For local dev, default is http://localhost:8000
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "http://localhost:8000")


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/generate")
async def generate(file: UploadFile = File(...)):
    """
    1. Save uploaded 2D floorplan image.
    2. Create a simple 'blueprint style' preview image from it.
    3. Return links to preview image + sample.mp4 video.
    """
    job_id = str(uuid.uuid4())[:8]

    # 1) Save upload
    raw_filename = f"{job_id}_{file.filename}"
    upload_path = os.path.join(UPLOAD_DIR, raw_filename)
    with open(upload_path, "wb") as f:
        f.write(await file.read())

    # 2) Generate preview image that clearly looks processed
    preview_filename = f"{job_id}_preview.png"
    preview_path = os.path.join(FILES_DIR, preview_filename)

    status = "done"
    error = None
    scene_url = None

    try:
        with Image.open(upload_path) as img:
            # Convert to grayscale
            img = img.convert("L")

            # Auto-contrast to make lines pop
            img = ImageOps.autocontrast(img)

            # Resize to a reasonable maximum size
            max_side = 800
            img.thumbnail((max_side, max_side))

            # Colorize grayscale into a bluish "blueprint" style
            # dark = almost black, light = cyan
            img_color = ImageOps.colorize(img, black="#050811", white="#7dd3fc")

            # Add a small border so it looks like a card
            border = 20
            img_with_border = ImageOps.expand(
                img_color, border=border, fill="#020617"
            )

            # Save preview
            img_with_border.save(preview_path, format="PNG")

        scene_url = f"{PUBLIC_BASE_URL}/files/{preview_filename}"

    except Exception as e:
        status = "failed"
        # expose real reason so we can debug if needed
        error = f"Failed to process image: {e}"
        scene_url = None

    # 3) Use static sample video for now
    video_url = f"{PUBLIC_BASE_URL}/files/sample.mp4"

    JOBS[job_id] = {
        "status": status,
        "scene_url": scene_url,
        "video_url": video_url,
        "error": error,
    }

    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        return {"error": "not found"}
    return job
