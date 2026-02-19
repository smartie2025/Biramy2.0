"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  initializeFaceLandmarker,
  detectFaceLandmarks,
  getGlassesPosition,
  getEarringPosition,
} from "./FaceLandmarkService";

type Asset = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
};

type Smoothed = { x: number; y: number; scale: number; rotation: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Lower t = more smoothing (more stable, more lag). Try 0.18–0.30.
const smoothTransform = (prev: Smoothed | null, next: Smoothed, t = 0.22): Smoothed => {
  if (!prev) return next;

  // rotation wrap handling (avoid jump near 180/-180)
  const r1 = prev.rotation;
  const r2 = next.rotation;
  const diff = ((r2 - r1 + 540) % 360) - 180;
  const r = r1 + diff * t;

  return {
    x: lerp(prev.x, next.x, t),
    y: lerp(prev.y, next.y, t),
    scale: lerp(prev.scale, next.scale, t),
    rotation: r,
  };
};

export default function FaceTryOn() {
  // ---------- UI state ----------
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [started, setStarted] = useState(false);

  // Assets (Micro Mission B)
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");

  //---------- Debug states -----------
  const [imgStatus, setImgStatus] = useState<"none" | "loading" | "loaded" | "error">("none");
  const [imgError, setImgError] = useState<string>("");

  // ---------- Refs ----------
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const smoothGlassesRef = useRef<Smoothed | null>(null);
  const smoothLeftEarringRef = useRef<Smoothed | null>(null);
  const smoothRightEarringRef = useRef<Smoothed | null>(null);

  // Selected overlay image (Micro Mission C)
  const overlayImgRef = useRef<HTMLImageElement | null>(null);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedId) || null,
    [assets, selectedId]
  );

  // ---------- Stop camera function (stable reference) ----------
  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      // TS typing for srcObject is MediaProvider | null, but sometimes complains
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      video.srcObject = null;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    // reset smoothing so overlay doesn't "ghost"
    smoothGlassesRef.current = null;
    smoothLeftEarringRef.current = null;
    smoothRightEarringRef.current = null;

    setStatus("idle");
    setStarted(false);
  };

  // ---------- Fetch assets (Micro Mission B) ----------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/assets", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        // support either assets or columns key
        const list: Asset[] = (data?.assets ?? data?.columns ?? []).map((x: any) => ({
          id: String(x.id),
          name: String(x.name),
          category: String(x.category),
          imageUrl: String(x.imageUrl),
        }));

        setAssets(list);
      } catch (e) {
        console.warn("Failed to fetch assets:", e);
        // Keep UI usable even if assets fail
        setAssets([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ---------- Load selected image (Micro Mission C) ----------
/*   useEffect(() => {
    if (!selectedAsset?.imageUrl) {
      overlayImgRef.current = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous"; // required for drawing remote images to canvas
    img.src = selectedAsset.imageUrl;

    img.onload = () => {
      overlayImgRef.current = img;
    };

    img.onerror = () => {
      console.warn("Overlay image failed to load:", selectedAsset.imageUrl);
      overlayImgRef.current = null;
    };
  }, [selectedAsset?.imageUrl]); */

    useEffect(() => {
    if (!selectedAsset?.imageUrl) {
        overlayImgRef.current = null;
        setImgStatus("none");
        setImgError("");
        return;
    }

    setImgStatus("loading");
    setImgError("");

    const img = new Image();
    //img.crossOrigin = "anonymous";//temp disable CORS for local testing, but should be enabled in production if images are hosted on a different domain
    img.src = selectedAsset.imageUrl;

    img.onload = () => {
        overlayImgRef.current = img;
        setImgStatus("loaded");
    };

    img.onerror = () => {
        overlayImgRef.current = null;
        setImgStatus("error");
        setImgError(`Failed to load: ${selectedAsset.imageUrl}`);
    };
    }, [selectedAsset?.imageUrl]);


  // ---------- Camera + tracking loop ----------
  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    const start = async () => {
      try {
        setStatus("loading");

        const detector = await initializeFaceLandmarker();
        if (cancelled) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) throw new Error("Video element not ready");

        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        await video.play();
        if (cancelled) return;

        setStatus("ready");

        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas element not ready");

        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("2D context not available");

        const loop = () => {
  const v = videoRef.current;
  const c = canvasRef.current;
  if (!v || !c) return;

  // Ensure canvas matches the video’s actual pixel dimensions
  if (c.width !== v.videoWidth) c.width = v.videoWidth;
  if (c.height !== v.videoHeight) c.height = v.videoHeight;

  ctx.clearRect(0, 0, c.width, c.height);

  const { landmarks, faceDetected } = detectFaceLandmarks(v, detector);

  if (faceDetected && landmarks) {
    const img = overlayImgRef.current;

    // Always compute glasses position (stable anchor)
    const g = getGlassesPosition(landmarks, c.width, c.height);
    const gNext: Smoothed = { x: g.x, y: g.y, scale: g.scale, rotation: g.rotation };
    const t = (smoothGlassesRef.current = smoothTransform(smoothGlassesRef.current, gNext, 0.22));

    if (img) {
      // BIG draw so we can't miss it
      drawOverlayImage(ctx, img, t, 1.15, 0.45);
    } else {
      // If image not loaded yet, show placeholder glasses
      drawGlasses(ctx, t);
    }
  } else {
    // Reset smoothing when face lost (prevents ghost drifting)
    smoothGlassesRef.current = null;
    smoothLeftEarringRef.current = null;
    smoothRightEarringRef.current = null;
  }

  rafRef.current = requestAnimationFrame(loop);
};

        rafRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error(err);
        setStatus("error");
        stopCamera();
      }
    };

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]); // keep it focused

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="relative w-full overflow-hidden rounded-2xl shadow">
        {/* Mirror video & canvas together so overlay matches */}
        <video
          ref={videoRef}
          className="w-full h-auto transform scale-x-[-1]"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
        />
      </div>

      {/* Status */}
      <div className="mt-3 text-sm opacity-80">
        {status === "loading" && "Loading face tracker…"}
        {status === "ready" && "Tracker ready. Move your head—overlay should stay locked."}
        {status === "error" && "Camera/tracker error. Check permissions and console."}
        {status === "idle" && "Select an item, then start the camera."}
      </div>

      {/* Asset selector */}
      <div className="mt-4 space-y-2">
        <label className="text-sm font-medium">Choose an item</label>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">-- Select --</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.category} — {a.name}
            </option>
          ))}
        </select>
        
       
       <div className="mt-2 text-xs">
          Image status: <span className="font-semibold">{imgStatus}</span>
          {imgError ? <div className="text-red-600 break-all">{imgError}</div> : null}
        </div>

        {selectedAsset?.imageUrl ? (
          <img
            src={selectedAsset.imageUrl}
            alt={selectedAsset.name}
            className="mt-2 w-40 rounded border"
          />
        ) : null}


        {selectedAsset?.imageUrl && (
          <div className="text-xs opacity-70 break-all">
            Using: {selectedAsset.category} — {selectedAsset.name}
          </div>
        )}
      </div>

      {/* Buttons */}
      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Start Camera
        </button>
      ) : (
        <button
          onClick={stopCamera}
          className="mt-3 w-full rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-300"
        >
          Stop Camera
        </button>
      )}
    </div>
  );
}

// ----- Drawing helpers -----

function drawOverlayImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  t: Smoothed,
  widthScale = 1,
  heightScale = 1
) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotation * Math.PI) / 180);

  const w = t.scale * widthScale;
  const h = t.scale * heightScale;

  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawGlasses(ctx: CanvasRenderingContext2D, t: Smoothed) {
  ctx.save();
  ctx.translate(t.x, t.y);
  ctx.rotate((t.rotation * Math.PI) / 180);

  // simple frame placeholder
  ctx.lineWidth = 4;
  ctx.strokeStyle = "black";

  const w = t.scale;
  const h = t.scale * 0.35;

  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // bridge
  ctx.beginPath();
  ctx.moveTo(-w * 0.08, 0);
  ctx.lineTo(w * 0.08, 0);
  ctx.stroke();

  ctx.restore();
}
