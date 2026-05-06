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
    rotation: number;
    opacity: number;
    visible: boolean;
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
    claimedLookRewardIds: string[];

    addLayer: (item: OverlayItem, category: Category) => void;
    removeLayer: (id: string) => void;
    setActiveLayer: (id: string | null) => void;
    updateLayer: (id: string, patch: Partial<LayerState>) => void;
    clearAllLayers: () => void;
    toggleLayerVisibility: (id: string) => void;

    setCategory: (c: Category | null) => void;
    setOverlays: (c: Category, items: OverlayItem[]) => void;

    addXP: (amount: number) => void;
    incrementTryOnMission: () => void;
    incrementMission: (missionId: string, amount?: number) => void;
    claimLookReward: (lookId: string, amount: number, missionId?: string) => void;
    addCollectible: (name: string) => void;
};

function calculateLevel(xp: number): number {
    return Math.floor(xp / 100) + 1;
}

function progressMission(
    missions: MissionProgress[],
    missionId: string,
    amount = 1
): { missions: MissionProgress[]; awardedXp: number } {
    const updatedMissions = missions.map((mission) => {
        if (mission.id !== missionId || mission.completed) {
            return mission;
        }

        const nextCurrent = mission.current + amount;
        const clampedCurrent = Math.min(nextCurrent, mission.target);
        const justCompleted = clampedCurrent >= mission.target;

        return {
            ...mission,
            current: clampedCurrent,
            completed: justCompleted,
        };
    });

    const before = missions.find((m) => m.id === missionId);
    const after = updatedMissions.find((m) => m.id === missionId);

    let awardedXp = 0;
    if (before && after && !before.completed && after.completed) {
        awardedXp = after.xpReward;
    }

    return { missions: updatedMissions, awardedXp };
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
    claimedLookRewardIds: [],

    missions: [
        {
            id: "try-3-items",
            title: "Try 3 items",
            current: 0,
            target: 3,
            completed: false,
            xpReward: 50,
        },
        {
            id: "try-look-of-the-day",
            title: "Try Look of the Day",
            current: 0,
            target: 1,
            completed: false,
            xpReward: 0,
        },
    ],

    addLayer: (item, category) =>
        set((s) => {
            const layerId = `${category}-${item.id}-${Date.now()}`;

            return {
                layers: [
                    ...s.layers,
                    {
                        id: layerId,
                        asset: item,
                        category,
                        x: 0,
                        y: 0,
                        z: 0,
                        scale: 1,
                        rotation: 0,
                        opacity: 0.95,
                        visible: true,
                    },
                ],
                activeLayerId: layerId,
            };
        }),

    removeLayer: (id) =>
        set((s) => {
            const nextLayers = s.layers.filter((l) => l.id !== id);
            const nextActive =
                s.activeLayerId === id ? nextLayers.at(-1)?.id ?? null : s.activeLayerId;

            return {
                layers: nextLayers,
                activeLayerId: nextActive,
            };
        }),

    setActiveLayer: (id) => set({ activeLayerId: id }),

    updateLayer: (id, patch) =>
        set((s) => ({
            layers: s.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),

    clearAllLayers: () => set({ layers: [], activeLayerId: null }),

    toggleLayerVisibility: (id) =>
        set((s) => ({
            layers: s.layers.map((l) =>
                l.id === id ? { ...l, visible: !l.visible } : l
            ),
        })),

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
            const { missions, awardedXp } = progressMission(s.missions, "try-3-items");
            const newXp = s.xp + awardedXp;

            return {
                missions,
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

    incrementMission: (missionId, amount = 1) =>
        set((s) => {
            const { missions, awardedXp } = progressMission(s.missions, missionId, amount);
            const newXp = s.xp + awardedXp;

            return {
                missions,
                xp: newXp,
                level: calculateLevel(newXp),
            };
        }),

    claimLookReward: (lookId, amount, missionId) =>
        set((s) => {
            if (s.claimedLookRewardIds.includes(lookId)) {
                return {};
            }

            let missions = s.missions;
            let bonusMissionXp = 0;

            if (missionId) {
                const result = progressMission(s.missions, missionId);
                missions = result.missions;
                bonusMissionXp = result.awardedXp;
            }

            const newXp = s.xp + amount + bonusMissionXp;

            return {
                claimedLookRewardIds: [...s.claimedLookRewardIds, lookId],
                missions,
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