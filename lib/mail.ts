import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import {
  getSetting,
  getSiteUrl,
  getToolBySlug,
  getArticleBySlug,
  type NewAlert
} from "./queries";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string; // "Name <email>"
  to: string; // notification recipient (falls back to site_email)
}

/** An email attachment, forwarded straight to nodemailer. */
export interface MailAttachment {
  filename: string;
  // nodemailer accepts string | Buffer | Readable — callers convert PDF bytes
  // (Uint8Array) to Buffer before attaching.
  content: string | Buffer;
  contentType?: string;
}

/**
 * SMTP configuration, resolved with this priority:
 *   1. Environment variables (SMTP_*) — ideal for Docker/VPS deployments
 *   2. Admin panel settings (smtp_*) — editable at runtime
 */
export function getSmtpConfig(): SmtpConfig {
  const env = (k: string, fallback = "") =>
    (process.env[k] || fallback).trim();

  const host = env("SMTP_HOST", getSetting("smtp_host"));
  const portStr = env("SMTP_PORT", getSetting("smtp_port")) || "587";
  const user = env("SMTP_USER", getSetting("smtp_user"));
  const pass = env("SMTP_PASS", getSetting("smtp_pass"));
  const fromEmail = env("SMTP_FROM", getSetting("smtp_from"));
  const fromName = env("SMTP_FROM_NAME", getSetting("smtp_from_name"));
  const to = env("SMTP_TO", getSetting("smtp_to"));
  const enabledRaw =
    env("SMTP_ENABLED", getSetting("smtp_enabled")) || "0";

  const siteName = getSetting("site_name") || "CookChase";
  const fallbackFrom = getSetting("site_email") || "hello@cookchase.com";

  return {
    enabled: enabledRaw === "1",
    host,
    port: parseInt(portStr, 10) || 587,
    secure: (env("SMTP_SECURE", getSetting("smtp_secure")) || "0") === "1",
    user,
    pass,
    from: fromEmail ? `${fromName || siteName} <${fromEmail}>` : `${siteName} <${fallbackFrom}>`,
    to: to || getSetting("site_email") || "hello@cookchase.com"
  };
}

/** Returns true when SMTP is enabled AND configured enough to send. */
export function isSmtpReady(cfg: SmtpConfig = getSmtpConfig()): boolean {
  return cfg.enabled && Boolean(cfg.host) && Boolean(cfg.from) && Boolean(cfg.to);
}

function buildTransporter(cfg: SmtpConfig): Transporter {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000
  });
}

/**
 * Send the admin a notification when a new comment (or a reply to a comment)
 * awaits moderation. Never throws — callers (the public comments API) must not
 * fail because email is misconfigured. Returns a human-readable status string.
 */
export async function sendNewCommentNotification(opts: {
  name: string;
  message: string;
  pageType: string;
  pageSlug: string;
  isReply?: boolean;
  parentName?: string;
}): Promise<{ sent: boolean; status: string }> {
  let cfg: SmtpConfig;
  try {
    cfg = getSmtpConfig();
  } catch {
    return { sent: false, status: "SMTP config unavailable" };
  }
  if (!isSmtpReady(cfg)) {
    return { sent: false, status: "SMTP disabled or not configured" };
  }

  const siteName = getSetting("site_name") || "CookChase";
  const siteUrl = getSiteUrl();
  const { pageType, pageSlug, name, message, isReply, parentName } = opts;

  const pageHref =
    pageType === "article"
      ? `${siteUrl}/blog/${pageSlug}`
      : pageType === "page"
        ? pageSlug === "home"
          ? `${siteUrl}/`
          : `${siteUrl}/${pageSlug}`
        : `${siteUrl}/tools/${pageSlug}`;

  const preview = message.length > 300 ? `${message.slice(0, 300)}…` : message;
  const subject = isReply
    ? `💬 New reply on ${siteName} awaits moderation`
    : `💬 New comment on ${siteName} awaits moderation`;
  const intro = isReply
    ? `A new reply is waiting for your approval on ${siteName}.`
    : `A new comment is waiting for your approval on ${siteName}.`;

  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: cfg.from,
      to: cfg.to,
      replyTo: cfg.from,
      subject,
      text: [
        intro,
        "",
        `From: ${name}`,
        ...(isReply && parentName
          ? [`In reply to: ${parentName}`, ""]
          : [""]),
        `Page: ${pageHref}`,
        "",
        preview,
        "",
        `Review it here: ${siteUrl}/admin/comments`
      ].join("\n"),
      html: [
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">`,
        `<h2 style="margin:0 0 4px">${isReply ? "💬 New reply awaiting moderation" : "💬 New comment awaiting moderation"}</h2>`,
        `<p style="color:#6b7280;margin:0 0 20px">${siteName} · <a href="${siteUrl}/admin/comments" style="color:#d97706">Review in the admin panel</a></p>`,
        `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">`,
        `<tr><td style="padding:6px 0;color:#6b7280;width:70px;font-size:14px">From</td><td style="padding:6px 0;font-size:14px"><strong>${escapeHtml(name)}</strong></td></tr>`,
        ...(isReply && parentName
          ? [`<tr><td style="padding:6px 0;color:#6b7280;width:70px;font-size:14px">In reply to</td><td style="padding:6px 0;font-size:14px"><strong>${escapeHtml(parentName)}</strong></td></tr>`]
          : []),
        `<tr><td style="padding:6px 0;color:#6b7280;width:70px;font-size:14px">Page</td><td style="padding:6px 0;font-size:14px"><a href="${pageHref}" style="color:#d97706">${escapeHtml(pageHref)}</a></td></tr>`,
        `</table>`,
        `<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(preview)}</div>`,
        `</div>`
      ].join("")
    });
    return { sent: true, status: "Notification sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, status: `Failed to send email: ${msg}` };
  }
}

