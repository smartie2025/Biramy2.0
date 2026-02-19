import { NextResponse } from "next/server";
import { getDb } from "@/app/lib/db"; 

export async function GET() {
  try {
    const db = await getDb();


    const result = await db.request().query(`
    SELECT
      i.ItemID      AS id,
      RTRIM(i.Name) AS name,
      RTRIM(c.Name) AS category,
      RTRIM(i.ImageURL) AS imageUrl
    FROM dbo.Items i
    INNER JOIN dbo.ItemCategory c
      ON i.CategoryID = c.CategoryID
    ORDER BY c.Name, i.Name;
  `);

return NextResponse.json({ ok: true, assets: result.recordset });

// return NextResponse.json({ ok: true, tables: result.recordset });
  } catch (err: any) {
    console.error("API /api/assets error:", err);
    return NextResponse.json(
      { ok: false, name: err?.name, code: err?.code, message: err?.message },
      { status: 500 }
    );
  }
}

