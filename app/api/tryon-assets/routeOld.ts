
import { NextResponse } from "next/server";
import sql from "mssql";

export const runtime = "nodejs"; // IMPORTANT: mssql needs Node runtime (not Edge)

const config: sql.config = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASSWORD,
    server: process.env.AZURE_SQL_SERVER!, // e.g. "myserver.database.windows.net"
    database: process.env.AZURE_SQL_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
};

type TryOnAssetRow = {
    id: number;
    name: string;
    category: string; // "glasses" | "earrings" etc
    modelUrl: string;
    thumbnailUrl: string;
    anchor: string | null; // optional metadata
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category"); // optional filter

    let pool: sql.ConnectionPool | undefined;

    try {
        pool = await sql.connect(config);

        // Parameterized query to avoid injection
        const request = pool.request();
        let query = `
      SELECT
        Id as id,
        Name as name,
        Category as category,
        ModelUrl as modelUrl,
        ThumbnailUrl as thumbnailUrl,
        Anchor as anchor
      FROM dbo.TryOnAssets
    `;

        if (category) {
            query += " WHERE Category = @category";
            request.input("category", sql.NVarChar, category);
        }

        query += " ORDER BY Name ASC";

        const result = await request.query<TryOnAssetRow>(query);

        return NextResponse.json({ ok: true, assets: result.recordset });
    } catch (err) {
        console.error("API /tryon-assets error:", err);
        return NextResponse.json(
            { ok: false, error: "Failed to fetch assets" },
            { status: 500 }
        );
    } finally {
        // close pool to avoid exhausting connections in dev
        // in production you might keep a global pool (we can do that later)
        try {
            await pool?.close();
        } catch { }
    }
}