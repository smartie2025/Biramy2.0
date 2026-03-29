"use client";

import React, { useEffect } from "react";
import {
    useTryOnStore,
    Category,
    OverlayItem,
} from "@/app/store/tryon";

// Categories we support (same as in the store)
const CATEGORIES: Category[] = [
    "rings",
    "necklaces",
    "earrings",
    "bracelets",
    "sunglasses",
    "glasses",
    "hats",
    "scarves",
    "watches",
];

// Nice labels for the buttons
const CATEGORY_LABELS: Record<Category, string> = {
    rings: "Rings",
    necklaces: "Necklaces",
    earrings: "Earrings",
    bracelets: "Bracelets",
    sunglasses: "Sunglasses",
    glasses: "Glasses",
    hats: "Hats",
    scarves: "Scarves",
    watches: "Watches",
};

// Optional fallback overlays
const MOCK_OVERLAYS: Partial<Record<Category, OverlayItem[]>> = {
    glasses: [
        {
            id: "glasses-1",
            name: "Classic Glasses",
            src: "/overlays/glasses/glasses-1.png",
        },
    ],
    sunglasses: [
        {
            id: "sunglass-1",
            name: "Aviator Shades",
            src: "/overlays/sunglasses/aviator-1.png",
        },
    ],
    rings: [
        {
            id: "ring-1",
            name: "Diamond Ring",
            src: "/overlays/rings/ring-1.png",
        },
    ],
    necklaces: [
        {
            id: "necklace-1",
            name: "Pearl Necklace",
            src: "/overlays/necklaces/necklace-1.png",
        },
    ],
};

export default function OverlayPicker() {
    const category = useTryOnStore((s) => s.category);
    const setCategory = useTryOnStore((s) => s.setCategory);
    const overlays = useTryOnStore((s) => s.overlays);
    const addLayer = useTryOnStore((s) => s.addLayer);

    useEffect(() => {
        if (!category) {
            setCategory("glasses");
        }
    }, [category, setCategory]);

    if (!category) {
        return (
            <div className="text-xs text-slate-500">
                Initialising categories…
            </div>
        );
    }

    const catalogItems = overlays[category] ?? [];
    const items: OverlayItem[] =
        catalogItems.length > 0
            ? catalogItems
            : MOCK_OVERLAYS[category] ?? [];

    return (
        <div className="space-y-4">
            {/* Category Selector */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                    const isActive = c === category;
                    return (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setCategory(c)}
                            className={[
                                "rounded-full border px-3 py-1 text-[11px] transition",
                                isActive
                                    ? "border-blue-400 bg-blue-500/10 text-blue-100"
                                    : "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700",
                            ].join(" ")}
                        >
                            {CATEGORY_LABELS[c]}
                        </button>
                    );
                })}
            </div>

            {/* Current Category Title */}
            <h3 className="text-sm font-semibold text-slate-100">
                {CATEGORY_LABELS[category]}
            </h3>

            {/* Overlay Items */}
            {items.length === 0 ? (
                <div className="text-xs text-slate-500">
                    No overlays available yet for this category.
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => addLayer(item, category)}  // ✅ FIXED HERE
                            className="rounded-md border border-slate-600 bg-slate-800 p-2 text-[11px] text-slate-100 hover:border-blue-400 hover:bg-slate-700 transition"
                        >
                            <div className="line-clamp-2 text-left">{item.name}</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}