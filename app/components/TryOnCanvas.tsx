"use client";

import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import { useTryOnStore } from "../store/tryon";
import { OVERLAYS } from "../lib/asset-manifest";

export type TryOnCanvasHandle = {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  resetOverlay: () => void;
};

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: false,
};

const TryOnCanvas = forwardRef<TryOnCanvasHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // --- Global try-on state ---
  const selectedIds = useTryOnStore((s) => s.selectedIds);
  const scale = useTryOnStore((s) => s.scale);
  const rotation = useTryOnStore((s) => s.rotation); // radians
  const opacity = useTryOnStore((s) => s.opacity);
  const clearGraphics = useTryOnStore((s) => s.clearGraphics);
  const resetTransform = useTryOnStore((s) => s.resetTransform);

  const selectedOverlays = useMemo(
    () => OVERLAYS.filter((o) => selectedIds.includes(o.id)),
    [selectedIds]
  );

  useImperativeHandle(ref, () => ({
    async startCamera() {
      const stream = await navigator.mediaDevices.getUserMedia(
        VIDEO_CONSTRAINTS
      );
      if (videoRef.current) videoRef.current.srcObject = stream;
    },

    stopCamera() {
      const tracks = (videoRef.current?.srcObject as MediaStream)?.getTracks();
      tracks?.forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    },

    resetOverlay() {
      console.log("Overlay reset.");
      clearGraphics();
      resetTransform();
    },
  }));

  useEffect(
    () => () => {
      // Clean up when component unmounts
      const tracks = (videoRef.current?.srcObject as MediaStream | null)
        ?.getTracks();
      tracks?.forEach((t) => t.stop());
    },
    []
  );

  return (
    <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-black">
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Overlays */}
      {selectedOverlays.map((overlay) => (
        <img
          key={overlay.id}
          src={overlay.src}
          alt={overlay.name}
          className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 object-contain"
          style={{
            opacity,
            transform: `
              translate(-50%, -50%)
              scale(${scale})
              rotate(${(rotation * 180) / Math.PI}deg)
            `,
            transformOrigin: "center center",
          }}
        />
      ))}
    </div>
  );
});

TryOnCanvas.displayName = "TryOnCanvas";
export default TryOnCanvas;