/**
 * Notify the author of a comment that their comment received a reply.
 * Sent when the admin approves a visitor reply, or when the admin posts a
 * reply themselves. Never throws — the approval flow must never fail because
 * email is misconfigured.
 */
export async function sendReplyNotification(opts: {
  parentName: string;
  parentEmail: string;
  replyName: string;
  replyMessage: string;
  pageType: string;
  pageSlug: string;
  fromAdmin?: boolean;
}): Promise<{ sent: boolean; status: string }> {
  let cfg: SmtpConfig;
  try {
    cfg = getSmtpConfig();
  } catch {
    return { sent: false, status: "SMTP config unavailable" };
  }
  if (!isSmtpReady(cfg)) {
    return { sent: false, status: "SMTP disabled or not configured" };
  }
  if (!opts.parentEmail || !EMAIL_RE.test(opts.parentEmail)) {
    return { sent: false, status: "Parent comment has no valid email" };
  }

  const siteName = getSetting("site_name") || "CookChase";
  const siteUrl = getSiteUrl();
  const { parentName, replyName, replyMessage, pageType, pageSlug, fromAdmin } = opts;

  const pageHref =
    pageType === "article"
      ? `${siteUrl}/blog/${pageSlug}`
      : pageType === "page"
        ? pageSlug === "home"
          ? `${siteUrl}/`
          : `${siteUrl}/${pageSlug}`
        : `${siteUrl}/tools/${pageSlug}`;

  const preview =
    replyMessage.length > 300 ? `${replyMessage.slice(0, 300)}…` : replyMessage;

  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: cfg.from,
      to: opts.parentEmail,
      replyTo: cfg.from,
      subject: `💬 ${fromAdmin ? siteName : replyName} replied to your comment on ${siteName}`,
      text: [
        `Hi ${parentName},`,
        "",
        `${fromAdmin ? siteName : replyName} replied to your comment on ${siteName}.`,
        "",
        preview,
        "",
        `Read the full thread here: ${pageHref}`,
        "",
        "You're receiving this because you left your email with a comment on CookChase."
      ].join("\n"),
      html: [
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">`,
        `<h2 style="margin:0 0 4px">Hi ${escapeHtml(parentName)},</h2>`,
        `<p style="color:#6b7280;margin:0 0 16px">${fromAdmin ? escapeHtml(siteName) : escapeHtml(replyName)} replied to your comment on <strong>${escapeHtml(siteName)}</strong>.</p>`,
        `<div style="background:#f6f4ed;border:1px solid #e4e0d5;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(preview)}</div>`,
        `<p style="margin:16px 0 0"><a href="${pageHref}" style="display:inline-block;background:#b5651d;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">Read the full thread</a></p>`,
        `<p style="color:#9ca3af;font-size:12px;margin:20px 0 0">You're receiving this because you left your email with a comment on ${escapeHtml(siteName)}.</p>`,
        `</div>`
      ].join("")
    });
    return { sent: true, status: "Notification sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, status: `Failed to send email: ${msg}` };
  }
}

