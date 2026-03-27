import { create } from "zustand";

/** ========== Types ========== */

export type Category =
    | "rings"
    | "necklaces"
    | "earrings"
    | "bracelets"
    | "sunglasses"
    | "glasses"
    | "hats"
    | "scarves"
    | "watches";

export type OverlayItem = {
    id: string;      // unique overlay id (e.g. "glasses-1")
    name: string;    // display name
    src: string;     // image URL used on the canvas
    thumb?: string;  // optional thumbnail for picker
};

// Per-layer state for an item placed on the canvas
export type LayerState = {
    id: string;       // overlay id (from OverlayItem.id)
    x: number;        // position X
    y: number;        // position Y
    z: number;        // depth factor (for future Z controls)
    scale: number;    // scale multiplier
    rotation: number; // radians (current system uses radians)
    opacity: number;  // 0..1
};

export type MissionProgress = {
    id: string;
    title: string;
    current: number;
    target: number;
    completed: boolean;
    xpReward: number;
};

/** ========== Store Shape ========== */

type TryOnState = {
    // Which catalog category is currently selected in the UI
    category: Category | null;

    // Catalog: which overlays exist in each shopping category
    overlays: Record<Category, OverlayItem[]>;

    // All layers currently placed in the scene
    layers: LayerState[];

    // Which layer we are editing with the transform controls
    activeLayerId: string | null;

    // -------- Gamification --------
    xp: number;
    level: number;
    collectibles: string[];
    missions: MissionProgress[];

    /** Layer actions */
    addLayer: (id: string) => void;
    removeLayer: (id: string) => void;
    setActiveLayer: (id: string | null) => void;

    /** Modify a specific layer’s transform */
    updateLayer: (id: string, patch: Partial<LayerState>) => void;

    /** Remove everything */
    clearAllLayers: () => void;

    /** Catalog actions */
    setCategory: (c: Category | null) => void;
    setOverlays: (c: Category, items: OverlayItem[]) => void;

    /** Gamification actions */
    addXP: (amount: number) => void;
    incrementTryOnMission: () => void;
    addCollectible: (name: string) => void;
};

/** ========== Helpers ========== */

function calculateLevel(xp: number): number {
    // Simple PoC rule: every 100 XP = next level
    return Math.floor(xp / 100) + 1;
}

/** ========== Remote Overlay Loader ========== */
function getOverlayItemData(): Promise<Record<Category, OverlayItem[]>> {
    return fetch("https://brianyapi.azure-api.net/GetItems", {
        method: "GET",
        headers: {
            "Ocp-Apim-Subscription-Key": "03b624f785954731958df20046afccbc",
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);

            const newOverlayItems: Record<Category, OverlayItem[]> = {
                rings: [],
                necklaces: [],
                earrings: [],
                bracelets: [],
                sunglasses: [],
                glasses: [],
                hats: [],
                scarves: [],
                watches: [],
            };

            data.forEach((item: any) => {
                item.id = item.name;

                switch (item.categoryName.trim()) {
                    case "Glasses":
                        newOverlayItems.glasses.push(item);
                        break;
                    case "rings":
                        newOverlayItems.rings.push(item);
                        break;
                    case "Necklace":
                        newOverlayItems.necklaces.push(item);
                        break;
                    case "earrings":
                        newOverlayItems.earrings.push(item);
                        break;
                    case "bracelets":
                        newOverlayItems.bracelets.push(item);
                        break;
                    case "sunglasses":
                        newOverlayItems.sunglasses.push(item);
                        break;
                    case "hats":
                        newOverlayItems.hats.push(item);
                        break;
                    case "HeadPiece":
                    case "Scarf":
                        newOverlayItems.scarves.push(item);
                        break;
                    case "watches":
                        newOverlayItems.watches.push(item);
                        break;
                }
            });

            return newOverlayItems;
        });
}

/** ========== Store ========== */

export const useTryOnStore = create<TryOnState>((set) => ({
    category: null,

    overlays: {
        rings: [],
        necklaces: [],
        earrings: [],
        bracelets: [],
        sunglasses: [],
        glasses: [],
        hats: [],
        scarves: [],
        watches: [],
    },

    layers: [],
    activeLayerId: null,

    // -------- Gamification initial state --------
    xp: 0,
    level: 1,
    collectibles: [],
    missions: [
        {
            id: "try-3-items",
            title: "Try 3 items",
            current: 0,
            target: 3,
            completed: false,
            xpReward: 50,
        },
    ],

    /** Add a new layer with default transform values */
    addLayer: (id) =>
        set((s) => ({
            layers: [
                ...s.layers,
                {
                    id,
                    x: 0,
                    y: 0,
                    z: 0,
                    scale: 1,
                    rotation: 0,
                    opacity: 0.95,
                },
            ],
            activeLayerId: id,
        })),

    /** Remove one layer and clear activeLayerId if it was that one */
    removeLayer: (id) =>
        set((s) => ({
            layers: s.layers.filter((l) => l.id !== id),
            activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
        })),

    /** Set which layer is currently controlled by the sliders */
    setActiveLayer: (id) => set({ activeLayerId: id }),

    /** Patch transform fields on a specific layer */
    updateLayer: (id, patch) =>
        set((s) => ({
            layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),

    /** Remove everything from the canvas */
    clearAllLayers: () => set({ layers: [], activeLayerId: null }),

    /** UI: change selected catalog category */
    setCategory: (c) => set({ category: c }),

    /** Load overlays into a catalog category */
    setOverlays: (c, items) =>
        set((s) => ({
            overlays: { ...s.overlays, [c]: items },
        })),

    /** Add XP and recalculate level */
    addXP: (amount) =>
        set((s) => {
            const newXp = s.xp + amount;
            return {
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

    /** Increment the "Try 3 items" mission and award bonus XP when completed */
    incrementTryOnMission: () =>
        set((s) => {
            const updatedMissions = s.missions.map((mission) => {
                if (mission.id !== "try-3-items" || mission.completed) {
                    return mission;
                }

                const nextCurrent = mission.current + 1;
                const justCompleted = nextCurrent >= mission.target;

                return {
                    ...mission,
                    current: Math.min(nextCurrent, mission.target),
                    completed: justCompleted,
                };
            });

            const missionBefore = s.missions.find((m) => m.id === "try-3-items");
            const missionAfter = updatedMissions.find((m) => m.id === "try-3-items");

            let bonusXp = 0;

            if (
                missionBefore &&
                missionAfter &&
                !missionBefore.completed &&
                missionAfter.completed
            ) {
                bonusXp = missionAfter.xpReward;
            }

            const newXp = s.xp + bonusXp;

            return {
                missions: updatedMissions,
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

    /** Add a collectible if it is not already owned */
    addCollectible: (name) =>
        set((s) => ({
            collectibles: s.collectibles.includes(name)
                ? s.collectibles
                : [...s.collectibles, name],
        })),
}));

/** ========== Load data after store initialization ========== */
getOverlayItemData()
    .then((data: Record<Category, OverlayItem[]>) => {
        useTryOnStore.setState({ overlays: data });
    })
    .catch((error) => {
        console.error("Failed to load overlay data:", error);
    });