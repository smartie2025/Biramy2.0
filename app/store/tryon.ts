import { create } from "zustand";

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
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

export type LayerState = {
    id: string;
    asset: OverlayItem;
    category: Category;
    x: number;
    y: number;
    z: number;
    scale: number;
    rotation: number; // degrees
    opacity: number;
};

export type MissionProgress = {
    id: string;
    title: string;
    current: number;
    target: number;
    completed: boolean;
    xpReward: number;
};

type TryOnState = {
    category: Category | null;
    overlays: Record<Category, OverlayItem[]>;
    layers: LayerState[];
    activeLayerId: string | null;

    xp: number;
    level: number;
    collectibles: string[];
    missions: MissionProgress[];

    addLayer: (item: OverlayItem, category: Category) => void;
    removeLayer: (id: string) => void;
    setActiveLayer: (id: string | null) => void;
    updateLayer: (id: string, patch: Partial<LayerState>) => void;
    clearAllLayers: () => void;

    setCategory: (c: Category | null) => void;
    setOverlays: (c: Category, items: OverlayItem[]) => void;

    addXP: (amount: number) => void;
    incrementTryOnMission: () => void;
    addCollectible: (name: string) => void;
};

function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
}

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

    addLayer: (item, category) =>
        set((s) => ({
            layers: [
                ...s.layers,
                {
                    id: item.id,
                    asset: item,
                    category,
                    x: 0,
                    y: 0,
                    z: 0,
                    scale: 1,
                    rotation: 0,
                    opacity: 0.95,
                },
            ],
            activeLayerId: item.id,
        })),

    removeLayer: (id) =>
        set((s) => ({
            layers: s.layers.filter((l) => l.id !== id),
            activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
        })),

    setActiveLayer: (id) => set({ activeLayerId: id }),

    updateLayer: (id, patch) =>
        set((s) => ({
            layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),

    clearAllLayers: () => set({ layers: [], activeLayerId: null }),

    setCategory: (c) => set({ category: c }),

    setOverlays: (c, items) =>
        set((s) => ({
            overlays: { ...s.overlays, [c]: items },
        })),

    addXP: (amount) =>
        set((s) => {
            const newXp = s.xp + amount;
            return {
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

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

            const before = s.missions.find((m) => m.id === "try-3-items");
            const after = updatedMissions.find((m) => m.id === "try-3-items");

            let bonusXp = 0;
            if (before && after && !before.completed && after.completed) {
                bonusXp = after.xpReward;
            }

            const newXp = s.xp + bonusXp;

            return {
                missions: updatedMissions,
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

    addCollectible: (name) =>
        set((s) => ({
            collectibles: s.collectibles.includes(name)
                ? s.collectibles
                : [...s.collectibles, name],
        })),
}));