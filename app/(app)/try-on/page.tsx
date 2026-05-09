"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FaceTryOn from "../../components/FaceTryOn";
import AssetDropdown, { type OverlayItem } from "../../components/AssetDropdown";
import CategoryTabs, { type Category } from "../../components/CategoryTabs";
import type { PanelAlert } from "../../components/TryOnPanel";
import TryOnPanel from "../../components/TryOnPanel";
import { LOOK_OF_THE_DAY } from "../../lib/lookOfDay";
import { useTryOnStore } from "../../store/tryon";

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

function normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function getOverlayListFromResponse(
    data: unknown,
    category: Category
): OverlayItem[] {
    if (!data || typeof data !== "object") return [];

    const obj = data as {
        overlays?: unknown;
        assets?: unknown;
        data?: {
            overlays?: unknown;
            assets?: unknown;
        };
    };

    let rawList: RawOverlayItem[] = [];

    const candidates = [
        obj.overlays,
        obj.assets,
        obj.data?.overlays,
        obj.data?.assets,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            rawList = candidate as RawOverlayItem[];
            break;
        }

        if (
            candidate &&
            typeof candidate === "object" &&
            Array.isArray((candidate as Record<string, unknown>)[category])
        ) {
            rawList = (candidate as Record<string, RawOverlayItem[]>)[category];
            break;
        }
    }

    return rawList
        .map((item) => ({
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
        }))
        .filter((item) => item.src);
}

