"use client";

import React, { useMemo } from "react";
import { useTryOnStore, type Category } from "../store/tryon";
import { OVERLAYS } from "../lib/asset-manifest";

// Overlay inferred from manifest, with typed category
type TryOnOverlay = (typeof OVERLAYS)[number] & { category: Category };

export default function OverlayPicker() {
  const {
    category,
    setCategory,
    layers,
    activeLayerId,
    addLayer,
    setActiveLayer,
    updateLayer,
  } = useTryOnStore();

  // Unique categories from manifest
  const categories: Category[] = useMemo(
    () => Array.from(new Set(OVERLAYS.map((o) => o.category as Category))),
    []
  );

  const activeCategory: Category =
    category ?? categories[0] ?? "glasses";

  // Items for selected category
  const items: TryOnOverlay[] = useMemo(
    () =>
      OVERLAYS.filter(
        (o) => (o as TryOnOverlay).category === activeCategory
      ) as TryOnOverlay[],
    [activeCategory]
  );

  // pick overlay
  const pick = (o: TryOnOverlay) => {
    const existing = layers.find((l) => l.id === o.id);

    if (!existing) {
      addLayer(o.id);

      const anyOverlay = o as any;
      const defaultScale =
        anyOverlay.defaultScale !== undefined
          ? anyOverlay.defaultScale
          : 1;

      updateLayer(o.id, { scale: defaultScale });
    }

    setActiveLayer(o.id);
  };

  return (
    <div className="space-y-3">

      {/* Category buttons */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm transition ${
              cat === activeCategory
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Item cards */}
      <div className="grid grid-cols-1 gap-3">
        {items.map((o) => {
          const isActive = activeLayerId === o.id;

          return (
            <button
              key={o.id}
              onClick={() => pick(o)}
              className={`flex flex-col items-start rounded-2xl border p-3 text-left transition ${
                isActive
                  ? "border-blue-500 bg-slate-900"
                  : "border-slate-700 bg-slate-900/60 hover:border-slate-500"
              }`}
            >
              <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 mb-2 flex items-center justify-center">
                {o.thumb ? (
                  <img
                    src={o.thumb}
                    alt={o.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={o.src}
                    alt={o.name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <span className="text-sm font-medium text-slate-50">
                {o.name}
              </span>
              <span className="text-[11px] uppercase tracking-wide text-slate-400">
                {o.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
