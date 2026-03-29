import type { NextRequest } from "next/server";

export const runtime = "nodejs";

type ApiItem = {
    id?: string | number;
    name?: string;
    url?: string;
    src?: string;
    imageUrl?: string;
    image?: string;
    thumb?: string;
    thumbnail?: string;
    categoryName?: string;
};

const API_URL = "http://70.26.226.162:7124/biramy/api/GetItems";

function mapBackendCategoryToFrontend(categoryName: string): string | null {
    const value = categoryName.trim();

    switch (value) {
        case "Glasses":
            return "glasses";
        case "Sunglasses":
            return "sunglasses";
        case "Earrings":
        case "earrings":
            return "earrings";
        case "Necklace":
        case "Necklaces":
        case "necklaces":
            return "necklaces";
        case "Bracelets":
        case "bracelets":
            return "bracelets";
        case "Rings":
        case "rings":
            return "rings";
        case "Hat":
        case "Hats":
        case "HeadPiece":
        case "Hair":
            return "hats";
        case "Scarf":
        case "Scarves":
        case "scarves":
            return "scarves";
        case "Watches":
        case "watches":
            return "watches";
        default:
            return null;
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const requestedCategory = (searchParams.get("category") || "").trim().toLowerCase();

        const response = await fetch(API_URL, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            return Response.json(
                {
                    ok: false,
                    error: `Backend request failed with status ${response.status}`,
                },
                { status: 502, headers: { "Cache-Control": "no-store" } }
            );
        }

        const data = (await response.json()) as ApiItem[];

        const overlays: Record<string, Array<{
            id: string;
            name: string;
            src: string;
            thumb: string;
        }>> = {};

        for (const item of data) {
            const mappedCategory = mapBackendCategoryToFrontend(item.categoryName ?? "");
            if (!mappedCategory) continue;

            if (requestedCategory && mappedCategory !== requestedCategory) {
                continue;
            }

            const src = item.src ?? item.url ?? item.imageUrl ?? item.image ?? "";
            if (!src) continue;

            const normalized = {
                id: String(item.id ?? item.name ?? crypto.randomUUID()),
                name: item.name ?? "Unnamed Item",
                src,
                thumb: item.thumb ?? item.thumbnail ?? src,
            };

            if (!overlays[mappedCategory]) {
                overlays[mappedCategory] = [];
            }

            overlays[mappedCategory].push(normalized);
        }

        if (requestedCategory && !overlays[requestedCategory]) {
            overlays[requestedCategory] = [];
        }

        return Response.json(
            {
                ok: true,
                source: "biramy-backend",
                overlays,
            },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("tryon-assets route failed:", error);

        const message =
            error instanceof Error ? error.message : "Unknown route error";

        return Response.json(
            {
                ok: false,
                error: message,
            },
            { status: 500, headers: { "Cache-Control": "no-store" } }
        );
    }
}