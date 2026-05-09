"use client";

import Link from "next/link";
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

type ShopMeta = {
    id?: string;
    itemId?: number;
    name?: string;
    brand?: string;
    price?: string;
    shopUrl?: string;
};

type PanelNotice = {
    tone: "success" | "error" | "xp";
    text: string;
    actionHref?: string;
    actionLabel?: string;
};

function getClosetItemId(asset?: ShopMeta) {
    if (!asset) return null;

    if (typeof asset.itemId === "number" && Number.isFinite(asset.itemId)) {
        return asset.itemId;
    }

    if (typeof asset.id === "string" && asset.id.trim()) {
        const parsed = Number(asset.id);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function getPieceLabel(count: number) {
    return count === 1 ? "1 piece" : `${count} pieces`;
}

export default function TryOnPanel({ alerts = [] }: TryOnPanelProps) {
    const {
        layers,
        activeLayerId,
        setActiveLayer,
        removeLayer,
        updateLayer,
        addXP,
    } = useTryOnStore();

    const [panelNotice, setPanelNotice] = React.useState<PanelNotice | null>(null);
    const [isSavingSelectedItem, setIsSavingSelectedItem] = React.useState(false);
    const [isSavingCurrentLook, setIsSavingCurrentLook] = React.useState(false);

    React.useEffect(() => {
        setPanelNotice(null);
        setIsSavingSelectedItem(false);
        setIsSavingCurrentLook(false);
    }, [activeLayerId]);

    const activeLayer =
        (activeLayerId && layers.find((l) => l.id === activeLayerId)) ||
        layers[layers.length - 1] ||
        null;

    const activeAsset = activeLayer?.asset as ShopMeta | undefined;
    const closetItemId = getClosetItemId(activeAsset);

    const layerInfos = layers.map((layer) => {
        return {
            layer,
            name: layer.asset.name ?? layer.asset.id,
            category: layer.category,
        };
    });

    const firstSaveableLayer = layers.find((layer) => {
        const asset = layer.asset as ShopMeta | undefined;
        return getClosetItemId(asset) !== null;
    });

    const firstSaveableAsset = firstSaveableLayer?.asset as ShopMeta | undefined;
    const firstSaveableClosetItemId = getClosetItemId(firstSaveableAsset);

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

    const handleShopClick = () => {
        addXP(10);
        setPanelNotice({
            tone: "xp",
            text: "✨ Shopping portal opened! +10 XP",
        });
    };

    const handleSaveSelectedItem = async () => {
        if (!activeLayer) return;

        if (!closetItemId) {
            setPanelNotice({
                tone: "error",
                text: "This item needs a numeric closet item ID before it can be saved.",
            });
            return;
        }

        setIsSavingSelectedItem(true);
        setPanelNotice({
            tone: "success",
            text: "Saving selected item to Closet...",
        });

        try {
            const response = await fetch("/api/closet", {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item: closetItemId,
                    nickName: activeAsset?.name ?? activeLayer.asset.id ?? "Saved item",
                    rating: "5",
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.ok === false) {
                throw new Error(
                    data?.error ??
                    `Closet save failed: ${response.status} ${response.statusText}`
                );
            }

            addXP(15);
            setPanelNotice({
                tone: "success",
                text: "♡ Selected item saved to Closet! +15 XP",
                actionHref: "/closet",
                actionLabel: "View Closet",
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Closet save failed.";

            setPanelNotice({
                tone: "error",
                text: `Closet save failed: ${message}`,
            });
        } finally {
            setIsSavingSelectedItem(false);
        }
    };

    const handleSaveCurrentLook = async () => {
        if (layers.length === 0) {
            setPanelNotice({
                tone: "error",
                text: "Add at least one layer before saving a look.",
            });
            return;
        }

        if (!firstSaveableLayer || !firstSaveableClosetItemId) {
            setPanelNotice({
                tone: "error",
                text: "This look needs at least one layer with a numeric closet item ID before it can be saved.",
            });
            return;
        }

        const pieceLabel = getPieceLabel(layers.length);
        const lookName =
            layers.length > 1
                ? `Custom BIRAMY Look · ${pieceLabel}`
                : `${firstSaveableAsset?.name ?? "Saved Look"} · ${pieceLabel}`;

        setIsSavingCurrentLook(true);
        setPanelNotice({
            tone: "success",
            text: "Saving current look to Closet...",
        });

        try {
            const response = await fetch("/api/closet", {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    item: firstSaveableClosetItemId,
                    nickName: lookName,
                    rating: "5",
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok || data?.ok === false) {
                throw new Error(
                    data?.error ??
                    `Look save failed: ${response.status} ${response.statusText}`
                );
            }

            addXP(25);
            setPanelNotice({
                tone: "success",
                text: `✦ Current look saved to Closet! ${pieceLabel} · +25 XP`,
                actionHref: "/closet",
                actionLabel: "View Closet",
            });
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Look save failed.";

            setPanelNotice({
                tone: "error",
                text: `Look save failed: ${message}`,
            });
        } finally {
            setIsSavingCurrentLook(false);
        }
    };

    const rotationDeg = activeLayer ? activeLayer.rotation : 0;
    const hasShoppingInfo =
        Boolean(activeAsset?.brand) ||
        Boolean(activeAsset?.price) ||
        Boolean(activeAsset?.shopUrl);

    const isSaving = isSavingSelectedItem || isSavingCurrentLook;

    const noticeClasses =
        panelNotice?.tone === "error"
            ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
            : panelNotice?.tone === "xp"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                : "border-amber-100/30 bg-amber-100/10 text-amber-100";

    const noticeActionClasses =
        panelNotice?.tone === "error"
            ? "border-rose-300/40 bg-rose-300/10 text-rose-100 hover:bg-rose-300/20"
            : panelNotice?.tone === "xp"
                ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
                : "border-amber-100/40 bg-amber-100/10 text-amber-100 hover:bg-amber-100/20";

    return (
        <aside className="space-y-6 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-black/20">
            <section className="rounded-2xl border border-amber-100/20 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100/80">
                            Walk-In Closet
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                            View saved items and looks anytime.
                        </p>
                    </div>

                    <Link
                        href="/closet"
                        className="shrink-0 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-950/20 hover:bg-amber-50"
                    >
                        Open Closet
                    </Link>
                </div>
            </section>
            {alerts.length > 0 && (
                <section className="space-y-2">
                    {alerts.map((alert) => {
                        const toneClasses =
                            alert.tone === "xp"
                                ? "border-emerald-400/30 bg-emerald-500/10"
                                : "border-amber-100/30 bg-amber-100/10";

                        const badgeClasses =
                            alert.tone === "xp"
                                ? "bg-emerald-400/20 text-emerald-200"
                                : "bg-amber-100/20 text-amber-100";

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
                                    ? "border-amber-100/60 bg-amber-100/10"
                                    : "border-slate-700 bg-slate-900/60 hover:border-amber-100/40"
                                    }`}
                                onClick={() => setActiveLayer(layer.id)}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="truncate text-sm text-slate-50">{name}</span>
                                    {isActive && (
                                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-100">
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
                    Selected Item
                </h2>

                {!activeLayer ? (
                    <div className="rounded-lg border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-500">
                        Select an item to view shopping details.
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/50 p-3">
                        <div className="flex items-start gap-3">
                            {activeLayer.asset.thumb && (
                                <img
                                    src={activeLayer.asset.thumb}
                                    alt={activeAsset?.name ?? "Selected item"}
                                    className="h-14 w-14 rounded-xl border border-slate-700 bg-slate-900 object-contain"
                                />
                            )}

                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-semibold text-white">
                                    {activeAsset?.name ?? activeLayer.asset.id}
                                </div>

                                {activeLayer.category && (
                                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                        {activeLayer.category}
                                    </div>
                                )}

                                {hasShoppingInfo ? (
                                    <div className="mt-2 space-y-1 text-xs text-slate-300">
                                        {activeAsset?.brand && (
                                            <div>
                                                <span className="text-slate-500">Brand: </span>
                                                {activeAsset.brand}
                                            </div>
                                        )}

                                        {activeAsset?.price && (
                                            <div>
                                                <span className="text-slate-500">Price: </span>
                                                {activeAsset.price}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-2 text-xs text-slate-500">
                                        Shopping details are not available yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {panelNotice && (
                            <div
                                className={`mt-3 rounded-xl border px-3 py-2 text-xs font-semibold ${noticeClasses}`}
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{panelNotice.text}</span>

                                    {panelNotice.actionHref && panelNotice.actionLabel && (
                                        <Link
                                            href={panelNotice.actionHref}
                                            className={`inline-flex justify-center rounded-lg border px-3 py-1.5 text-[11px] font-semibold ${noticeActionClasses}`}
                                        >
                                            {panelNotice.actionLabel}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-1 gap-2">
                            {activeAsset?.shopUrl ? (
                                <a
                                    href={activeAsset.shopUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleShopClick}
                                    className="block w-full rounded-xl bg-emerald-500 px-3 py-2 text-center text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                                >
                                    Shop this item · +10 XP
                                </a>
                            ) : (
                                <button
                                    type="button"
                                    disabled
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-500 disabled:cursor-not-allowed"
                                >
                                    Shop link coming soon
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={handleSaveSelectedItem}
                                disabled={isSaving}
                                className="w-full rounded-xl border border-amber-100/40 bg-amber-100/10 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-100/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSavingSelectedItem
                                    ? "Saving selected item..."
                                    : "♡ Save Selected Item · +15 XP"}
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveCurrentLook}
                                disabled={isSaving || layers.length === 0}
                                className="w-full rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-950/20 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSavingCurrentLook
                                    ? "Saving current look..."
                                    : `✦ Save Current Look · ${getPieceLabel(layers.length)} · +25 XP`}
                            </button>

                            <Link
                                href="/closet"
                                className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-white hover:border-amber-100/50 hover:bg-white/10"
                            >
                                Open Closet
                            </Link>
                        </div>
                    </div>
                )}
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
                            className="mt-2 w-full rounded-xl bg-slate-800 py-2 text-xs text-white hover:bg-slate-700"
                        >
                            Reset layer
                        </button>
                    </div>
                )}
            </section>
        </aside>
    );
}