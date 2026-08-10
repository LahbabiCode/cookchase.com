import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentAccountId } from "@/lib/account-auth";
import { sanitizeRows, clampStr } from "@/lib/history-utils";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Sign in required" }, { status: 401 });
}

/**
 * GET — the signed-in user's saved results, newest first.
 * POST — save a calculation result to history (free for every signed-in
 *   account — result history is included for everyone, no subscription).
 * DELETE — clear the whole history.
 */
export async function GET() {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  const rows = getDb()
    .prepare(
      `SELECT id, account_id, tool_slug, tool_name, title, rows, created_at
       FROM result_history WHERE account_id = ?
       ORDER BY created_at DESC, id DESC LIMIT 60`
    )
    .all(accountId) as {
    id: number;
    account_id: number;
    tool_slug: string;
    tool_name: string;
    title: string;
    rows: string;
    created_at: string;
  }[];
  const results = rows.map((r) => {
    let parsed: unknown[] = [];
    try {
      const j = JSON.parse(r.rows);
      if (Array.isArray(j)) parsed = j;
    } catch {
      /* tolerate corrupt rows */
    }
    return {
      id: r.id,
      tool_slug: r.tool_slug,
      tool_name: r.tool_name,
      title: r.title,
      rows: parsed,
      created_at: r.created_at
    };
  });
  return NextResponse.json({ results });
}

export async function POST(req: NextRequest) {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();

  try {
    const body = await req.json();
    const rows = sanitizeRows(body.rows);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
    }
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO result_history (account_id, tool_slug, tool_name, title, rows)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(
        accountId,
        clampStr(body.toolSlug, 120),
        clampStr(body.toolName, 160),
        clampStr(body.title, 200),
        JSON.stringify(rows)
      );
    // Keep each account's history bounded: delete rows beyond the newest 60
    // (the same limit the GET read applies), so one account can't bloat the
    // table indefinitely.
    db.prepare(
      `DELETE FROM result_history WHERE account_id = ? AND id NOT IN (
         SELECT id FROM result_history WHERE account_id = ?
         ORDER BY created_at DESC, id DESC LIMIT 60
       )`
    ).run(accountId, accountId);
    const id = Number(info.lastInsertRowid);
    const row = db
      .prepare(
        `SELECT id, tool_slug, tool_name, title, rows, created_at
         FROM result_history WHERE id = ?`
      )
      .get(id) as {
      id: number;
      tool_slug: string;
      tool_name: string;
      title: string;
      rows: string;
      created_at: string;
    };
    return NextResponse.json({
      result: {
        id: row.id,
        tool_slug: row.tool_slug,
        tool_name: row.tool_name,
        title: row.title,
        rows: JSON.parse(row.rows),
        created_at: row.created_at
      }
    });
  } catch {
    return NextResponse.json({ error: "Could not save the result" }, { status: 500 });
  }
}

export async function DELETE() {
  const accountId = getCurrentAccountId();
  if (!accountId) return unauth();
  getDb().prepare("DELETE FROM result_history WHERE account_id = ?").run(accountId);
  return NextResponse.json({ ok: true });
}
