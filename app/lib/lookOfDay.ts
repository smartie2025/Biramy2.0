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
    brand?: string;
    price?: string;
    shopUrl?: string;
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
        {
            category: "glasses",
            assetId: "glasses-1",
            brand: "Curated glasses search",
            price: "See site",
            shopUrl: "https://www.google.com/search?tbm=shop&q=black+gold+rimmed+glasses",
        },
        {
            category: "earrings",
            assetId: "earrings-1",
            brand: "Curated earrings search",
            price: "See site",
            shopUrl: "https://www.google.com/search?tbm=shop&q=moon+drop+earrings",
        },
    ],
};
