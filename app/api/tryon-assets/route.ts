import fs from "fs";
import path from "path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // IMPORTANT: fs requires Node runtime

const BASE_PUBLIC_DIR = path.join(process.cwd(), "public", "assets", "tryon", "overlays");
const BASE_PUBLIC_URL = "/assets/tryon/overlays";

const VALID_EXT = new Set([".png", ".jpg", ".jpeg", ".webp"]);

function prettifyName(filenameNoExt: string) {
    // earrings-1 -> Earrings 1
    return filenameNoExt
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());
}

function safeReadDir(dir: string): string[] {
    try {
        return fs.readdirSync(dir);
    } catch {
        return [];
    }
}

function listCategory(category: string) {
    const catDir = path.join(BASE_PUBLIC_DIR, category);
    const files = safeReadDir(catDir);

    return files
        .filter((f) => VALID_EXT.has(path.extname(f).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        .map((file) => {
            const ext = path.extname(file);
            const base = path.basename(file, ext);

            return {
                id: `${category}-${base}`, // unique
                name: prettifyName(base),
                src: `${BASE_PUBLIC_URL}/${category}/${file}`,
                thumb: `${BASE_PUBLIC_URL}/${category}/${file}`, // optional; same image for now
            };
        });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") || "").trim().toLowerCase();

    // If a category is provided, return only that category
    if (category) {
        const items = listCategory(category);

        return Response.json(
            {
                ok: true,
                source: "public-folder-scan",
                overlays: { [category]: items },
            },
            { headers: { "Cache-Control": "no-store" } } // keep dev behavior deterministic
        );
    }

    // If no category, scan ALL subfolders in /public/assets/tryon/overlays
    const subfolders = safeReadDir(BASE_PUBLIC_DIR).filter((name) => {
        const full = path.join(BASE_PUBLIC_DIR, name);
        try {
            return fs.statSync(full).isDirectory();
        } catch {
            return false;
        }
    });

    const overlays: Record<string, any[]> = {};
    for (const folder of subfolders) {
        overlays[folder] = listCategory(folder);
    }

    return Response.json(
        {
            ok: true,
            source: "public-folder-scan",
            overlays,
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}