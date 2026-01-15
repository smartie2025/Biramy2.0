 "use client";
export default function Studio() {
  return (
    <main className="p-8 text-center text-xl">
      Studio route deprecated — please use the Try-On page.
    </main>
  );

} 
/* "use client";
// app/studio/page.tsx
import { useRef } from "react";
import TryOnCanvas, { TryOnCanvasHandle } from "../components/TryOnCanvas";
import { useTryOnStore } from "../store/tryon";


export default function Studio() {
  const canvasRef = useRef<TryOnCanvasHandle>(null);
  const clearGraphics = useTryOnStore((s) => s.clearGraphics);

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 p-10 text-center space-y-6">
      <h1 className="text-4xl font-bold text-slate-900">BIRAMY Studio</h1>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => canvasRef.current?.startCamera()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Start Camera
        </button>
        <button
          onClick={() => canvasRef.current?.stopCamera()}
          className="rounded-lg border border-slate-900 px-4 py-2 text-slate-900 hover:bg-white"
        >
          Stop Camera
        </button>
        <button
          onClick={() => canvasRef.current?.resetOverlay()}
          className="rounded-lg border border-rose-400 px-4 py-2 text-rose-500 hover:bg-rose-50"
        >
          Reset Overlay
        </button>

         <button
          onClick={() => {canvasRef.current?.resetOverlay();
          clearGraphics();
        }}
        className="rounded-lg border border-rose-400 px-4 py-2 text-rose-500 hover:bg-rose-50"
      >
        Reset Overlay
      </button>
      </div>

      <TryOnCanvas ref={canvasRef} />
    </main>
  );
}
/* export default function Studio() {
  return <main className="p-8 text-center text-xl">Studio boot sequence…</main>;
} */
