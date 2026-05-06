"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
        <main className="p-4 pb-24">
            <h1 className="mb-4 text-2xl font-bold">Try On</h1>

            <div className="mb-2 text-xs text-slate-500">
                look param: {searchParams.get("look") ?? "none"}
            </div>

            <div className="mb-4">
                <CategoryTabs
                    value={category}
                    onChange={(nextCategory) => {
                        setCategory(nextCategory);
                        setStoreCategory(nextCategory);
                    }}
                />
            </div>

            <div className="mb-4">
                <AssetDropdown category={category} onSelectAction={setSelected} />
            </div>

            <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-6">
                    <FaceTryOn selectedOverlay={selected} />

                    <button
                        type="button"
                        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.01] hover:from-emerald-500 hover:to-teal-400 hover:shadow-xl"
                    >
                        ✨ Shop This Look
                    </button>
                </div>

                <TryOnPanel alerts={alerts} />
            </div>
        </main>
    );
}

export default function Page() {
    return (
        <Suspense
            fallback={
                <main className="p-4 pb-24">
                    <h1 className="mb-4 text-2xl font-bold">Try On</h1>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                        Loading try-on experience…
                    </div>
                </main>
            }
        >
            <TryOnPageInner />
        </Suspense>
    );
}