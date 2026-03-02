"use client";

import { useEffect, useState } from "react";
import type { Category } from "./CategoryTabs";

export type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

type Props = {
    category: Category;
    onSelect: (item: OverlayItem | null) => void;
};

export default function AssetDropdown({ category, onSelect }: Props) {
    const [items, setItems] = useState<OverlayItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setError(null);

                const res = await fetch(`/api/tryon-assets?category=${category}`, {
                    cache: "no-store",
                });
                const data = await res.json();

                if (!data.ok) throw new Error(data.error ?? "API returned ok=false");

                const list: OverlayItem[] = data.overlays?.[category] ?? [];
                if (!cancelled) setItems(list);

                // reset selection when category changes
                if (!cancelled) onSelect(null);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fetch failed";
                if (!cancelled) setError(message);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [category, onSelect]);

    if (error) return <div className="text-red-600">Dropdown error: {error}</div>;

    return (
        <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
                const id = e.target.value;
                const chosen = items.find((x) => x.id === id) ?? null;
                onSelect(chosen);
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