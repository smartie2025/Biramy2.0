import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL =
    process.env.BIRAMY_ITEMS_API_URL ?? "https://biramyapi.azure-api.net/api/items";
const API_TOKEN = process.env.BIRAMY_API_TOKEN;

type RawItem = {
    id?: string | number;
    name?: string;
    title?: string;
    image?: string;
    imageUrl?: string;
    url?: string;
    src?: string;
    thumbnail?: string;
    thumb?: string;
    category?: string;
    type?: string;
    categoryName?: string;
    categoryID?: number;
    shopUrl?: string;
    productUrl?: string;
    productPageUrl?: string;
    brand?: string;
    price?: string | number;
    [key: string]: unknown;
};

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

type ShopFallback = {
    shopUrl?: string;
    brand?: string;
    price?: string;
};

const fallbackShopUrlByCategory: Record<string, string> = {
    glasses: "https://www.google.com/search?tbm=shop&q=black+gold+rimmed+glasses",
    earrings: "https://www.google.com/search?tbm=shop&q=moon+drop+earrings",
    necklaces: "https://www.tiffany.com/jewelry/necklaces-pendants/",
};

const fallbackBrandByCategory: Record<string, string> = {
    glasses: "Curated glasses search",
    earrings: "Curated earrings search",
    necklaces: "Tiffany & Co.",
};

const fallbackPriceByCategory: Record<string, string> = {
    glasses: "See site",
    earrings: "See site",
    necklaces: "See site",
};

function makeShoppingSearchUrl(query: string): string {
    return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

function getFallbackShopMeta(category: string, name: string): ShopFallback {
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

function normaliseCategory(value: unknown): string | null {
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

function mapItem(
    item: RawItem,
    index: number
): { category: string; overlay: OverlayItem } | null {
    const src =
        typeof item.url === "string" && item.url.trim()
            ? item.url.trim()
            : typeof item.src === "string" && item.src.trim()
                ? item.src.trim()
                : typeof item.imageUrl === "string" && item.imageUrl.trim()
                    ? item.imageUrl.trim()
                    : typeof item.image === "string" && item.image.trim()
                        ? item.image.trim()
                        : null;

    if (!src) return null;

    const category = normaliseCategory(
        item.categoryName ?? item.category ?? item.type
    );
    if (!category) return null;

    const name =
        (typeof item.name === "string" && item.name.trim()) ||
        (typeof item.title === "string" && item.title.trim()) ||
        `${category}-${index + 1}`;

    const fallbackShopMeta = getFallbackShopMeta(category, name);

    return {
        category,
        overlay: {
            id: String(item.id ?? `${category}-${index}`),
            itemId:
                typeof item.id === "number"
                    ? item.id
                    : typeof item.id === "string" && !Number.isNaN(Number(item.id))
                        ? Number(item.id)
                        : undefined,
            name,
            src,
            thumb:
                typeof item.thumbnail === "string" && item.thumbnail.trim()
                    ? item.thumbnail.trim()
                    : typeof item.thumb === "string" && item.thumb.trim()
                        ? item.thumb.trim()
                        : src,
            category,
            shopUrl:
                typeof item.shopUrl === "string" && item.shopUrl.trim()
                    ? item.shopUrl.trim()
                    : typeof item.productUrl === "string" && item.productUrl.trim()
                        ? item.productUrl.trim()
                        : typeof item.productPageUrl === "string" && item.productPageUrl.trim()
                            ? item.productPageUrl.trim()
                            : fallbackShopMeta.shopUrl,
            brand:
                typeof item.brand === "string" && item.brand.trim()
                    ? item.brand.trim()
                    : fallbackShopMeta.brand,
            price:
                typeof item.price === "string" && item.price.trim()
                    ? item.price.trim()
                    : typeof item.price === "number"
                        ? `$${item.price.toFixed(2)}`
                        : fallbackShopMeta.price,
        },
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const requestedCategory = searchParams.get("category")?.toLowerCase() ?? null;

        if (!API_TOKEN) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "Missing BIRAMY_API_TOKEN. Add it to .env.local and restart the dev server.",
                },
                { status: 500 }
            );
        }

        const response = await fetch(API_URL, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Ocp-Apim-Subscription-Key": API_TOKEN,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                {
                    ok: false,
                    error: `Azure API request failed: ${response.status} ${response.statusText}`,
                    details: text,
                },
                { status: 502 }
            );
        }

        const data = await response.json();

        const rawItems: RawItem[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.value)
                    ? data.value
                    : Array.isArray(data?.results)
                        ? data.results
                        : [];

        const overlaysByCategory: Record<string, OverlayItem[]> = {};

        rawItems.forEach((item, index) => {
            const mapped = mapItem(item, index);
            if (!mapped) return;

            if (!overlaysByCategory[mapped.category]) {
                overlaysByCategory[mapped.category] = [];
            }

            overlaysByCategory[mapped.category].push(mapped.overlay);
        });

        if (requestedCategory) {
            return NextResponse.json({
                ok: true,
                overlays: overlaysByCategory[requestedCategory] ?? [],
            });
        }

        return NextResponse.json({
            ok: true,
            overlays: overlaysByCategory,
        });
    } catch (error) {
        console.error("tryon-assets GET failed:", error);

        const message =
            error instanceof Error ? error.message : "Unknown route error";

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 }
        );
    }
}
