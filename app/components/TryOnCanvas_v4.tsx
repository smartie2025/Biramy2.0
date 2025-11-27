"use client";

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
} from "react";

export type OverlayDef = {
  src: string;
  anchor?: "center" | "top-left" | "bottom-center";
};

export type TryOnCanvasHandle = {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  resetOverlay: () => void;
  takeSnapshot: () => string | null; // returns dataURL
};

interface Props {
  selected?: OverlayDef | null;
  mirror?: boolean;
  opacity?: number; // 0..1
  controlledScale?: number;
  controlledRotation?: number; // radians

  // external XYZ-style controls
  controlledOffset?: { x: number; y: number }; // X/Y
  controlledDepth?: number; // extra Z factor that affects scale
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};

const TryOnCanvas = forwardRef<TryOnCanvasHandle, Props>(function TryOnCanvas(
  {
    selected,
    mirror = true,
    opacity = 1,
    controlledScale,
    controlledRotation,
    controlledOffset,
    controlledDepth,
  },
  ref
) {
  // DOM refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Media stream
  const streamRef = useRef<MediaStream | null>(null);

  // Render loop
  const rafRef = useRef<number | null>(null);

  // Overlay image cache
  const [overlayImg, setOverlayImg] = useState<HTMLImageElement | null>(null);

  // Internal transform state (for gestures / wheel)
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // radians

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** ===== Overlay image loading ===== */
  useEffect(() => {
    if (!selected?.src) {
      setOverlayImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setOverlayImg(img);
    img.onerror = () => setOverlayImg(null);
    img.src = selected.src;
  }, [selected?.src]);

  /** ===== Canvas resize ===== */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const { clientWidth, clientHeight } = container;
    canvas.width = Math.max(2, Math.floor(clientWidth * dpr));
    canvas.height = Math.max(2, Math.floor(clientHeight * dpr));
    canvas.style.width = `${clientWidth}px`;
    canvas.style.height = `${clientHeight}px`;
  }, []);

  /** ===== Camera control ===== */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      if (streamRef.current) return;
      const stream = await navigator.mediaDevices.getUserMedia(
        VIDEO_CONSTRAINTS
      );
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (e: any) {
      setError(
        e?.name === "NotAllowedError"
          ? "Camera access was denied. Please enable permissions and retry."
          : "Unable to start camera. Check device permissions or if another app is using the camera."
      );
      setReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setReady(false);
  }, []);

  const resetOverlay = useCallback(() => {
    setPos({ x: 0, y: 0 });
    setScale(1);
    setRotation(0);
  }, []);

  const takeSnapshot = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL("image/png", 1.0);
    } catch {
      return null;
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({ startCamera, stopCamera, resetOverlay, takeSnapshot }),
    [startCamera, stopCamera, resetOverlay, takeSnapshot]
  );

  /** ===== Drawing loop ===== */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current as HTMLVideoElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    ctx.save();
    ctx.scale(1, 1);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- camera ---
    if (video && ready && video.videoWidth && video.videoHeight) {
      const vw = video.videoWidth * dpr;
      const vh = video.videoHeight * dpr;
      const cw = canvas.width;
      const ch = canvas.height;

      const vRatio = vw / vh;
      const cRatio = cw / ch;
      let dx = 0,
        dy = 0,
        dw = cw,
        dh = ch;
      if (vRatio > cRatio) {
        dh = ch;
        dw = dh * vRatio;
        dx = (cw - dw) / 2;
      } else {
        dw = cw;
        dh = dw / vRatio;
        dy = (ch - dh) / 2;
      }

      ctx.save();
      if (mirror) {
        ctx.translate(cw, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, dx, dy, dw, dh);
      ctx.restore();
    } else {
      // checkerboard when camera off
      const cw = canvas.width,
        ch = canvas.height;
      const s = 20;
      for (let y = 0; y < ch; y += s) {
        for (let x = 0; x < cw; x += s) {
          ctx.fillStyle =
            (Math.floor(x / s) + Math.floor(y / s)) % 2 === 0
              ? "#111827"
              : "#0b1220";
          ctx.fillRect(x, y, s, s);
        }
      }
    }

    // --- overlay ---
    const effectiveOpacity = opacity ?? 1;
    if (overlayImg && effectiveOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, effectiveOpacity));

      const cw = canvas.width;
      const ch = canvas.height;

      // base anchor
      let originX = cw / 2;
      let originY = ch / 2;
      if (selected?.anchor === "top-left") {
        originX = 0;
        originY = 0;
      } else if (selected?.anchor === "bottom-center") {
        originX = cw / 2;
        originY = ch;
      }

      // combine internal + external controls
      const offsetX = controlledOffset?.x ?? pos.x;
      const offsetY = controlledOffset?.y ?? pos.y;
      const depthFactor = 1 + (controlledDepth ?? 0);
      const baseScale = controlledScale ?? scale;
      const finalScale = baseScale * depthFactor;
      const finalRotation = controlledRotation ?? rotation;

      ctx.translate(originX + offsetX, originY + offsetY);
      ctx.rotate(finalRotation);
      ctx.scale(finalScale, finalScale);

      const imgW = overlayImg.width;
      const imgH = overlayImg.height;
      const drawX = selected?.anchor === "top-left" ? 0 : -imgW / 2;
      const drawY = selected?.anchor === "top-left" ? 0 : -imgH / 2;
      ctx.drawImage(overlayImg, drawX, drawY);

      ctx.restore();
    }

    ctx.restore();
    rafRef.current = requestAnimationFrame(draw);
  }, [
    overlayImg,
    opacity,
    mirror,
    ready,
    pos.x,
    pos.y,
    scale,
    rotation,
    selected?.anchor,
    controlledScale,
    controlledRotation,
    controlledOffset?.x,
    controlledOffset?.y,
    controlledDepth,
  ]);

  /** ===== effects: resize & loop ===== */
  useEffect(() => {
    resizeCanvas();
    const id = requestAnimationFrame(draw);
    rafRef.current = id;
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw, resizeCanvas]);

  useEffect(() => {
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  /** ===== gesture handling ===== */
  const gestureRef = useRef<{
    lastX: number;
    lastY: number;
    isPanning: boolean;
    touches: Map<number, { x: number; y: number }>;
    startDist: number;
    startAngle: number;
    startScale: number;
    startRotation: number;
  }>({
    lastX: 0,
    lastY: 0,
    isPanning: false,
    touches: new Map(),
    startDist: 0,
    startAngle: 0,
    startScale: 1,
    startRotation: 0,
  });

  const toCanvasSpace = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    return {
      x: (clientX - rect.left) * dpr,
      y: (clientY - rect.top) * dpr,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const g = gestureRef.current;
    g.isPanning = true;
    const { x, y } = toCanvasSpace(e.clientX, e.clientY);
    g.lastX = x;
    g.lastY = y;

    if (e.pointerType !== "mouse") {
      g.touches.set(e.pointerId, { x, y });
      if (g.touches.size === 2) {
        const pts = Array.from(g.touches.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        g.startDist = Math.hypot(dx, dy);
        g.startAngle = Math.atan2(dy, dx);
        g.startScale = scale;
        g.startRotation = rotation;
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    const { x, y } = toCanvasSpace(e.clientX, e.clientY);

    if (e.pointerType !== "mouse" && g.touches.has(e.pointerId)) {
      g.touches.set(e.pointerId, { x, y });
    }

    if (g.touches.size >= 2) {
      const pts = Array.from(g.touches.values());
      const dx = pts[1].x - pts[0].x;
      const dy = pts[1].y - pts[0].y;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const deltaScale = dist / (g.startDist || dist);
      setScale(Math.max(0.05, Math.min(10, g.startScale * deltaScale)));
      setRotation(g.startRotation + (angle - g.startAngle));
      return;
    }

    if (!g.isPanning) return;

    const dx = x - g.lastX;
    const dy = y - g.lastY;
    g.lastX = x;
    g.lastY = y;
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gestureRef.current;
    g.isPanning = false;
    if (g.touches.has(e.pointerId)) g.touches.delete(e.pointerId);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY;
    if (e.altKey || e.shiftKey) {
      setRotation((r) => r + (delta * Math.PI) / 1800);
    } else {
      const factor = delta > 0 ? 1.05 : 0.95;
      setScale((s) => Math.max(0.05, Math.min(10, s * factor)));
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black rounded-2xl"
      ref={containerRef}
    >
      <canvas
        ref={canvasRef}
        className="touch-none w-full h-full block"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      />
      <video ref={videoRef} className="hidden" playsInline muted />

      {!ready && !error && (
        <div className="absolute inset-0 grid place-items-center text-white/90 text-sm">
          <div className="backdrop-blur-sm bg-white/5 px-4 py-3 rounded-xl">
            Camera inactive — press Start.
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-x-4 bottom-4 text-red-200 bg-red-900/60 border border-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
});

export default TryOnCanvas;
