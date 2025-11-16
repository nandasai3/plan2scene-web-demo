import React, { useState } from "react";
import { uploadFloorplan, getJobStatus } from "./api";

type JobState = {
  jobId: string | null;
  status: string | null;
  sceneUrl: string | null;
  videoUrl: string | null;
  error: string | null;
};

const POLL_INTERVAL = 1500;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<JobState>({
    jobId: null,
    status: null,
    sceneUrl: null,
    videoUrl: null,
    error: null,
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setJob({
      jobId: null,
      status: null,
      sceneUrl: null,
      videoUrl: null,
      error: null,
    });
  };

  const startPolling = (jobId: string) => {
    const poll = async () => {
      try {
        const status = await getJobStatus(jobId);
        setJob((prev) => ({
          jobId,
          status: status.status || prev.status,
          sceneUrl: status.scene_url || null,
          videoUrl: status.video_url || null,
          error: status.error || null,
        }));

        if (status.status === "done" || status.status === "failed") {
          return; // stop polling
        }

        setTimeout(poll, POLL_INTERVAL);
      } catch (err) {
        console.error(err);
        setJob((prev) => ({
          ...prev,
          error: "Failed to fetch job status",
        }));
      }
    };

    poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    setJob({
      jobId: null,
      status: "queued",
      sceneUrl: null,
      videoUrl: null,
      error: null,
    });

    try {
      const res = await uploadFloorplan(file);
      setJob((prev) => ({ ...prev, jobId: res.jobId, status: "running" }));
      startPolling(res.jobId);
    } catch (err) {
      console.error(err);
      setJob({
        jobId: null,
        status: "failed",
        sceneUrl: null,
        videoUrl: null,
        error: "Failed to submit floorplan",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const statusBadgeClass =
    job.status === "done"
      ? "status-badge status-done"
      : job.status === "failed"
      ? "status-badge status-failed"
      : job.status === "running"
      ? "status-badge status-running"
      : "status-badge";

  return (
    <div className="page">
      <div className="page-overlay" />

      <header className="header">
        <div className="logo-circle">P2</div>
        <div className="header-text">
          <h1>Plan2Scene Studio</h1>
          <p>Turn 2D floorplans into immersive 3D interiors.</p>
        </div>
      </header>

      <main className="main">
        <section className="card card-upload">
          <h2>Upload floorplan</h2>
          <p className="subtitle">
            Upload a <strong>PNG / JPG</strong> floorplan. We&apos;ll generate a
            preview image and a walkthrough video preview.
          </p>

          <form onSubmit={handleSubmit} className="upload-form">
            <label className="file-drop">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleFileChange}
              />
              <div className="file-drop-content">
                <div className="file-icon">🧱</div>
                <div>
                  {file ? (
                    <p className="file-name">{file.name}</p>
                  ) : (
                    <p className="file-hint">
                      Click to browse or drop a floorplan image here
                    </p>
                  )}
                  <p className="file-subhint">
                    Tip: Use a clear top-down floorplan for best results.
                  </p>
                </div>
              </div>
            </label>

            <button
              type="submit"
              className="primary-btn"
              disabled={!file || isUploading}
            >
              {isUploading ? "Uploading..." : "Convert to 3D interior"}
            </button>
          </form>

          <div className="status-row">
            <span className="status-label">Job status:</span>
            <span className={statusBadgeClass}>
              {job.status ? job.status.toUpperCase() : "IDLE"}
            </span>
            {job.jobId && (
              <span className="job-id">Job ID: {job.jobId}</span>
            )}
          </div>

          {job.error && <p className="error-text">{job.error}</p>}
        </section>

        <section className="card card-results">
          <h2>3D scene & walkthrough</h2>
          <p className="subtitle">
            Once processing finishes, you&apos;ll see a preview image and a
            video preview.
          </p>

          <div className="results-grid">
            <div className="results-box">
              <h3>3D Preview</h3>
              {job.sceneUrl ? (
                <a
                  href={job.sceneUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="link-btn"
                >
                  View preview image
                </a>
              ) : (
                <p className="placeholder">Preview image will appear here.</p>
              )}
            </div>

            <div className="results-box">
              <h3>Walkthrough video</h3>
              {job.videoUrl ? (
                <video
                  src={job.videoUrl}
                  controls
                  className="video-player"
                  preload="metadata"
                />
              ) : (
                <p className="placeholder">
                  Video walkthrough will appear here.
                </p>
              )}
            </div>
          </div>

          <div className="note">
            <strong>Note:</strong> The preview image is a transformed version of
            your uploaded floorplan, and the video is a sample walkthrough. The
            API is structured so it can be connected to a full Plan2Scene
            pipeline later.
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
