"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ClosetRecord = {
    id?: string | number;
    closetItemId?: string | number;
    item?: string | number;
    itemId?: string | number;
    nickName?: string;
    nickname?: string;
    name?: string;
    category?: string;
    categoryID?: string | number;
    categoryName?: string;
    type?: string;
    itemType?: string;
    productType?: string;
    image?: string;
    imageUrl?: string;
    url?: string;
    src?: string;
    thumb?: string;
    thumbnail?: string;
    rating?: string | number;
    purchaseDate?: string;
    createdAt?: string;
    dateCreated?: string;
    [key: string]: unknown;
};

type ClosetApiResponse = {
    ok?: boolean;
    closet?: unknown;
    error?: string;
    details?: string;
};

const FILTERS = ["All", "Looks", "Glasses", "Earrings", "Necklaces", "Other"];

function normaliseClosetList(value: unknown): ClosetRecord[] {
    if (Array.isArray(value)) {
        return value as ClosetRecord[];
    }

    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as { closet?: unknown }).closet)
    ) {
        return (value as { closet: ClosetRecord[] }).closet;
    }

    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as { items?: unknown }).items)
    ) {
        return (value as { items: ClosetRecord[] }).items;
    }

    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as { value?: unknown }).value)
    ) {
        return (value as { value: ClosetRecord[] }).value;
    }

    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as { results?: unknown }).results)
    ) {
        return (value as { results: ClosetRecord[] }).results;
    }

    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as { data?: unknown }).data)
    ) {
        return (value as { data: ClosetRecord[] }).data;
    }

    return [];
}

function pickText(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }

        if (typeof value === "number" && Number.isFinite(value)) {
            return String(value);
        }
    }

    return null;
}

