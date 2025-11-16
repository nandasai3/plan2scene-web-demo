const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function uploadFloorplan(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to start job");
  }

  return res.json() as Promise<{ jobId: string }>;
}

export async function getJobStatus(jobId: string) {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!res.ok) {
    throw new Error("Failed to get job status");
  }
  return res.json() as Promise<{
    status?: string;
    scene_url?: string;
    video_url?: string;
    error?: string | null;
  }>;
}
