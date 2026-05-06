import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_API_URL = process.env.BIRAMY_AUTH_API_URL;
const CLOSET_API_URL = process.env.BIRAMY_CLOSET_API_URL;
const AUTH_USERNAME = process.env.BIRAMY_AUTH_USERNAME;
const AUTH_PASSWORD = process.env.BIRAMY_AUTH_PASSWORD;
const DEFAULT_USER_ID = Number(process.env.BIRAMY_CLOSET_DEFAULT_USER ?? "1");

type SaveClosetBody = {
    item: number;
    user?: number;
    nickName?: string;
    purchaseDate?: string;
    rating?: string;
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

function readNestedString(data: unknown, path: string[]) {
    let current: unknown = data;

    for (const key of path) {
        if (typeof current !== "object" || current === null) return null;
        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === "string" && current.trim() ? current.trim() : null;
}

function extractToken(data: unknown, rawText: string) {
    const candidates = [
        ["token"],
        ["accessToken"],
        ["access_token"],
        ["bearerToken"],
        ["jwt"],
        ["data", "token"],
        ["data", "accessToken"],
        ["result", "token"],
        ["result", "accessToken"],
    ];

    for (const path of candidates) {
        const value = readNestedString(data, path);
        if (value) return value;
    }

    if (typeof data === "string" && data.trim() && !data.trim().startsWith("{")) {
        return data.trim();
    }

    if (rawText.trim() && !rawText.trim().startsWith("{")) {
        return rawText.trim();
    }

    return null;
}

async function getBearerToken() {
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.value;
    }

    const authUrl = requireEnv(AUTH_API_URL, "BIRAMY_AUTH_API_URL");
    const username = requireEnv(AUTH_USERNAME, "BIRAMY_AUTH_USERNAME");
    const password = requireEnv(AUTH_PASSWORD, "BIRAMY_AUTH_PASSWORD");

    const response = await fetch(authUrl, {
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
        throw new Error(`Auth API failed: ${response.status} ${response.statusText}. ${text}`);
    }

    let data: unknown = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    const token = extractToken(data, text);

    if (!token) {
        throw new Error("Auth succeeded, but no token field was found in the response.");
    }

    cachedToken = {
        value: token,
        expiresAt: Date.now() + 55 * 60 * 1000,
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

        const response = await fetch(closetUrl, {
            method: "GET",
            cache: "no-store",
            headers: await getAuthHeaders(),
        });

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
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

        return NextResponse.json(
            {
                ok: false,
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
        const itemId = Number(body.item);

        if (!Number.isFinite(itemId) || itemId <= 0) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing valid item id.",
                },
                { status: 400 }
            );
        }

        const payload: SaveClosetBody = {
            item: itemId,
            user:
                typeof body.user === "number" && Number.isFinite(body.user)
                    ? body.user
                    : DEFAULT_USER_ID,
            nickName: body.nickName?.trim() || "Saved item",
            purchaseDate: body.purchaseDate ?? new Date().toISOString(),
            rating: body.rating?.trim() || "5",
        };

        const response = await fetch(closetUrl, {
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

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 }
        );
    }
}
