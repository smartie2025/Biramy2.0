"use client";

import { useEffect, useState } from "react";
import type { Category } from "./CategoryTabs";
import { useTryOnStore } from "../store/tryon";

export type OverlayItem = {
    id: string;
    itemId?: number;
    name: string;
    src: string;
    thumb?: string;
    category?: string;
    shopUrl?: string;
    brand?: string;
    price?: string;
};

type RawOverlayItem = {
    id?: string | number;
    itemId?: string | number;
    name?: string;
    src?: string;
    url?: string;
    imageUrl?: string;
    image?: string;
    thumb?: string;
    thumbnail?: string;
    category?: string;
    categoryName?: string;
    shopUrl?: string;
    productUrl?: string;
    productPageUrl?: string;
    brand?: string;
    price?: string | number;
};

type Props = {
    category: Category;
    onSelectAction: (item: OverlayItem | null) => void;
};

export default function AssetDropdown({ category, onSelectAction }: Props) {
    const [items, setItems] = useState<OverlayItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const addLayer = useTryOnStore((s) => s.addLayer);
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

                if (!res.ok || !data.ok) {
                    throw new Error(data.error ?? "API returned ok=false");
                }

                const rawList = Array.isArray(data.overlays) ? data.overlays : [];

                const list: OverlayItem[] = (rawList as RawOverlayItem[])
                    .map((item) => {
                        const numericItemId =
                            typeof item.itemId === "number"
                                ? item.itemId
                                : typeof item.id === "number"
                                    ? item.id
                                    : typeof item.itemId === "string" && !Number.isNaN(Number(item.itemId))
                                        ? Number(item.itemId)
                                        : typeof item.id === "string" && !Number.isNaN(Number(item.id))
                                            ? Number(item.id)
                                            : undefined;

                        return {
                            id: String(item.id ?? item.name ?? crypto.randomUUID()),
                            itemId: numericItemId,
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
                            category: item.category ?? item.categoryName ?? category,
                            shopUrl: item.shopUrl ?? item.productUrl ?? item.productPageUrl,
                            brand: item.brand,
                            price:
                                typeof item.price === "number"
                                    ? `$${item.price.toFixed(2)}`
                                    : item.price,
                        };
                    })
                    .filter((item) => item.src);

                if (!cancelled) {
                    setItems(list);
                    onSelectAction(null);
                }
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Fetch failed";
                if (!cancelled) {
                    setItems([]);
                    setError(message);
                }
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
                addXP(10);
                incrementTryOnMission();
                console.log("Chosen item:", chosen);
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
