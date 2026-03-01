import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** ===== Cache Settings ===== */
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

type OverlayItem = {
    id: string;
    name: string;
    src: string;
    thumb?: string;
};

type OverlayCatalog = Record<string, OverlayItem[]>;

/** ===== In-memory cache ===== */
let cachedData: OverlayCatalog | null = null;
let lastFetchTime = 0;

/** ===== Mock fetch function (replace later with DB/APIM call) ===== */
async function fetchOverlaysFromSource(): Promise<OverlayCatalog> {
    // For now we return mock
    return {
        rings: [],
        necklaces: [],
        earrings: [
            {
                id: "earrings-1",
                name: "Mock Earrings 1",
                src: "/assets/tryon/overlays/earrings/earrings-1.png",
                thumb: "/assets/tryon/overlays/earrings/earrings-1-thumb.png",
            },
        ],
        bracelets: [],
        sunglasses: [],
        glasses: [
            {
                id: "glasses-1",
                name: "Mock Glasses 1",
                src: "/assets/tryon/overlays/glasses/glasses-1.png",
                thumb: "/assets/tryon/overlays/glasses/glasses-1-thumb.png",
            },
        ],
        hats: [],
        scarves: [],
        watches: [],
    };
}

export async function GET(req: Request) {
    const now = Date.now();

    // Check cache validity
    if (!cachedData || now - lastFetchTime > CACHE_TTL_MS) {
        cachedData = await fetchOverlaysFromSource();
        lastFetchTime = now;
        console.log("Overlay cache refreshed");
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (category && category in cachedData) {
        return NextResponse.json({
            ok: true,
            overlays: { [category]: cachedData[category] },
            cached: true,
        });
    }

    return NextResponse.json({
        ok: true,
        overlays: cachedData,
        cached: true,
    });
}