/**
 * Password reset email — sent to a visitor who requested a reset link. Never
 * throws; returns a status string so the API can decide how honest to be with
 * the visitor (we deliberately stay vague about whether an account exists).
 */
export async function sendPasswordResetEmail(opts: {
  email: string;
  resetUrl: string;
}): Promise<{ sent: boolean; status: string }> {
  let cfg: SmtpConfig;
  try {
    cfg = getSmtpConfig();
  } catch {
    return { sent: false, status: "SMTP config unavailable" };
  }
  if (!isSmtpReady(cfg)) {
    return { sent: false, status: "SMTP disabled or not configured" };
  }
  if (!EMAIL_RE.test(opts.email)) {
    return { sent: false, status: "Invalid email" };
  }
  const siteName = getSetting("site_name") || "CookChase";
  const { email, resetUrl } = opts;
  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: cfg.from,
      to: email,
      replyTo: cfg.from,
      subject: `🔑 Reset your ${siteName} password`,
      text: [
        `We received a request to reset the password for your ${siteName} account.`,
        "",
        `Tap the link below to choose a new password. It expires in 1 hour:`,
        resetUrl,
        "",
        "If you didn't request this, you can safely ignore this email — your password won't change.",
        "",
        `— The ${siteName} team`
      ].join("\n"),
      html: [
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">`,
        `<h2 style="margin:0 0 4px">Reset your ${escapeHtml(siteName)} password</h2>`,
        `<p style="color:#6b7280;margin:0 0 20px">We received a request to reset the password for your account.</p>`,
        `<p style="margin:0 0 16px;font-size:14px">Tap the button below to choose a new password. The link is single-use and expires in <strong>1 hour</strong>.</p>`,
        `<p style="margin:0 0 24px"><a href="${resetUrl}" style="display:inline-block;background:#b5651d;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:bold">Choose a new password</a></p>`,
        `<p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0 0 8px">If the button doesn't work, copy and paste this link into your browser:</p>`,
        `<p style="color:#6b7280;font-size:12px;word-break:break-all;margin:0">${escapeHtml(resetUrl)}</p>`,
        `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px" />`,
        `<p style="color:#9ca3af;font-size:12px;line-height:1.6;margin:0">If you didn't request a password reset, you can safely ignore this email — your password won't change. Questions? Reply to this email and we'll help.</p>`,
        `</div>`
      ].join("")
    });
    return { sent: true, status: "Reset email sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, status: `Failed to send email: ${msg}` };
  }
}

/**
 * Generic admin notification email — used for tool created, content edited and
 * contact-message events. Each caller checks its own enable/disable setting
 * (e.g. notify_tool_created) before calling. Never throws.
 */
export async function sendAdminEmail(opts: {
  subject: string;
  intro: string;
  rows: { label: string; value: string }[];
  preview?: string;
  actionHref: string;
  actionLabel: string;
  /** Override the default notify recipient (used by the monthly report). */
  to?: string;
  /** Attachments to include (e.g. a PDF or CSV report file). */
  attachments?: MailAttachment[];
}): Promise<{ sent: boolean; status: string }> {
  let cfg: SmtpConfig;
  try {
    cfg = getSmtpConfig();
  } catch {
    return { sent: false, status: "SMTP config unavailable" };
  }
  if (!isSmtpReady(cfg)) {
    return { sent: false, status: "SMTP disabled or not configured" };
  }
  const siteName = getSetting("site_name") || "CookChase";
  const { subject, intro, rows, preview, actionHref, actionLabel, to, attachments } = opts;
  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: cfg.from,
      to: to ?? cfg.to,
      replyTo: cfg.from,
      ...(attachments && attachments.length
        ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: a.content,
              ...(a.contentType ? { contentType: a.contentType } : {})
            }))
          }
        : {}),
      subject: `${subject} · ${siteName}`,
      text: [
        intro,
        "",
        ...rows.map((r) => `${r.label}: ${r.value}`),
        ...(preview ? ["", preview] : []),
        "",
        `${actionLabel}: ${actionHref}`
      ].join("\n"),
      html: [
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">`,
        `<h2 style="margin:0 0 4px">${escapeHtml(subject)}</h2>`,
        `<p style="color:#6b7280;margin:0 0 20px">${siteName}</p>`,
        `<table style="width:100%;border-collapse:collapse;margin-bottom:16px">`,
        ...rows.map(
          (r) =>
            `<tr><td style="padding:6px 0;color:#6b7280;width:110px;font-size:14px;vertical-align:top">${escapeHtml(r.label)}</td><td style="padding:6px 0;font-size:14px"><strong>${escapeHtml(r.value)}</strong></td></tr>`
        ),
        `</table>`,
        ...(preview
          ? [
              `<div style="background:#f6f4ed;border:1px solid #e4e0d5;border-radius:8px;padding:12px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(preview)}</div>`
            ]
          : []),
        `<p style="margin:16px 0 0"><a href="${actionHref}" style="display:inline-block;background:#b5651d;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px">${escapeHtml(actionLabel)}</a></p>`,
        `</div>`
      ].join("")
    });
    return { sent: true, status: "Notification sent" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, status: `Failed to send email: ${msg}` };
  }
}

