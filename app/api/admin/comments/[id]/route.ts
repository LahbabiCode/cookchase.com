import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isAdminAuthed } from "@/lib/auth";
import { getCommentDepth } from "@/lib/queries";
import { sendReplyNotification } from "@/lib/mail";
import { MAX_COMMENT_DEPTH } from "@/lib/constants";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface ParentRow {
  id: number;
  page_type: string;
  page_slug: string;
  name: string;
  email: string;
  message: string;
}

/**
 * Best-effort: email the author of the parent comment that their comment got
 * a reply. Never blocks or fails the moderation action — misconfigured SMTP
 * or a missing email is reported, not thrown.
 */
async function notifyParentAuthor(parent: ParentRow, opts: {
  replyName: string;
  replyMessage: string;
  fromAdmin: boolean;
}) {
  const notification = sendReplyNotification({
    parentName: parent.name,
    parentEmail: parent.email,
    replyName: opts.replyName,
    replyMessage: opts.replyMessage,
    pageType: parent.page_type,
    pageSlug: parent.page_slug,
    fromAdmin: opts.fromAdmin
  });
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 8000)
  );
  const result = await Promise.race([notification, timeout]);
  if (result && !result.sent && !result.status.startsWith("SMTP disabled")) {
    if (!result.status.includes("no valid email")) {
      console.warn(`[mail] reply notification skipped: ${result.status}`);
    }
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const id = Number(params.id);
    if (typeof body.approved === "boolean") {
      // Read the row BEFORE updating so we only notify on a real 0→1
      // transition (re-approving an already-approved reply must not re-send
      // the author email).
      const row = getDb()
        .prepare(
          "SELECT id, parent_id, name, message, approved FROM comments WHERE id = ?"
        )
        .get(id) as
        | {
            id: number;
            parent_id: number;
            name: string;
            message: string;
            approved: number;
          }
        | undefined;
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const wasPending = row.approved !== 1;
      const info = getDb()
        .prepare("UPDATE comments SET approved = ? WHERE id = ?")
        .run(body.approved ? 1 : 0, id);
      if (info.changes === 0) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Only on a genuine approval of a visitor reply: email its parent's author.
      if (body.approved && wasPending && row.parent_id > 0) {
        const parent = getDb()
          .prepare(
            "SELECT id, page_type, page_slug, name, email, message FROM comments WHERE id = ?"
          )
          .get(row.parent_id) as ParentRow | undefined;
        if (parent && parent.email) {
          try {
            await notifyParentAuthor(parent, {
              replyName: row.name,
              replyMessage: row.message,
              fromAdmin: false
            });
          } catch {
            /* never fail approval because of email */
          }
        }
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  const db = getDb();
  // Delete the comment AND its whole reply subtree (threads are 3 levels deep
  // now, so a simple parent_id match would orphan grandchild replies).
  const del = db.transaction(() => {
    db.prepare(
      `WITH RECURSIVE subtree(id) AS (
         SELECT ?
         UNION ALL
         SELECT c.id FROM comments c JOIN subtree s ON c.parent_id = s.id
       )
       DELETE FROM comments WHERE id IN (SELECT id FROM subtree)`
    ).run(Number(params.id));
  });
  del();
  return NextResponse.json({ ok: true });
}

/** Admin reply to a comment — creates an approved child comment authored as the site. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    const reply = String(body.reply || "").trim().slice(0, 2000);
    if (reply.length < 2) {
      return NextResponse.json({ error: "Reply is too short" }, { status: 400 });
    }
    const db = getDb();
    const parent = db
      .prepare("SELECT * FROM comments WHERE id = ?")
      .get(Number(params.id)) as
      | {
          id: number;
          page_type: string;
          page_slug: string;
          name: string;
          email: string;
          message: string;
        }
      | undefined;
    if (!parent) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Admin replies respect the same 3-level nesting cap as visitor replies,
    // so the public tree and the admin tree can never disagree on depth.
    if (getCommentDepth(parent.id) >= MAX_COMMENT_DEPTH) {
      return NextResponse.json(
        { error: "Replies are limited to three levels deep." },
        { status: 400 }
      );
    }

    const adminName =
      (db.prepare("SELECT value FROM settings WHERE key = ?").get("site_name") as
        | { value: string }
        | undefined)?.value || "CookChase";
    const info = db
      .prepare(
        `INSERT INTO comments (page_type, page_slug, name, message, approved, parent_id, is_admin)
         VALUES (?, ?, ?, ?, 1, ?, 1)`
      )
      .run(
        parent.page_type,
        parent.page_slug,
        adminName,
        reply,
        Number(params.id)
      );

    // The person who asked the question gets notified the site answered.
    try {
      await notifyParentAuthor(parent, {
        replyName: adminName,
        replyMessage: reply,
        fromAdmin: true
      });
    } catch {
      /* never fail the admin reply because of email */
    }

    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "Failed to reply" }, { status: 500 });
  }
}
