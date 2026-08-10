import { NextRequest, NextResponse } from "next/server";
import {
  getAlerts,
  getUnreadAlertCount,
  markAlertRead,
  markAllAlertsRead,
  checkSpikeAlerts,
  pruneOldAlerts
} from "@/lib/queries";
import { isAdminAuthed } from "@/lib/auth";
import { sendSpikeAlertEmail, notifyEnabled } from "@/lib/mail";

export const dynamic = "force-dynamic";

function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  const countOnly = req.nextUrl.searchParams.get("count") === "1";
  // Always sweep first so threshold changes / missed checks are caught and the
  // sidebar badge (?count=1) matches the panel. The sweep is cheap now that
  // settings are read once; it only returns the full list for the panel.
  // Any alert the sweep CREATES is emailed to the admin (fire-and-forget,
  // gated on the notify_spike_alert setting).
  try {
    const created = checkSpikeAlerts();
    pruneOldAlerts(30);
    if (created.length > 0 && notifyEnabled("notify_spike_alert")) {
      for (const alert of created) {
        void sendSpikeAlertEmail(alert).then((r) => {
          if (!r.sent && !r.status.startsWith("SMTP disabled")) {
            console.warn(`[mail] spike-alert notification skipped: ${r.status}`);
          }
        });
      }
    }
  } catch {
    /* never let the sweep fail the list */
  }
  return NextResponse.json({
    alerts: countOnly ? [] : getAlerts(50),
    unread: getUnreadAlertCount()
  });
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthed()) return unauth();
  try {
    const body = await req.json();
    if (body.all) {
      markAllAlertsRead();
    } else if (body.id) {
      markAlertRead(Number(body.id));
    }
    return NextResponse.json({ ok: true, unread: getUnreadAlertCount() });
  } catch {
    return NextResponse.json({ error: "Failed to update alerts" }, { status: 500 });
  }
}
