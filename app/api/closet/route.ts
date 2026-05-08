import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_API_URL = process.env.BIRAMY_AUTH_API_URL;
const CLOSET_API_URL = process.env.BIRAMY_CLOSET_API_URL;
const AUTH_USERNAME = process.env.BIRAMY_AUTH_USERNAME;
const AUTH_PASSWORD = process.env.BIRAMY_AUTH_PASSWORD;

type SaveClosetBody = {
    item: number;
    user?: number;
    nickName?: string;
    purchaseDate?: string;
    rating?: string;
};

type AuthResponseShape = {
    token?: unknown;
    accessToken?: unknown;
    bearerToken?: unknown;
    jwt?: unknown;
    expiresIn?: unknown;
};

let cachedToken: {
    value: string;
    expiresAt: number;
} | null = null;

function requireEnv(value: string | undefined, name: string) {
    if (!value || !value.trim()) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value.trim();
}

function normalizeAuthValue(token: string) {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function extractToken(data: unknown) {
    if (typeof data === "string" && data.trim()) {
        return data.trim();
    }

    if (!data || typeof data !== "object") {
        return null;
    }

    const authData = data as AuthResponseShape;

    const candidates = [
        authData.token,
        authData.accessToken,
        authData.bearerToken,
        authData.jwt,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim();
        }
    }

    return null;
}

async function fetchWithTimeout(
    stage: string,
    url: string,
    init: RequestInit,
    timeoutMs = 15000
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown network error";

        throw new Error(`${stage} network request failed: ${message}`);
    } finally {
        clearTimeout(timeout);
    }
}

async function getBearerToken() {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.value;
    }

    const authUrl = requireEnv(AUTH_API_URL, "BIRAMY_AUTH_API_URL");
    const username = requireEnv(AUTH_USERNAME, "BIRAMY_AUTH_USERNAME");
    const password = requireEnv(AUTH_PASSWORD, "BIRAMY_AUTH_PASSWORD");

    const response = await fetchWithTimeout("Auth/login", authUrl, {
        method: "POST",
        cache: "no-store",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `Auth/login failed: ${response.status} ${response.statusText}. ${text}`
        );
    }

    let data: unknown = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    const token = extractToken(data);

    if (!token) {
        throw new Error(
            `Auth/login succeeded but no token field was found. Response was: ${text}`
        );
    }

    const expiresIn =
        data &&
            typeof data === "object" &&
            typeof (data as AuthResponseShape).expiresIn === "number"
            ? Number((data as AuthResponseShape).expiresIn)
            : 55 * 60;

    cachedToken = {
        value: token,
        expiresAt: Date.now() + Math.max(60, expiresIn - 60) * 1000,
    };

    return token;
}

async function getAuthHeaders() {
    const token = await getBearerToken();

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: normalizeAuthValue(token),
    };
}

export async function GET() {
    try {
        const closetUrl = requireEnv(CLOSET_API_URL, "BIRAMY_CLOSET_API_URL");

        const response = await fetchWithTimeout("Closet GET", closetUrl, {
            method: "GET",
            cache: "no-store",
            headers: await getAuthHeaders(),
        });

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Closet GET",
                    error: `Closet API GET failed: ${response.status} ${response.statusText}`,
                    details: text,
                },
                { status: 502 }
            );
        }

        let data: unknown = [];

        try {
            data = text ? JSON.parse(text) : [];
        } catch {
            data = text;
        }

        return NextResponse.json({
            ok: true,
            closet: data,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown closet GET error";

        console.warn("BIRAMY closet GET route failed:", message);

        return NextResponse.json(
            {
                ok: false,
                stage: "Next /api/closet GET",
                error: message,
            },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const closetUrl = requireEnv(CLOSET_API_URL, "BIRAMY_CLOSET_API_URL");

        const body = (await req.json()) as SaveClosetBody;

        if (!body.item || Number.isNaN(Number(body.item))) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Validate request body",
                    error: "Missing valid item id.",
                },
                { status: 400 }
            );
        }

        const payload: SaveClosetBody = {
            item: Number(body.item),
            user: body.user ?? 1,
            nickName: body.nickName ?? "Saved item",
            purchaseDate: body.purchaseDate ?? new Date().toISOString(),
            rating: body.rating ?? "5",
        };

        const response = await fetchWithTimeout("Closet POST", closetUrl, {
            method: "POST",
            cache: "no-store",
            headers: await getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Closet POST",
                    error: `Closet API POST failed: ${response.status} ${response.statusText}`,
                    details: text,
                    sent: payload,
                },
                { status: 502 }
            );
        }

        let data: unknown = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        return NextResponse.json({
            ok: true,
            saved: data,
            sent: payload,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Unknown closet POST error";

        console.warn("BIRAMY closet POST route failed:", message);

        return NextResponse.json(
            {
                ok: false,
                stage: "Next /api/closet POST",
                error: message,
            },
            { status: 500 }
        );
    }
}
