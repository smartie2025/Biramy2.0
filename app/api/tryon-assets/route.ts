import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = "https://biramyapi.azure-api.net/api/items";
const API_TOKEN = process.env.BRIANY_API_TOKEN ?? "03b624f785954731958df20046afccbc";

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
    [key: string]: unknown;
};

type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

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

function mapItem(item: RawItem, index: number): { category: string; overlay: OverlayItem } | null {
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

    const category = normaliseCategory(item.categoryName ?? item.category ?? item.type);
    if (!category) return null;

    return {
        category,
        overlay: {
            id: String(item.id ?? `${category}-${index}`),
            name:
                (typeof item.name === "string" && item.name.trim()) ||
                (typeof item.title === "string" && item.title.trim()) ||
                `${category}-${index + 1}`,
            src,
            thumb:
                typeof item.thumbnail === "string" && item.thumbnail.trim()
                    ? item.thumbnail.trim()
                    : typeof item.thumb === "string" && item.thumb.trim()
                        ? item.thumb.trim()
                        : src,
        },
    };
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const requestedCategory = searchParams.get("category")?.toLowerCase() ?? null;

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