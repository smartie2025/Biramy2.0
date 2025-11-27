"use client";

import React from "react";
import { useTryOnStore } from "../store/tryon";
import { OVERLAYS } from "../lib/asset-manifest";

export default function TryOnPanel() {
  const {
    layers,
    activeLayerId,
    setActiveLayer,
    removeLayer,
    updateLayer,
  } = useTryOnStore();

  const activeLayer =
    (activeLayerId && layers.find((l) => l.id === activeLayerId)) ||
    layers[layers.length - 1] ||
    null;

  // Build a little info bundle for the list UI
  const layerInfos = layers.map((layer) => {
    const info = OVERLAYS.find((o) => o.id === layer.id);
    return {
      layer,
      name: info?.name ?? layer.id,
      category: info?.category ?? "",
    };
  });

  // Slider handlers – no-ops if there is no active layer
  const handleChangeX = (v: number) => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, { x: v });
  };

  const handleChangeY = (v: number) => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, { y: v });
  };

  const handleChangeZ = (v: number) => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, { z: v });
  };

  const handleChangeScale = (v: number) => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, { scale: v });
  };

  const handleChangeRotationDeg = (deg: number) => {
    if (!activeLayer) return;
    const rad = (deg * Math.PI) / 180;
    updateLayer(activeLayer.id, { rotation: rad });
  };

  const handleChangeOpacity = (v: number) => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, { opacity: v });
  };

  const handleResetLayer = () => {
    if (!activeLayer) return;
    updateLayer(activeLayer.id, {
      x: 0,
      y: 0,
      z: 0,
      scale: 1,
      rotation: 0,
      opacity: 0.95,
    });
  };

  const handleRemoveActive = () => {
    if (!activeLayer) return;
    removeLayer(activeLayer.id);
  };

  const rotationDeg = activeLayer ? (activeLayer.rotation * 180) / Math.PI : 0;

  return (
    <aside className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 space-y-6">
      {/* LAYERS LIST */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            Layers
          </h2>
          <span className="text-xs text-slate-400">
            {layers.length} active
          </span>
        </div>

        <div className="space-y-2">
          {layerInfos.length === 0 && (
            <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg px-3 py-2">
              No layers yet. Tap an item above to add it.
            </div>
          )}

          {layerInfos.map(({ layer, name, category }) => {
            const isActive = activeLayer?.id === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                className={`w-full flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${
                  isActive
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/60"
                }`}
                onClick={() => setActiveLayer(layer.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm text-slate-50 truncate">{name}</span>
                  {isActive && (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">
                      Active
                    </span>
                  )}
                </div>
                {category && (
                  <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    {category}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={handleRemoveActive}
            disabled={!activeLayer}
            className="w-full text-xs rounded-xl border border-rose-600/70 bg-rose-900/40 text-rose-100 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Remove layer
          </button>
        </div>
      </section>

      {/* ADJUSTMENTS */}
      <section>
        <h2 className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-3">
          Adjustments
        </h2>

        {!activeLayer ? (
          <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded-lg px-3 py-3">
            Select a layer above to adjust its position, scale, rotation and
            opacity.
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {/* Position X */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Position X</span>
                <span className="text-slate-400">{activeLayer.x.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={-250}
                max={250}
                step={1}
                value={activeLayer.x}
                onChange={(e) => handleChangeX(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Position Y */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Position Y</span>
                <span className="text-slate-400">{activeLayer.y.toFixed(0)}</span>
              </div>
              <input
                type="range"
                min={-250}
                max={250}
                step={1}
                value={activeLayer.y}
                onChange={(e) => handleChangeY(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Depth Z */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Depth (Z)</span>
                <span className="text-slate-400">
                  {activeLayer.z.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.01}
                value={activeLayer.z}
                onChange={(e) => handleChangeZ(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Scale */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Scale</span>
                <span className="text-slate-400">
                  {activeLayer.scale.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.01}
                value={activeLayer.scale}
                onChange={(e) => handleChangeScale(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Rotation (°)</span>
                <span className="text-slate-400">
                  {rotationDeg.toFixed(0)}°
                </span>
              </div>
              <input
                type="range"
                min={-180}
                max={180}
                step={1}
                value={rotationDeg}
                onChange={(e) =>
                  handleChangeRotationDeg(Number(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Opacity</span>
                <span className="text-slate-400">
                  {(activeLayer.opacity * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={activeLayer.opacity}
                onChange={(e) => handleChangeOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <button
              type="button"
              onClick={handleResetLayer}
              className="w-full mt-2 text-xs rounded-xl bg-sky-600 text-white py-2"
            >
              Reset layer
            </button>
          </div>
        )}
      </section>
    </aside>
  );
}
