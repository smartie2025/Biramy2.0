"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ClosetRecord = {
    id?: string | number;
    item?: string | number;
    itemId?: string | number;
    nickName?: string;
    nickname?: string;
    name?: string;
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

function normaliseClosetList(value: unknown): ClosetRecord[] {
    if (Array.isArray(value)) {
        return value as ClosetRecord[];
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

    return [];
}

function formatDate(value?: string) {
    if (!value) return "Saved recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    }).format(date);
}

function getDisplayName(item: ClosetRecord) {
    return (
        item.nickName ??
        item.nickname ??
        item.name ??
        `Closet item ${item.item ?? item.itemId ?? item.id ?? ""}`.trim()
    );
}

function getItemNumber(item: ClosetRecord) {
    return item.item ?? item.itemId ?? item.id ?? "—";
}

export default function ClosetPage() {
    const [items, setItems] = useState<ClosetRecord[]>([]);
    const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    const closetCount = items.length;

    const sortedItems = useMemo(() => {
        return [...items].reverse();
    }, [items]);

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
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                            BIRAMY Galaxy
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                            My Closet
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-slate-300">
                            Saved try-on pieces appear here after they are added from the AR
                            experience.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            href="/try-on"
                            className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
                        >
                            Back to Try-On
                        </Link>

                        <button
                            type="button"
                            onClick={loadCloset}
                            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                <section className="mb-6 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Closet Items
                        </div>
                        <div className="mt-2 text-2xl font-bold">{closetCount}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Status
                        </div>
                        <div className="mt-2 text-sm font-semibold capitalize text-slate-100">
                            {status}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Golden Path
                        </div>
                        <div className="mt-2 text-sm font-semibold text-slate-100">
                            Save → View → Style
                        </div>
                    </div>
                </section>

                {status === "loading" && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-300">
                        Loading your Closet...
                    </div>
                )}

                {status === "error" && (
                    <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6">
                        <div className="font-semibold text-rose-100">
                            Closet could not be loaded.
                        </div>
                        <div className="mt-2 text-sm text-rose-200">{error}</div>
                    </div>
                )}

                {status === "ready" && sortedItems.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
                        <div className="text-lg font-semibold">Your Closet is empty for now.</div>
                        <p className="mt-2 text-sm text-slate-400">
                            Try on an item, save it to your Closet, then return here.
                        </p>
                        <Link
                            href="/try-on"
                            className="mt-5 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                        >
                            Go to Try-On
                        </Link>
                    </div>
                )}

                {status === "ready" && sortedItems.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedItems.map((item, index) => (
                            <article
                                key={`${item.id ?? item.item ?? item.itemId ?? index}-${index}`}
                                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/20"
                            >
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-base font-semibold text-white">
                                            {getDisplayName(item)}
                                        </h2>
                                        <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                                            Item #{getItemNumber(item)}
                                        </div>
                                    </div>

                                    <div className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200">
                                        Saved
                                    </div>
                                </div>

                                <div className="space-y-2 rounded-xl bg-slate-950/60 p-3 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Rating</span>
                                        <span className="font-semibold text-slate-100">
                                            {item.rating ?? "—"}
                                        </span>
                                    </div>

                                    <div className="flex justify-between gap-3">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-semibold text-slate-100">
                                            {formatDate(
                                                item.purchaseDate ??
                                                item.createdAt ??
                                                item.dateCreated
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
