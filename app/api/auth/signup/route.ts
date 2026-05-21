import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USERS_API_URL = process.env.BIRAMY_USERS_API_URL;

type SignupBody = {
    name?: unknown;
    username?: unknown;
    password?: unknown;
};

function getString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(req: Request) {
    try {
        if (!USERS_API_URL) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Missing BIRAMY_USERS_API_URL in .env.local",
                },
                { status: 500 }
            );
        }

        const body = (await req.json()) as SignupBody;

        const name = getString(body.name);
        const username = getString(body.username);
        const password = getString(body.password);

        if (!name || !username || !password) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Name, username, and password are required.",
                },
                { status: 400 }
            );
        }

        const response = await fetch(USERS_API_URL, {
            method: "POST",
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userID: 0,
                name,
                username,
                password,
                experience: 0,
            }),
        });

        const text = await response.text();

        let data: unknown = null;

        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        if (!response.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: `Signup failed: ${response.status} ${response.statusText}`,
                    details: data,
                },
                { status: response.status }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Galaxy Pass created.",
            user: data,
        });
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : "Unknown signup error.";

        return NextResponse.json(
            {
                ok: false,
                error: message,
            },
            { status: 500 }
        );
    }
}