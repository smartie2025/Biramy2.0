"use client";

import { useEffect, useState } from "react";
import type { Category } from "./CategoryTabs";
import { useTryOnStore } from "../store/tryon";

export type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

type Props = {
    category: Category;
    onSelectAction: (item: OverlayItem | null) => void;
};

export default function AssetDropdown({ category, onSelectAction }: Props) {
    const [items, setItems] = useState<OverlayItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addLayer = useTryOnStore((s) => s.addLayer);
    const setActiveLayer = useTryOnStore((s) => s.setActiveLayer);
    const addXP = useTryOnStore((s) => s.addXP);
    const incrementTryOnMission = useTryOnStore((s) => s.incrementTryOnMission);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setError(null);

                const res = await fetch(`/api/tryon-assets?category=${category}`, {
                    cache: "no-store",
                });

                const data = await res.json();

                if (!data.ok) {
                    throw new Error(data.error ?? "API returned ok=false");
                }

                const rawList = data.overlays?.[category] ?? [];
                type RawOverlayItem = {
                    id?: string | number;
                    name?: string;
                    src?: string;
                    url?: string;
                    imageUrl?: string;
                    image?: string;
                    thumb?: string;
                    thumbnail?: string;
                };

                const list: OverlayItem[] = (rawList as RawOverlayItem[]).map((item) => ({
                    id: String(item.id ?? item.name ?? crypto.randomUUID()),
                    name: item.name ?? "Unnamed Item",
                    src: item.src ?? item.url ?? item.imageUrl ?? item.image ?? "",
                    thumb:
                        item.thumb ??
                        item.thumbnail ??
                        item.src ??
                        item.url ??
                        item.imageUrl ??
                        item.image ??
                        "",
                }));

                if (!cancelled) {
                    setItems(list);
                    onSelectAction(null);
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fetch failed";
                if (!cancelled) setError(message);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [category, onSelectAction]);

    if (error) {
        return <div className="text-red-600">Dropdown error: {error}</div>;
    }

    return (
        <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
                const id = e.target.value;
                const chosen = items.find((x) => x.id === id) ?? null;

                onSelectAction(chosen);

                if (!chosen) return;

                addLayer(chosen, category);
                setActiveLayer(chosen.id);
                addXP(10);
                incrementTryOnMission();
            }}
        >
            <option value="">Select {category}</option>
            {items.map((a) => (
                <option key={a.id} value={a.id}>
                    {a.name}
                </option>
            ))}
        </select>
    );
}