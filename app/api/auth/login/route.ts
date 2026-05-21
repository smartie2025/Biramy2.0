import { NextResponse } from "next/server";

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }

    return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
    return typeof value === "string" && value.length > 0 ? value : null;
}

function findToken(data: unknown): string | null {
    const directString = asString(data);

    if (directString) {
        return directString;
    }

    const obj = asRecord(data);

    if (!obj) {
        return null;
    }

    const directToken =
        asString(obj.token) ||
        asString(obj.accessToken) ||
        asString(obj.jwt) ||
        asString(obj.jwtToken) ||
        asString(obj.bearerToken);

    if (directToken) {
        return directToken;
    }

    const dataObj = asRecord(obj.data);
    const resultObj = asRecord(obj.result);

    return (
        asString(dataObj?.token) ||
        asString(dataObj?.accessToken) ||
        asString(resultObj?.token) ||
        asString(resultObj?.accessToken) ||
        null
    );
}

export async function POST(req: Request) {
    try {
        const authUrl = process.env.BIRAMY_AUTH_API_URL;

        if (!authUrl) {
            return NextResponse.json(
                { error: "Missing BIRAMY_AUTH_API_URL in .env.local" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const username = body.username;
        const password = body.password;

        if (!username || !password) {
            return NextResponse.json(
                { error: "Username and password are required." },
                { status: 400 }
            );
        }

        const backendResponse = await fetch(authUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username,
                password,
            }),
            cache: "no-store",
        });

        const responseText = await backendResponse.text();

        let data: unknown;
        try {
            data = JSON.parse(responseText);
        } catch {
            data = responseText;
        }

        if (!backendResponse.ok) {
            return NextResponse.json(
                {
                    error: "Login failed.",
                    details: data,
                },
                { status: backendResponse.status }
            );
        }

        const token = findToken(data);

        if (!token) {
            return NextResponse.json(
                {
                    error: "Login succeeded, but no token was found in the backend response.",
                    backendResponse: data,
                },
                { status: 500 }
            );
        }

        const cleanToken = token.startsWith("Bearer ")
            ? token.replace("Bearer ", "")
            : token;

        const response = NextResponse.json({
            success: true,
            message: "Login successful.",
        });

        response.cookies.set("biramy_session", cleanToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        response.cookies.set("biramy_username", username, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60,
        });

        return response;
    } catch (error) {
        console.error("BIRAMY login error:", error);

        return NextResponse.json(
            { error: "Unexpected login server error." },
            { status: 500 }
        );
    }
}