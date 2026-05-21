import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUsername(req: NextRequest) {
    return req.cookies.get("biramy_username")?.value ?? null;
}

export async function GET(req: NextRequest) {
    const token = req.cookies.get("biramy_session")?.value ?? null;
    const username = getUsername(req);

    if (!token) {
        return NextResponse.json({
            ok: true,
            loggedIn: false,
            username: null,
        });
    }

    return NextResponse.json({
        ok: true,
        loggedIn: true,
        username,
    });
}