function formatDate(value?: string) {
    if (!value) return "Saved recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    // Backend default date guard, e.g. 0001-01-01T00:00:00
    if (date.getFullYear() < 1900) return "Saved recently";

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

function getDisplayName(item: ClosetRecord) {
    return (
        pickText(item.nickName, item.nickname, item.name) ??
        `Closet item ${getItemNumber(item)}`
    );
}

function getItemNumber(item: ClosetRecord) {
    return item.closetItemId ?? item.item ?? item.itemId ?? item.id ?? "—";
}

function getItemCategory(item: ClosetRecord) {
    return (
        pickText(
            item.categoryName,
            item.category,
            item.type,
            item.itemType,
            item.productType
        ) ?? "Saved Item"
    );
}

function getItemImage(item: ClosetRecord) {
    const image = pickText(
        item.image,
        item.imageUrl,
        item.url,
        item.src,
        item.thumb,
        item.thumbnail
    );

    if (image) {
        return image;
    }

    return "/images/look-of-day-editorial.jpg";
}

function getFilterCategory(category: string) {
    const lower = category.toLowerCase();

    if (lower.includes("look")) return "Looks";
    if (lower.includes("glass") || lower.includes("shade")) return "Glasses";
    if (lower.includes("earring")) return "Earrings";
    if (lower.includes("necklace") || lower.includes("pendant")) return "Necklaces";

    return "Other";
}

function getStyleType(category: string) {
    const filterCategory = getFilterCategory(category);

    if (filterCategory === "Looks") return "Editorial Look";
    if (filterCategory === "Other") return "Saved Piece";

    return filterCategory.slice(0, -1);
}

function getMoodLabel(item: ClosetRecord) {
    const rating = pickText(item.rating);

    if (rating) {
        return `Rating ${rating}`;
    }

    return `Item ${getItemNumber(item)}`;
}

export default function ClosetPage() {
    const [items, setItems] = useState<ClosetRecord[]>([]);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState("All");

    const closetCount = items.length;

    const sortedItems = useMemo(() => {
        return [...items].reverse();
    }, [items]);

    const filteredItems = useMemo(() => {
        if (activeFilter === "All") return sortedItems;

        return sortedItems.filter((item) => {
            const category = getItemCategory(item);
            return getFilterCategory(category) === activeFilter;
        });
    }, [activeFilter, sortedItems]);

    async function loadCloset() {
        try {
            setStatus("loading");
            setError(null);

            const response = await fetch("/api/closet", {
                method: "GET",
                cache: "no-store",
            });

            const data = (await response.json()) as ClosetApiResponse;

            if (!response.ok || data.ok === false) {
                throw new Error(data.error ?? "Closet request failed.");
            }

            setItems(normaliseClosetList(data.closet));
            setStatus("ready");
        } catch (err) {
            setItems([]);
            setStatus("error");
            setError(err instanceof Error ? err.message : "Unknown closet error.");
        }
    }

    useEffect(() => {
        loadCloset();
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
                            BIRAMY Galaxy
                        </div>

                        <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            My Closet
                        </h1>

                        <p className="mt-2 font-serif text-lg italic text-amber-100/90">
                            Your Closet. Your Style. Your Voice.
                        </p>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            Saved try-on pieces and styled looks appear here after they are
                            added from the AR experience.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/try-on"
                            className="rounded-2xl border border-amber-100/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:border-amber-100/60 hover:bg-white/10"
                        >
                            ← Back to Try-On
                        </Link>

                        <button
                            type="button"
                            onClick={loadCloset}
                            className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-pink-100"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <section className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                            Closet Items
                        </div>
                        <div className="mt-3 text-3xl font-bold text-white">{closetCount}</div>
                        <p className="mt-1 text-sm text-slate-400">Pieces saved</p>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                            Status
                        </div>
                        <div className="mt-3 text-xl font-bold capitalize text-white">
                            {status}
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            {status === "ready"
                                ? "All items saved and ready to style"
                                : "Closet sync in progress"}
                        </p>
                    </div>

                    <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                            Golden Path
                        </div>
                        <div className="mt-3 text-xl font-bold text-white">
                            Save → View → Style
                        </div>
                        <p className="mt-1 text-sm text-slate-400">
                            Your saved pieces, styled by you.
                        </p>
                    </div>
                </section>

                {status === "loading" && (
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-sm text-slate-300 shadow-xl shadow-black/20">
                        Loading your Closet...
                    </div>
                )}

                {status === "error" && (
                    <div className="rounded-[2rem] border border-rose-500/40 bg-rose-500/10 p-8 shadow-xl shadow-black/20">
                        <div className="font-semibold text-rose-100">
                            Closet could not be loaded.
                        </div>
                        <div className="mt-2 text-sm text-rose-200">{error}</div>
                    </div>
                )}

                {status === "ready" && sortedItems.length === 0 && (
                    <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.04] p-10 text-center shadow-xl shadow-black/20">
                        <div className="font-serif text-2xl font-semibold text-white">
                            Your Closet is empty for now.
                        </div>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                            Try on an item, save it to your Closet, then return here to build
                            your personal BIRAMY style archive.
                        </p>

                        <Link
                            href="/try-on"
                            className="mt-6 inline-flex rounded-2xl bg-amber-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-100"
                        >
                            Go to Try-On
                        </Link>
                    </div>
                )}

                {status === "ready" && sortedItems.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-wrap gap-3">
                                {FILTERS.map((filter) => {
                                    const isActive = activeFilter === filter;

                                    return (
                                        <button
                                            key={filter}
                                            type="button"
                                            onClick={() => setActiveFilter(filter)}
                                            className={[
                                                "rounded-2xl border px-5 py-3 text-sm font-semibold transition",
                                                isActive
                                                    ? "border-amber-100 bg-amber-100 text-slate-950 shadow-lg shadow-amber-950/20"
                                                    : "border-white/10 bg-white/5 text-white/80 hover:border-amber-200/50 hover:bg-white/10",
                                            ].join(" ")}
                                        >
                                            {filter}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
                                Showing{" "}
                                <span className="font-semibold text-white">
                                    {filteredItems.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-white">
                                    {sortedItems.length}
                                </span>{" "}
                                saved pieces
                            </div>
                        </div>

                        {filteredItems.length === 0 && (
                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-xl shadow-black/20">
                                <div className="font-serif text-2xl font-semibold text-white">
                                    No saved pieces in this category yet.
                                </div>
                                <p className="mt-2 text-sm text-slate-400">
                                    Try another filter or save more pieces from the Try-On studio.
                                </p>
                            </div>
                        )}

                        {filteredItems.length > 0 && (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredItems.map((item, index) => {
                                    const name = getDisplayName(item);
                                    const category = getItemCategory(item);
                                    const image = getItemImage(item);
                                    const savedDate = formatDate(
                                        item.purchaseDate ?? item.createdAt ?? item.dateCreated
                                    );
                                    const styleType = getStyleType(category);
                                    const moodLabel = getMoodLabel(item);

                                    return (
                                        <article
                                            key={`${item.id ?? item.closetItemId ?? item.item ?? item.itemId ?? index}-${index}`}
                                            className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-amber-200/40"
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
                                                <img
                                                    src={image}
                                                    alt={name}
                                                    className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
                                                />

                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent" />

                                                <div className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                                                    {category}
                                                </div>

                                                <div className="absolute right-4 top-4 rounded-full bg-amber-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950">
                                                    Saved
                                                </div>
                                            </div>

                                            <div className="space-y-4 p-5">
                                                <div>
                                                    <p className="text-xs uppercase tracking-[0.22em] text-amber-100/70">
                                                        {category}
                                                    </p>

                                                    <h2 className="mt-1 font-serif text-2xl font-semibold text-white">
                                                        {name}
                                                    </h2>

                                                    <p className="mt-2 text-sm text-white/60">
                                                        Saved on {savedDate}
                                                    </p>
                                                </div>

                                                <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-sm">
                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-white/45">Style Type</span>
                                                        <span className="font-semibold text-white">
                                                            {styleType}
                                                        </span>
                                                    </div>

                                                    <div className="flex justify-between gap-3">
                                                        <span className="text-white/45">Closet Ref</span>
                                                        <span className="font-semibold text-amber-100">
                                                            {moodLabel}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Link
                                                        href="/try-on"
                                                        className="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-amber-200/50 hover:bg-white/10"
                                                    >
                                                        Style Again
                                                    </Link>

                                                    <Link
                                                        href="/closet/look"
                                                        className="rounded-2xl bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-amber-50"
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    );
}