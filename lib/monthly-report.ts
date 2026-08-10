import { getSetting, setSetting, getSiteUrl } from "./queries";
import {
  buildReportData,
  buildReportCsv,
  buildReportPdf,
  type ReportPeriod
} from "./report";
import { sendAdminEmail, type MailAttachment } from "./mail";

/**
 * Automatic monthly performance report.
 *
 * On the 1st of each month (or on demand from the admin panel) this builds the
 * previous calendar month's report — views, comments, top tools — and emails it
 * to the admin as a PDF, CSV or both, via the existing SMTP setup.
 *
 * Sending is guarded:
 *  - the report is only emailed when `monthly_report_enabled` is on,
 *  - it is only emailed once per month (the `monthly_report_last_sent`
 *    setting records the "YYYY-MM" it was last sent for),
 *  - the admin "Send now" button forces a send regardless of both guards.
 */

export interface MonthlyReportConfig {
  enabled: boolean;
  format: "pdf" | "csv" | "both";
  recipient: string; // empty = SMTP notify email
}

export interface MonthlyReportStatus extends MonthlyReportConfig {
  lastSent: string; // "YYYY-MM" or ""
}

export interface MonthlyReportResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  status?: string;
  periodLabel?: string;
  attachments?: string[];
}

const REPORT_FORMATS = ["pdf", "csv", "both"] as const;
type ReportFormat = (typeof REPORT_FORMATS)[number];

function monthKey(d = new Date()): string {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

/** The previous calendar month as a report period (run on the 1st). */
function previousMonthPeriod(now = new Date()): ReportPeriod {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth(); // 0-11
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of previous month
  return {
    startIso: start.toISOString().slice(0, 10),
    endIso: end.toISOString().slice(0, 10),
    label: start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    })
  };
}

export function getMonthlyReportConfig(): MonthlyReportConfig {
  const rawFormat = getSetting("monthly_report_format").trim() as ReportFormat;
  const format: ReportFormat = REPORT_FORMATS.includes(rawFormat)
    ? rawFormat
    : "pdf";
  return {
    enabled: getSetting("monthly_report_enabled") === "1",
    format,
    recipient: getSetting("monthly_report_recipient").trim()
  };
}

export function getMonthlyReportStatus(): MonthlyReportStatus {
  return {
    ...getMonthlyReportConfig(),
    lastSent: getSetting("monthly_report_last_sent")
  };
}

/**
 * Build and email the previous month's performance report.
 *
 * Guards (both can be bypassed with `force`, used by the admin "Send now"):
 *  - disabled in settings      -> skipped
 *  - already sent this month   -> skipped
 * When SMTP isn't ready, sendAdminEmail returns the reason and we surface it.
 */
export async function sendMonthlyReport(
  opts: { force?: boolean } = {}
): Promise<MonthlyReportResult> {
  const cfg = getMonthlyReportConfig();
  if (!cfg.enabled && !opts.force) {
    return {
      sent: false,
      skipped: true,
      reason: "Monthly report is disabled in settings"
    };
  }
  const key = monthKey();
  if (!opts.force && getSetting("monthly_report_last_sent") === key) {
    return {
      sent: false,
      skipped: true,
      reason: "Already sent this month"
    };
  }

  const period = previousMonthPeriod();
  const data = buildReportData(30, undefined, period);

  // Build the attachments per the configured format. The PDF is produced by
  // pdf-lib (lazily imported inside buildReportPdf) — fine in a server route.
  const stamp = `cookchase-report-${period.startIso}-to-${period.endIso}`;
  const attachments: MailAttachment[] = [];
  if (cfg.format === "pdf" || cfg.format === "both") {
    const bytes = await buildReportPdf(data);
    attachments.push({
      filename: `${stamp}.pdf`,
      content: Buffer.from(bytes),
      contentType: "application/pdf"
    });
  }
  if (cfg.format === "csv" || cfg.format === "both") {
    attachments.push({
      filename: `${stamp}.csv`,
      content: buildReportCsv(data),
      contentType: "text/csv; charset=utf-8"
    });
  }

  const top = data.tools[0];
  const siteUrl = getSiteUrl();
  const res = await sendAdminEmail({
    subject: `📊 Monthly performance report — ${period.label}`,
    intro: `Here's how ${data.siteName} performed in ${period.label}. The full breakdown is attached as ${
      attachments.length === 1 ? "a file" : "files"
    }.`,
    rows: [
      { label: "Period", value: period.label },
      { label: "Views", value: data.totals.views_period.toLocaleString() },
      {
        label: "Comments",
        value: data.totals.comments_period.toLocaleString()
      },
      {
        label: "Tools in report",
        value: data.totals.active_tools.toLocaleString()
      },
      {
        label: "Top tool",
        value: top
          ? `${top.name} (${top.views_period.toLocaleString()} views)`
          : "—"
      }
    ],
    to: cfg.recipient || undefined,
    attachments,
    actionHref: `${siteUrl}/admin`,
    actionLabel: "Open the admin dashboard"
  });

  if (res.sent) {
    setSetting("monthly_report_last_sent", key);
  }
  return {
    sent: res.sent,
    status: res.status,
    periodLabel: period.label,
    attachments: attachments.map((a) => a.filename)
  };
}
