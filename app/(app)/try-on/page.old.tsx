"use client";

import React, { useRef, useState, useEffect } from "react";
import TryOnCanvas, { TryOnCanvasHandle } from "../../components/TryOnCanvas";

export default function TryOnPage() {
  // STEP 1: ref to child component API
  const tryonRef = useRef<TryOnCanvasHandle>(null);

  // STEP 2: preview state
  const [shot, setShot] = useState<string | null>(null);
  useEffect(() => setShot(null), []);

  // STEP 3: control handlers
  const handleStart = () => {
    setShot(null);
    tryonRef.current?.startCamera();
  };

  const handleStop = () => {
    tryonRef.current?.stopCamera();
    setShot(null);
  };

  // STEP 4: capture → preview
  const handleCapture = () => {
    const dataUrl = tryonRef.current?.capture();
    if (dataUrl) setShot(dataUrl);
  };

  const handleRetake = () => setShot(null);

  const handleDownload = () => {
    if (!shot) return;
    const a = document.createElement("a");
    a.href = shot;
    a.download = "biramy-tryon-capture.png";
    a.click();
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">BIRAMY Galaxy — Try-On</h1>
      </header>

      <div className="flex items-center gap-2 mb-4">
        <button onClick={handleStart} className="bg-white text-black px-3 py-1 rounded">
          Start Camera
        </button>
        <button onClick={handleStop} className="bg-white text-black px-3 py-1 rounded">
          Stop Camera
        </button>
        <button onClick={handleCapture} className="bg-white text-black px-3 py-1 rounded">
          Capture
        </button>
      </div>

      {/* Live canvas */}
      <TryOnCanvas ref={tryonRef} mirror />

      {/* Preview panel */}
      {shot && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 max-w-5xl">
          <div className="mb-2 text-sm opacity-80">Preview</div>
          <img src={shot} alt="Try-On capture preview" className="max-w-full rounded-lg" />
          <div className="mt-2 flex gap-2">
            <button onClick={handleRetake} className="rounded-md px-3 py-2 bg-zinc-200 text-black">
              Retake
            </button>
            <button onClick={handleDownload} className="rounded-md px-3 py-2 bg-white text-black shadow">
              Download
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
