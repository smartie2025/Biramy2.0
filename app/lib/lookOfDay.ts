export type LookCategory =
    | "glasses"
    | "earrings"
    | "rings"
    | "necklaces"
    | "bracelets"
    | "sunglasses"
    | "hats"
    | "scarves"
    | "watches";

export type FeaturedLookItem = {
    category: LookCategory;
    assetId: string;
};

export type FeaturedLook = {
    id: string;
    title: string;
    subtitle: string;
    rewardXp: number;
    missionId: string;
    items: FeaturedLookItem[];
};

export const LOOK_OF_THE_DAY: FeaturedLook = {
    id: "midnight-starlight",
    title: "Midnight Starlight",
    subtitle: "Rose-gold glasses + moon-drop earrings",
    rewardXp: 25,
    missionId: "try-look-of-the-day",
    items: [
        { category: "glasses", assetId: "glasses-1" },
        { category: "earrings", assetId: "earrings-1" },
    ],
};