function TryOnPageInner() {
    const searchParams = useSearchParams();

    const [category, setCategory] = useState<Category>("glasses");
    const [selected, setSelected] = useState<OverlayItem | null>(null);
    const [alerts, setAlerts] = useState<PanelAlert[]>([]);

    const setStoreCategory = useTryOnStore((s) => s.setCategory);
    const setOverlays = useTryOnStore((s) => s.setOverlays);
    const addLayer = useTryOnStore((s) => s.addLayer);
    const clearAllLayers = useTryOnStore((s) => s.clearAllLayers);
    const incrementTryOnMission = useTryOnStore((s) => s.incrementTryOnMission);
    const claimLookReward = useTryOnStore((s) => s.claimLookReward);
    const addCollectible = useTryOnStore((s) => s.addCollectible);

    const appliedLookRef = useRef<string | null>(null);
    const clearAlertsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    useEffect(() => {
        const lookId = searchParams.get("look");

        if (!lookId || lookId !== LOOK_OF_THE_DAY.id) return;
        if (appliedLookRef.current === lookId) return;

        let cancelled = false;

        async function applyFeaturedLook() {
            try {
                const categoriesToLoad = Array.from(
                    new Set(LOOK_OF_THE_DAY.items.map((item) => item.category))
                ) as Category[];

                const loadedEntries = await Promise.all(
                    categoriesToLoad.map(async (cat) => {
                        const response = await fetch(
                            `/api/tryon-assets?category=${encodeURIComponent(cat)}`,
                            { cache: "no-store" }
                        );

                        if (!response.ok) {
                            throw new Error(`Failed to load overlays for ${cat}`);
                        }

                        const data = await response.json();
                        const items = getOverlayListFromResponse(data, cat);

                        return [cat, items] as const;
                    })
                );

                if (cancelled) return;

                const overlayMap = Object.fromEntries(loadedEntries) as Record<
                    Category,
                    OverlayItem[]
                >;

                categoriesToLoad.forEach((cat) => {
                    setOverlays(cat, overlayMap[cat] ?? []);
                });

                clearAllLayers();

                const firstCategory =
                    (LOOK_OF_THE_DAY.items[0]?.category as Category | undefined) ??
                    "glasses";

                setCategory(firstCategory);
                setStoreCategory(firstCategory);

                let firstMatchedOverlay: OverlayItem | null = null;

                for (const lookItem of LOOK_OF_THE_DAY.items) {
                    const desiredId = normalizeText(lookItem.assetId);

                    const match = (overlayMap[lookItem.category] ?? []).find((item) => {
                        const itemId = normalizeText(item.id);
                        const itemName = normalizeText(item.name ?? "");
                        const itemSrc = (item.src ?? "").toLowerCase();

                        return (
                            itemId === desiredId ||
                            itemName === desiredId ||
                            itemSrc.includes(lookItem.assetId.toLowerCase())
                        );
                    });

                    if (!match) {
                        console.warn("Look of the Day item not matched:", {
                            lookItem,
                            availableItems: overlayMap[lookItem.category] ?? [],
                        });
                        continue;
                    }

                    addLayer(match, lookItem.category);
                    incrementTryOnMission();

                    if (!firstMatchedOverlay) {
                        firstMatchedOverlay = match;
                    }
                }

                if (!firstMatchedOverlay || cancelled) return;

                setSelected(firstMatchedOverlay);

                claimLookReward(
                    LOOK_OF_THE_DAY.id,
                    LOOK_OF_THE_DAY.rewardXp,
                    LOOK_OF_THE_DAY.missionId
                );

                addCollectible(`Look of the Day: ${LOOK_OF_THE_DAY.title}`);

                setAlerts([
                    {
                        id: "look-xp",
                        tone: "xp",
                        title: `+${LOOK_OF_THE_DAY.rewardXp} XP`,
                        text: `${LOOK_OF_THE_DAY.title} activated`,
                    },
                    {
                        id: "look-mission",
                        tone: "success",
                        title: "Mission complete",
                        text: "Tried Look of the Day",
                    },
                ]);

                if (clearAlertsTimeoutRef.current) {
                    clearTimeout(clearAlertsTimeoutRef.current);
                }

                clearAlertsTimeoutRef.current = setTimeout(() => {
                    setAlerts([]);
                }, 4000);

                appliedLookRef.current = lookId;
            } catch (error) {
                console.error("Failed to apply Look of the Day:", error);
            }
        }

        applyFeaturedLook();

        return () => {
            cancelled = true;
        };
    }, [
        searchParams,
        addCollectible,
        addLayer,
        claimLookReward,
        clearAllLayers,
        incrementTryOnMission,
        setOverlays,
        setStoreCategory,
    ]);

    useEffect(() => {
        return () => {
            if (clearAlertsTimeoutRef.current) {
                clearTimeout(clearAlertsTimeoutRef.current);
            }
        };
    }, []);

    return (
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-amber-100">
                            BIRAMY Studio
                        </div>

                        <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                            Try-On Studio
                        </h1>

                        <p className="mt-2 font-serif text-lg italic text-amber-100/90">
                            Layer pieces. Build the look. Save your style.
                        </p>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            Select accessories, adjust each layer, and open your walk-in
                            Closet whenever you want to review saved styles.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/"
                            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:border-amber-100/50 hover:bg-white/10"
                        >
                            Home
                        </Link>

                        <Link
                            href="/closet"
                            className="rounded-2xl bg-amber-100 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-950/20 transition hover:bg-amber-50"
                        >
                            Open Closet
                        </Link>
                    </div>
                </header>

                {searchParams.get("look") && (
                    <section className="mb-6 rounded-[1.75rem] border border-amber-100/20 bg-amber-100/10 p-4 shadow-xl shadow-black/20">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                                    Editorial Look Activated
                                </div>
                                <p className="mt-1 text-sm text-slate-200">
                                    {LOOK_OF_THE_DAY.title} is ready to layer and style.
                                </p>
                            </div>

                            <div className="rounded-full border border-amber-100/30 bg-slate-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                                +{LOOK_OF_THE_DAY.rewardXp} XP
                            </div>
                        </div>
                    </section>
                )}

                <section className="mb-6 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                Choose Category
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Add glasses, earrings, necklaces, hats, and more to your look.
                            </p>
                        </div>
                    </div>

                    <CategoryTabs
                        value={category}
                        onChange={(nextCategory) => {
                            setCategory(nextCategory);
                            setStoreCategory(nextCategory);
                        }}
                    />

                    <div className="mt-5">
                        <AssetDropdown category={category} onSelectAction={setSelected} />
                    </div>
                </section>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
                    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/20">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-serif text-2xl font-semibold text-white">
                                    AR Mirror
                                </h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Start the camera, then refine your layered look.
                                </p>
                            </div>

                            <div className="rounded-full border border-amber-100/20 bg-slate-950/50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
                                Live Studio
                            </div>
                        </div>

                        <FaceTryOn selectedOverlay={selected} />

                        <button
                            type="button"
                            className="mt-6 w-full rounded-2xl border border-amber-100/30 bg-white/5 px-4 py-3 text-sm font-semibold text-amber-100 shadow-lg shadow-black/20 transition hover:border-amber-100/60 hover:bg-white/10"
                        >
                            ✨ Shop This Look
                        </button>
                    </section>

                    <TryOnPanel alerts={alerts} />
                </div>
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-slate-950 p-4 pb-24 text-white">
                    <h1 className="mb-4 text-2xl font-bold">Try On</h1>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                        Loading try-on experience…
                    </div>
                </main>
            }
        >
            <TryOnPageInner />
        </Suspense>
    );
}