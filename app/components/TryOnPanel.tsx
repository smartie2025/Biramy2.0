"use client";

import React from "react";
import { useTryOnStore } from "../store/tryon";

export type PanelAlert = {
    id: string;
    tone: "xp" | "success";
    title: string;
    text: string;
};

type TryOnPanelProps = {
    alerts?: PanelAlert[];
};

export default function TryOnPanel({ alerts = [] }: TryOnPanelProps) {
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

    const layerInfos = layers.map((layer) => {
        return {
            layer,
            name: layer.asset.name ?? layer.asset.id,
            category: layer.category,
        };
    });

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
        updateLayer(activeLayer.id, { rotation: deg });
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

    const rotationDeg = activeLayer ? activeLayer.rotation : 0;

    return (
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-6">
            {alerts.length > 0 && (
                <section className="space-y-2">
                    {alerts.map((alert) => {
                        const toneClasses =
                            alert.tone === "xp"
                                ? "border-emerald-400/30 bg-emerald-500/10"
                                : "border-sky-400/30 bg-sky-500/10";

                        const badgeClasses =
                            alert.tone === "xp"
                                ? "bg-emerald-400/20 text-emerald-200"
                                : "bg-sky-400/20 text-sky-200";

                        return (
                            <div
                                key={alert.id}
                                className={`rounded-2xl border px-3 py-3 shadow-sm backdrop-blur ${toneClasses}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-white">
                                            {alert.title}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-300">
                                            {alert.text}
                                        </div>
                                    </div>

                                    <div
                                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badgeClasses}`}
                                    >
                                        {alert.tone === "xp" ? "Reward" : "Mission"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>
            )}

            <section>
                <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Layers
                    </h2>
                    <span className="text-xs text-slate-400">{layers.length} active</span>
                </div>

                <div className="space-y-2">
                    {layerInfos.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-500">
                            No layers yet. Tap an item above to add it.
                        </div>
                    )}

                    {layerInfos.map(({ layer, name, category }) => {
                        const isActive = activeLayer?.id === layer.id;

                        return (
                            <button
                                key={layer.id}
                                type="button"
                                className={`w-full rounded-xl border px-3 py-2 text-left transition ${isActive
                                        ? "border-sky-500 bg-sky-500/10"
                                        : "border-slate-700 bg-slate-900/60 hover:border-slate-500"
                                    }`}
                                onClick={() => setActiveLayer(layer.id)}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="truncate text-sm text-slate-50">{name}</span>
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
                        className="w-full rounded-xl border border-rose-600/70 bg-rose-900/40 py-2 text-xs text-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Remove layer
                    </button>
                </div>
            </section>

            <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Adjustments
                </h2>

                {!activeLayer ? (
                    <div className="rounded-lg border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-500">
                        Select a layer above to adjust its position, scale, rotation and
                        opacity.
                    </div>
                ) : (
                    <div className="space-y-3 text-xs">
                        <div>
                            <div className="mb-1 flex justify-between">
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

                        <div>
                            <div className="mb-1 flex justify-between">
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

                        <div>
                            <div className="mb-1 flex justify-between">
                                <span className="text-slate-300">Depth (Z)</span>
                                <span className="text-slate-400">{activeLayer.z.toFixed(2)}</span>
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

                        <div>
                            <div className="mb-1 flex justify-between">
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

                        <div>
                            <div className="mb-1 flex justify-between">
                                <span className="text-slate-300">Rotation (°)</span>
                                <span className="text-slate-400">{rotationDeg.toFixed(0)}°</span>
                            </div>
                            <input
                                type="range"
                                min={-180}
                                max={180}
                                step={1}
                                value={rotationDeg}
                                onChange={(e) => handleChangeRotationDeg(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <div className="mb-1 flex justify-between">
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
                            className="mt-2 w-full rounded-xl bg-sky-600 py-2 text-xs text-white"
                        >
                            Reset layer
                        </button>
                    </div>
                )}
            </section>
        </aside>
    );
}