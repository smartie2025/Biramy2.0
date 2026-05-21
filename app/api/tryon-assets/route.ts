import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL =
    process.env.BIRAMY_ITEMS_API_URL ??
    "http://174.88.62.118:7124/biramy/api/Items";

const API_TOKEN = process.env.BIRAMY_API_TOKEN;

const OVERLAY_ROOT = path.join(
    process.cwd(),
    "public",
    "assets",
    "tryon",
    "overlays"
);

const CATEGORIES = [
    "glasses",
    "earrings",
    "rings",
    "necklaces",
    "bracelets",
    "sunglasses",
    "hats",
    "scarves",
    "watches",
] as const;

type Category = (typeof CATEGORIES)[number];

type RawItem = Record<string, unknown>;

type OverlayItem = {
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

type OverlaysByCategory = Partial<Record<Category, OverlayItem[]>>;

type ShopFallback = {
    shopUrl?: string;
    brand?: string;
    price?: string;
};

const fallbackShopUrlByCategory: Partial<Record<Category, string>> = {
    glasses: "https://www.google.com/search?tbm=shop&q=black+gold+rimmed+glasses",
    earrings: "https://www.google.com/search?tbm=shop&q=moon+drop+earrings",
    necklaces: "https://www.tiffany.com/jewelry/necklaces-pendants/",
};

const fallbackBrandByCategory: Partial<Record<Category, string>> = {
    glasses: "Curated glasses search",
    earrings: "Curated earrings search",
    necklaces: "Tiffany & Co.",
};

const fallbackPriceByCategory: Partial<Record<Category, string>> = {
    glasses: "See site",
    earrings: "See site",
    necklaces: "See site",
};

const categoryFileAliases: Record<Category, string[]> = {
    glasses: ["glasses", "glass"],
    earrings: ["earrings", "earring"],
    rings: ["rings", "ring"],
    necklaces: ["necklaces", "necklace"],
    bracelets: ["bracelets", "bracelet"],
    sunglasses: ["sunglasses", "sunglass"],
    hats: ["hats", "hat", "hair", "headpiece"],
    scarves: ["scarves", "scarf"],
    watches: ["watches", "watch"],
};

function isRecord(value: unknown): value is RawItem {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function makeShoppingSearchUrl(query: string): string {
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

function normaliseCategory(value: unknown): Category | null {
    if (typeof value !== "string") return null;

    const v = value.trim().toLowerCase();

    switch (v) {
        case "glasses":
            return "glasses";
        case "sunglasses":
            return "sunglasses";
        case "earrings":
            return "earrings";
        case "necklace":
        case "necklaces":
            return "necklaces";
        case "bracelet":
        case "bracelets":
            return "bracelets";
        case "ring":
        case "rings":
            return "rings";
        case "hat":
        case "hats":
        case "hair":
        case "headpiece":
            return "hats";
        case "scarf":
        case "scarves":
            return "scarves";
        case "watch":
        case "watches":
            return "watches";
        default:
            return null;
    }
}

function getFallbackShopMeta(category: Category, name: string): ShopFallback {
    const lowerName = name.toLowerCase();

    if (
        category === "glasses" &&
        lowerName.includes("black") &&
        lowerName.includes("gold")
    ) {
        return {
            shopUrl: makeShoppingSearchUrl("black gold rimmed glasses"),
            brand: "Curated glasses search",
            price: "See site",
        };
    }

    if (category === "earrings" && lowerName.includes("moon")) {
        return {
            shopUrl: makeShoppingSearchUrl("moon drop earrings"),
            brand: "Curated earrings search",
            price: "See site",
        };
    }

    return {
        shopUrl: fallbackShopUrlByCategory[category],
        brand: fallbackBrandByCategory[category],
        price: fallbackPriceByCategory[category],
    };
}

function getRawItems(data: unknown): RawItem[] {
    if (Array.isArray(data)) {
        return data.filter(isRecord);
    }

    if (!isRecord(data)) {
        return [];
    }

    const possibleArrays = [data.items, data.value, data.results];

    for (const possibleArray of possibleArrays) {
        if (Array.isArray(possibleArray)) {
            return possibleArray.filter(isRecord);
        }
    }

    return [];
}

function getItemId(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

function mapItem(
    item: RawItem,
    index: number
): { category: Category; overlay: OverlayItem } | null {
    const src =
        getString(item.url) ??
        getString(item.src) ??
        getString(item.imageUrl) ??
        getString(item.image);

    if (!src) return null;

    const category = normaliseCategory(
        item.categoryName ?? item.category ?? item.type
    );

    if (!category) return null;

    const name =
        getString(item.name) ?? getString(item.title) ?? `${category}-${index + 1}`;

    const fallbackShopMeta = getFallbackShopMeta(category, name);
    const idValue = item.id;
    const priceValue = item.price;

    return {
        category,
        overlay: {
            id:
                typeof idValue === "string" || typeof idValue === "number"
                    ? String(idValue)
                    : `${category}-${index + 1}`,
            itemId: getItemId(idValue),
            name,
            src,
            thumb: getString(item.thumbnail) ?? getString(item.thumb) ?? src,
            category,
            shopUrl:
                getString(item.shopUrl) ??
                getString(item.productUrl) ??
                getString(item.productPageUrl) ??
                fallbackShopMeta.shopUrl,
            brand: getString(item.brand) ?? fallbackShopMeta.brand,
            price:
                getString(priceValue) ??
                (typeof priceValue === "number"
                    ? `$${priceValue.toFixed(2)}`
                    : fallbackShopMeta.price),
        },
    };
}

async function getAzureOverlays(): Promise<OverlaysByCategory | null> {
    try {
        const headers: HeadersInit = {
            Accept: "application/json",
        };

        if (API_TOKEN) {
            headers["Ocp-Apim-Subscription-Key"] = API_TOKEN;
        }

        const response = await fetch(API_URL, {
            method: "GET",
            cache: "no-store",
            headers,
        });

        if (!response.ok) {
            const text = await response.text();

            console.warn("Items API unavailable. Using local fallback.", {
                status: response.status,
                statusText: response.statusText,
                details: text.slice(0, 300),
            });

            return null;
        }

        const data: unknown = await response.json();
        const rawItems = getRawItems(data);
        const overlaysByCategory: OverlaysByCategory = {};

        rawItems.forEach((item, index) => {
            const mapped = mapItem(item, index);
            if (!mapped) return;

            const currentItems = overlaysByCategory[mapped.category] ?? [];
            currentItems.push(mapped.overlay);
            overlaysByCategory[mapped.category] = currentItems;
        });

        return overlaysByCategory;
    } catch (caughtError: unknown) {
        console.warn("Items API failed. Using local fallback.", caughtError);
        return null;
    }
}

function isImageFile(filename: string): boolean {
    return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(filename);
}

function makeDisplayName(
    filename: string,
    category: Category,
    index: number
): string {
    const withoutExtension = filename.replace(/\.[^.]+$/, "");
    let cleaned = withoutExtension;

    for (const alias of categoryFileAliases[category]) {
        cleaned = cleaned.replace(new RegExp(`^${alias}[-_\\s]*`, "i"), "");
    }

    cleaned = cleaned.replace(/[-_]+/g, " ").trim();

    if (!cleaned) {
        return `${category}-${index + 1}`;
    }

    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function fileMatchesCategory(filename: string, category: Category): boolean {
    const lowerFilename = filename.toLowerCase();

    return categoryFileAliases[category].some((alias) =>
        lowerFilename.includes(alias)
    );
}

async function readDirectorySafe(directoryPath: string): Promise<string[]> {
    try {
        return await fs.readdir(directoryPath);
    } catch {
        return [];
    }
}

async function getLocalOverlaysForCategory(
    category: Category
): Promise<OverlayItem[]> {
    const categoryFolderPath = path.join(OVERLAY_ROOT, category);
    const categoryFolderFiles = await readDirectorySafe(categoryFolderPath);

    const nestedImageFiles = categoryFolderFiles
        .filter(isImageFile)
        .sort((a, b) => a.localeCompare(b));

    if (nestedImageFiles.length > 0) {
        return nestedImageFiles.map((filename, index) => {
            const src = `/assets/tryon/overlays/${category}/${encodeURIComponent(
                filename
            )}`;
            const name = makeDisplayName(filename, category, index);
            const fallbackShopMeta = getFallbackShopMeta(category, name);

            return {
                id: `${category}-${index + 1}`,
                name,
                src,
                thumb: src,
                category,
                shopUrl: fallbackShopMeta.shopUrl,
                brand: fallbackShopMeta.brand,
                price: fallbackShopMeta.price,
            };
        });
    }

    const rootFiles = await readDirectorySafe(OVERLAY_ROOT);

    return rootFiles
        .filter(
            (filename) => isImageFile(filename) && fileMatchesCategory(filename, category)
        )
        .sort((a, b) => a.localeCompare(b))
        .map((filename, index) => {
            const src = `/assets/tryon/overlays/${encodeURIComponent(filename)}`;
            const name = makeDisplayName(filename, category, index);
            const fallbackShopMeta = getFallbackShopMeta(category, name);

            return {
                id: `${category}-${index + 1}`,
                name,
                src,
                thumb: src,
                category,
                shopUrl: fallbackShopMeta.shopUrl,
                brand: fallbackShopMeta.brand,
                price: fallbackShopMeta.price,
            };
        });
}

async function getLocalOverlays(): Promise<OverlaysByCategory> {
    const overlaysByCategory: OverlaysByCategory = {};

    await Promise.all(
        CATEGORIES.map(async (category) => {
            overlaysByCategory[category] = await getLocalOverlaysForCategory(category);
        })
    );

    return overlaysByCategory;
}

function hasAnyOverlays(overlaysByCategory: OverlaysByCategory): boolean {
    return CATEGORIES.some(
        (category) => (overlaysByCategory[category] ?? []).length > 0
    );
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const requestedCategory = normaliseCategory(searchParams.get("category"));

        const azureOverlays = await getAzureOverlays();

        let source: "azure" | "local-fallback";
        let overlaysByCategory: OverlaysByCategory;

        if (azureOverlays !== null && hasAnyOverlays(azureOverlays)) {
            source = "azure";
            overlaysByCategory = azureOverlays;
        } else {
            source = "local-fallback";
            overlaysByCategory = await getLocalOverlays();
        }

        if (requestedCategory !== null) {
            return NextResponse.json({
                ok: true,
                source,
                overlays: overlaysByCategory[requestedCategory] ?? [],
            });
        }

        return NextResponse.json({
            ok: true,
            source,
            overlays: overlaysByCategory,
        });
    } catch (caughtError: unknown) {
        console.error("tryon-assets GET failed:", caughtError);

        const message =
            caughtError instanceof Error ? caughtError.message : "Unknown route error";

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 }
        );
    }
}