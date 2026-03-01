"use client";

import { useEffect, useState } from "react";

type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

type Props = {
    onSelect: (item: OverlayItem | null) => void;
};

export default function AssetDropdown({ onSelect }: Props) {
    const [items, setItems] = useState<OverlayItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setError(null);
                const res = await fetch("/api/tryon-assets?category=glasses", {
                    cache: "no-store",
                });
                const data = await res.json();

                if (!data.ok) throw new Error(data.error ?? "API returned ok=false");

                const glasses: OverlayItem[] = data.overlays?.glasses ?? [];
                if (!cancelled) setItems(glasses);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fetch failed";
                if (!cancelled) setError(message);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (error)
        return <div className="text-red-600">Dropdown error: {error}</div>;

    return (
        <select
            className="border rounded p-2"
            defaultValue=""
            onChange={(e) => {
                const id = e.target.value;
                const chosen = items.find((x) => x.id === id) ?? null;
                onSelect(chosen);
            }}
        >
            <option value="">Select glasses</option>
            {items.map((a) => (
                <option key={a.id} value={a.id}>
                    {a.name}
                </option>
            ))}
        </select>
    );
}