/**
 * Email the admin when a spike alert is FIRST created (a tool or article
 * crossed its daily views/comments threshold). Callers gate this on the
 * notify_spike_alert setting; the alert functions themselves stay synchronous
 * and return the newly-created alerts so this can be fired from the async
 * API routes (queries.ts must not import mail.ts — circular dependency).
 *
 * Reuses sendAdminEmail, which never throws.
 */
export async function sendSpikeAlertEmail(opts: NewAlert): Promise<{ sent: boolean; status: string }> {
  const siteUrl = getSiteUrl();
  const { pageType, slug, metric, value, threshold } = opts;
  const metricLabel = metric === "views" ? "views" : "comments";
  const typeLabel = pageType === "article" ? "blog article" : "tool";

  // Resolve the human-readable page name (articles/tools share slugs across
  // tables, so look up by page type).
  let displayName = slug;
  if (pageType === "article") {
    const a = getArticleBySlug(slug);
    if (a) displayName = a.title;
  } else {
    const t = getToolBySlug(slug);
    if (t) displayName = t.name;
  }
  const pageHref =
    pageType === "article"
      ? `${siteUrl}/blog/${slug}`
      : `${siteUrl}/tools/${slug}`;

  return sendAdminEmail({
    subject: `📈 Spike alert: ${displayName} hit ${value.toLocaleString()} ${metricLabel}`,
    intro: `A ${typeLabel} crossed its daily ${metricLabel} threshold on ${siteUrl.replace(/^https?:\/\//, "")}.`,
    rows: [
      { label: "Page", value: displayName },
      { label: "Type", value: typeLabel === "blog article" ? "Article" : "Tool" },
      { label: "Metric", value: metricLabel },
      { label: `${metricLabel} today`, value: value.toLocaleString() },
      { label: "Threshold", value: threshold.toLocaleString() },
      { label: "Link", value: pageHref }
    ],
    actionHref: `${siteUrl}/admin`,
    actionLabel: "Open the dashboard"
  });
}

/**
 * True when an admin-notification type is enabled (setting stored as "1").
 * Callers use this to decide whether to send before doing any work.
 */
export function notifyEnabled(key: string): boolean {
  return getSetting(key) === "1";
}

/** Send a test email from the admin settings panel. */
export async function sendTestEmail(): Promise<{ sent: boolean; status: string }> {
  let cfg: SmtpConfig;
  try {
    cfg = getSmtpConfig();
  } catch {
    return { sent: false, status: "SMTP config unavailable" };
  }
  if (!isSmtpReady(cfg)) {
    return { sent: false, status: "SMTP disabled or not configured" };
  }
  const siteName = getSetting("site_name") || "CookChase";
  try {
    const transporter = buildTransporter(cfg);
    await transporter.sendMail({
      from: cfg.from,
      to: cfg.to,
      replyTo: cfg.from,
      subject: `✅ SMTP test from ${siteName}`,
      text: "This is a test email from your CookChase admin panel. If you can read this, SMTP is configured correctly.",
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937"><h2>✅ SMTP test email</h2><p>This is a test email from your <strong>${escapeHtml(siteName)}</strong> admin panel. If you can read this, SMTP is configured correctly.</p></div>`
    });
    return { sent: true, status: "Test email sent ✓" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { sent: false, status: `Test failed: ${msg}` };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
