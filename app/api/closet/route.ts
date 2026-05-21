import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CLOSET_API_URL = process.env.BIRAMY_CLOSET_API_URL;

type SaveClosetBody = {
    item?: unknown;
    user?: unknown;
    nickName?: unknown;
    purchaseDate?: unknown;
    rating?: unknown;
};

type JsonRecord = Record<string, unknown>;
type ClosetRecord = Record<string, unknown>;

function requireEnv(value: string | undefined, name: string) {
    if (!value || !value.trim()) {
        throw new Error(`Missing environment variable: ${name}`);
    }

    return value.trim();
}

function normalizeAuthValue(token: string) {
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

function getString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) return value;

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
}

function isRecord(value: unknown): value is JsonRecord {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSessionToken(req: NextRequest): string | null {
    const token = req.cookies.get("biramy_session")?.value;
    return token?.trim() || null;
}

function decodeJwtPayload(token: string): JsonRecord | null {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    try {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const paddingNeeded = base64.length % 4;

        if (paddingNeeded) {
            base64 += "=".repeat(4 - paddingNeeded);
        }

        const jsonText = Buffer.from(base64, "base64").toString("utf8");
        const parsed: unknown = JSON.parse(jsonText);

        return isRecord(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function getUserIdFromToken(token: string): number | undefined {
    const payload = decodeJwtPayload(token);
    if (!payload) return undefined;

    const candidates = [
        payload.userId,
        payload.UserId,
        payload.userid,
        payload.user_id,
        payload.id,
        payload.Id,
        payload.sub,
        payload.nameid,
        payload[
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ],
    ];

    for (const candidate of candidates) {
        const userId = getNumber(candidate);
        if (userId !== undefined) return userId;
    }

    return undefined;
}

function getAuthHeaders(token: string): HeadersInit {
    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: normalizeAuthValue(token),
    };
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
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Unknown network error";

        throw new Error(`${stage} network request failed: ${message}`);
    } finally {
        clearTimeout(timeout);
    }
}

function parseResponseText(text: string): unknown {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return text;
    }
}

function normaliseClosetList(value: unknown): ClosetRecord[] {
    if (Array.isArray(value)) return value.filter(isRecord);

    if (!isRecord(value)) return [];

    const possibleArrays = [
        value.closet,
        value.items,
        value.value,
        value.results,
        value.data,
    ];

    for (const possibleArray of possibleArrays) {
        if (Array.isArray(possibleArray)) {
            return possibleArray.filter(isRecord);
        }
    }

    return [];
}

function buildClosetGetUrl(baseUrl: string, userId?: number): string {
    const cleanBaseUrl = baseUrl.replace(/\/$/, "");
    return userId !== undefined ? `${cleanBaseUrl}/${userId}` : cleanBaseUrl;
}

function getSavedItemId(record: ClosetRecord): number | undefined {
    return (
        getNumber(record.item) ??
        getNumber(record.itemId) ??
        getNumber(record.itemID) ??
        getNumber(record.productId) ??
        getNumber(record.productID) ??
        getNumber(record.id)
    );
}

function getClosetRecordId(record: ClosetRecord): number | undefined {
    return (
        getNumber(record.closetItemId) ??
        getNumber(record.closetId) ??
        getNumber(record.id)
    );
}

function notLoggedInResponse() {
    return NextResponse.json(
        {
            ok: false,
            stage: "Session check",
            error: "Please log in to use your closet.",
        },
        { status: 401 }
    );
}

async function fetchClosetRecords(
    closetUrl: string,
    token: string,
    userId?: number
): Promise<ClosetRecord[]> {
    const closetGetUrl = buildClosetGetUrl(closetUrl, userId);

    const response = await fetchWithTimeout("Closet duplicate check", closetGetUrl, {
        method: "GET",
        cache: "no-store",
        headers: getAuthHeaders(token),
    });

    const text = await response.text();

    if (!response.ok) {
        throw new Error(
            `Closet duplicate check failed: ${response.status} ${response.statusText}. ${text}`
        );
    }

    return normaliseClosetList(parseResponseText(text));
}

export async function GET(req: NextRequest) {
    try {
        const token = getSessionToken(req);
        if (!token) return notLoggedInResponse();

        const closetUrl = requireEnv(CLOSET_API_URL, "BIRAMY_CLOSET_API_URL");
        const userId = getUserIdFromToken(token);
        const closetGetUrl = buildClosetGetUrl(closetUrl, userId);

        const response = await fetchWithTimeout("Closet GET", closetGetUrl, {
            method: "GET",
            cache: "no-store",
            headers: getAuthHeaders(token),
        });

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Closet GET",
                    error: `Closet API GET failed: ${response.status} ${response.statusText}`,
                    details: text,
                    userId: userId ?? null,
                    urlShapeUsed: userId !== undefined ? "/Closet/{userId}" : "/Closet",
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ok: true,
            source: "logged-in-session",
            userId: userId ?? null,
            closet: parseResponseText(text),
        });
    } catch (error: unknown) {
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
        const token = getSessionToken(req);
        if (!token) return notLoggedInResponse();

        const closetUrl = requireEnv(CLOSET_API_URL, "BIRAMY_CLOSET_API_URL");
        const body = (await req.json()) as SaveClosetBody;

        const item = getNumber(body.item);

        if (item === undefined) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Validate request body",
                    error: "Missing valid item id.",
                },
                { status: 400 }
            );
        }

        const userIdFromToken = getUserIdFromToken(token);
        const userIdFromBody = getNumber(body.user);
        const userId = userIdFromToken ?? userIdFromBody;

        const existingCloset = await fetchClosetRecords(closetUrl, token, userId);
        const duplicate = existingCloset.find(
            (record) => getSavedItemId(record) === item
        );

        if (duplicate) {
            return NextResponse.json({
                ok: true,
                duplicate: true,
                message: "Already in your Closet — no duplicate saved.",
                existing: {
                    closetItemId: getClosetRecordId(duplicate) ?? null,
                    item,
                },
            });
        }

        const payload: Record<string, string | number> = {
            item,
            nickName: getString(body.nickName) ?? "Saved item",
            purchaseDate: getString(body.purchaseDate) ?? new Date().toISOString(),
            rating: getString(body.rating) ?? "5",
        };

        if (userId !== undefined) {
            payload.user = userId;
        }

        console.log("BIRAMY Closet POST payload:", payload);

        const response = await fetchWithTimeout("Closet POST", closetUrl, {
            method: "POST",
            cache: "no-store",
            headers: getAuthHeaders(token),
            body: JSON.stringify(payload),
        });

        const text = await response.text();

        console.log("BIRAMY Closet POST status:", response.status, response.statusText);
        console.log("BIRAMY Closet POST response:", text);

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

        return NextResponse.json({
            ok: true,
            duplicate: false,
            source: "logged-in-session",
            saved: parseResponseText(text),
            sent: payload,
        });
    } catch (error: unknown) {
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

export async function DELETE(req: NextRequest) {
    try {
        const token = getSessionToken(req);
        if (!token) return notLoggedInResponse();

        const closetUrl = requireEnv(CLOSET_API_URL, "BIRAMY_CLOSET_API_URL");
        const { searchParams } = new URL(req.url);

        const closetItemId =
            getNumber(searchParams.get("closetItemId")) ??
            getNumber(searchParams.get("id"));

        if (closetItemId === undefined) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Validate delete request",
                    error: "Missing valid closetItemId.",
                },
                { status: 400 }
            );
        }

        const deleteUrl = `${closetUrl.replace(/\/$/, "")}/${closetItemId}`;

        const response = await fetchWithTimeout("Closet DELETE", deleteUrl, {
            method: "DELETE",
            cache: "no-store",
            headers: getAuthHeaders(token),
        });

        const text = await response.text();

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    stage: "Closet DELETE",
                    error: `Closet API DELETE failed: ${response.status} ${response.statusText}`,
                    details: text,
                    closetItemId,
                },
                { status: 502 }
            );
        }

        return NextResponse.json({
            ok: true,
            source: "logged-in-session",
            deleted: parseResponseText(text),
            closetItemId,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Unknown closet DELETE error";

        console.warn("BIRAMY closet DELETE route failed:", message);

        return NextResponse.json(
            {
                ok: false,
                stage: "Next /api/closet DELETE",
                error: message,
            },
            { status: 500 }
        );
    }
}