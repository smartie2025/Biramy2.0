"use client";

import React, { useRef } from "react";
import TryOnCanvas, {
  TryOnCanvasHandle,
  OverlayDef,
} from "../../components/TryOnCanvas_v4";
import OverlayPicker from "../../components/OverlayPicker";
import TryOnPanel from "../../components/TryOnPanel";
import { useTryOnStore } from "../../store/tryon";

export default function TryOnPage() {
  const canvasRef = useRef<TryOnCanvasHandle | null>(null);

  const {
    category,
    overlays,
    selectedOverlayId,
    opacity,
    scale,
    rotation,
    offsetX,
    offsetY,
    depth,
    resetTransform,
  } = useTryOnStore();

  // Build the OverlayDef that the canvas expects from the store selection
  let selectedOverlay: OverlayDef | null = null;
  if (category && selectedOverlayId) {
    const items = overlays[category] ?? [];
    const found = items.find((item) => item.id === selectedOverlayId);
    if (found) {
      selectedOverlay = {
        src: found.src,
        anchor: "center", // later we can vary this by category if we want
      };
    }
  }

  const handleResetAll = () => {
    canvasRef.current?.resetOverlay();
    resetTransform();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 px-4 py-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          BIRAMY Galaxy — Try-On
        </h1>

        <div className="flex gap-3">
          <button
            onClick={() => canvasRef.current?.startCamera()}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 shadow"
          >
            Start
          </button>
          <button
            onClick={() => canvasRef.current?.stopCamera()}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 shadow"
          >
            Stop
          </button>
          <button
            onClick={handleResetAll}
            className="px-4 py-2 rounded-lg bg-white text-slate-900 shadow"
          >
            Reset
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6">
        {/* LEFT: Camera + Canvas */}
        <div className="rounded-2xl overflow-hidden bg-black min-h-[60vh]">
          <TryOnCanvas
            ref={canvasRef}
            selected={selectedOverlay}
            mirror
            opacity={opacity}
            controlledScale={scale}
            controlledRotation={rotation}
            controlledOffset={{ x: offsetX, y: offsetY }}
            controlledDepth={depth}
          />
        </div>

        {/* RIGHT: Overlay picker + controls */}
        <div className="space-y-4">
          <OverlayPicker />
          <TryOnPanel />
        </div>
      </div>
    </main>
  );
}
