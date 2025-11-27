"use client";

import React, { useRef } from "react";
import TryOnCanvas, {
  type TryOnCanvasHandle,
  type OverlayDef,
} from "../components/TryOnCanvas_v4";
import OverlayPicker from "../components/OverlayPicker";
import TryOnPanel from "../components/TryOnPanel";
import { useTryOnStore } from "../store/tryon";
import { OVERLAYS } from "../lib/asset-manifest";

export default function TryOnPage() {
  const canvasRef = useRef<TryOnCanvasHandle | null>(null);

  const { layers, activeLayerId, updateLayer } = useTryOnStore();

  // --- pick the active layer (prefer activeLayerId, otherwise last one) ---
  const activeLayer =
    (activeLayerId && layers.find((l) => l.id === activeLayerId)) ||
    layers[layers.length - 1] ||
    null;

  // --- map active layer -> canvas props ---
  let selectedOverlay: OverlayDef | null = null;
  let opacity: number | undefined;
  let scale: number | undefined;
  let rotation: number | undefined;
  let offsetX: number | undefined;
  let offsetY: number | undefined;
  let depth: number | undefined;

  if (activeLayer) {
    const manifestItem = OVERLAYS.find((o) => o.id === activeLayer.id);
    if (manifestItem) {
      selectedOverlay = {
        src: manifestItem.src,
        anchor: "center",
      };
    }
    opacity = activeLayer.opacity;
    scale = activeLayer.scale;
    rotation = activeLayer.rotation;
    offsetX = activeLayer.x;
    offsetY = activeLayer.y;
    depth = activeLayer.z;
  }

  // --- controls ---
  const handleStart = () => canvasRef.current?.startCamera();
  const handleStop = () => canvasRef.current?.stopCamera();

  const handleResetActive = () => {
    if (!activeLayer) return;

    // reset this layer in the store
    updateLayer(activeLayer.id, {
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      rotation: 0,
      opacity: 0.95,
    });

    // reset internal canvas transform
    canvasRef.current?.resetOverlay();
  };

  const handleCapture = () => {
    const dataUrl = canvasRef.current?.takeSnapshot();
    if (!dataUrl) return;
    const win = window.open();
    if (!win) return;
    win.document.write(
      `<img src="${dataUrl}" style="max-width:100%;height:auto;" />`
    );
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          BIRAMY Galaxy — Try-On
        </h1>

        <div className="flex gap-3">
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 shadow"
          >
            Start
          </button>
          <button
            onClick={handleStop}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 shadow"
          >
            Stop
          </button>
          <button
            onClick={handleResetActive}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-50 shadow disabled:opacity-40"
            disabled={!activeLayer}
          >
            Reset
          </button>
          <button
            onClick={handleCapture}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white shadow disabled:opacity-40"
            disabled={!activeLayer}
          >
            Capture
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        {/* LEFT: Camera + Canvas */}
        <div className="rounded-2xl overflow-hidden bg-black min-h-[60vh]">
          <TryOnCanvas
            ref={canvasRef}
            selected={selectedOverlay ?? undefined}
            mirror
            opacity={opacity}
            controlledScale={scale}
            controlledRotation={rotation}
            controlledOffset={
              offsetX !== undefined && offsetY !== undefined
                ? { x: offsetX, y: offsetY }
                : undefined
            }
            controlledDepth={depth}
          />
        </div>

        {/* RIGHT: Overlay picker + per-layer controls */}
        <div className="space-y-4">
          <OverlayPicker />
          <TryOnPanel />
        </div>
      </div>
    </main>
  );
}
