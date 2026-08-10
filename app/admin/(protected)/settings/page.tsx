"use client";

import { useEffect, useState } from "react";
import { Save, Mail, Send } from "lucide-react";

const inputCls =
  "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

interface Settings {
  [key: string]: string;
}

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [reportStatus, setReportStatus] = useState<{ lastSent: string } | null>(null);
  const [reportMsg, setReportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [reportSending, setReportSending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        const s = data || {};
        // System-managed by the monthly report cron — never round-trip it
        // through the form or a normal save would wipe the once-per-month guard.
        delete s.monthly_report_last_sent;
        setSettings(s);
        setLoading(false);
      });
    // When was the monthly report last emailed? (Requires an admin session.)
    fetch("/api/cron/monthly-report?status=1")
      .then((r) => r.json())
      .then((data) => setReportStatus(data || null))
      .catch(() => {});
  }, []);

  const set = (key: string, value: string) => setSettings((s) => ({ ...s, [key]: value }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = async () => {
    setPwMsg("");
    if (pw.next.length < 6) {
      setPwMsg("New password must be at least 6 characters.");
      return;
    }
    if (pw.next !== pw.confirm) {
      setPwMsg("Passwords do not match.");
      return;
    }
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pw)
    });
    const json = await res.json();
    setPwMsg(json.error ? json.error : "Password updated ✓");
    if (json.ok) setPw({ current: "", next: "", confirm: "" });
  };

  const sendReportNow = async () => {
    setReportSending(true);
    setReportMsg(null);
    try {
      // Save the form first so the recipient/format/enabled picks the values
      // the admin just changed.
      const saveRes = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!saveRes.ok) {
        setReportMsg({ ok: false, text: "Could not save the settings before sending." });
        setReportSending(false);
        return;
      }
      const res = await fetch("/api/cron/monthly-report?force=1", {
        method: "POST"
      });
      const json = await res.json();
      if (json.sent) {
        setReportMsg({
          ok: true,
          text: `Report sent ✓ (${json.periodLabel}) — ${json.status}`
        });
        setReportStatus((s) => ({
          lastSent: new Date().toISOString().slice(0, 7)
        }));
      } else if (json.skipped) {
        setReportMsg({ ok: false, text: `Not sent: ${json.reason}` });
      } else {
        setReportMsg({ ok: false, text: json.status || "Could not send the report." });
      }
    } catch {
      setReportMsg({ ok: false, text: "Could not reach the server." });
    }
    setReportSending(false);
  };

  const sendTestEmail = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      // Save the form's current values first so the test uses exactly what the
      // admin just typed — not the previously saved config.
      const saveRes = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!saveRes.ok) {
        setTestMsg({ ok: false, text: "Could not save the settings before testing." });
        setTesting(false);
        return;
      }
      const res = await fetch("/api/admin/settings/test-email");
      const json = await res.json();
      setTestMsg(json.sent ? { ok: true, text: json.status } : { ok: false, text: json.status });
    } catch {
      setTestMsg({ ok: false, text: "Could not reach the server." });
    }
    setTesting(false);
  };

  if (loading) {
    return <div className="animate-pulse p-10 text-center text-sm text-ink-400">Loading…</div>;
  }

  const renderField = (key: string, label: string, hint?: string, textarea = false) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-700">{label}</label>
      {textarea ? (
        <textarea
          className={`${inputCls} min-h-20`}
          value={settings[key] || ""}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          className={inputCls}
          value={settings[key] || ""}
          onChange={(e) => set(key, e.target.value)}
        />
      )}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Settings</h1>
          <p className="mt-1 text-sm text-ink-500">
            Site-wide settings, SEO defaults and security.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {/* General */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            General
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("site_name", "Site name")}
            {renderField("site_tagline", "Tagline")}
            {renderField("site_url", "Site URL", "Used for canonical links, sitemap and structured data")}
            {renderField("site_email", "Contact email")}
            {renderField("site_logo_text", "Logo text")}
          </div>
          <div className="mt-4">
            {renderField("footer_text", "Footer description", undefined, true)}
          </div>
        </section>

        {/* SEO */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            SEO defaults
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("default_meta_title", "Default meta title")}
            {renderField("homepage_meta_title", "Homepage meta title")}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("default_meta_description", "Default meta description", undefined, true)}
            {renderField("homepage_meta_description", "Homepage meta description", undefined, true)}
          </div>
          <div className="mt-4">{renderField("default_keywords", "Default keywords (comma separated)")}</div>
        </section>

        {/* Social */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Social links
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("social_twitter", "Twitter / X URL")}
            {renderField("social_facebook", "Facebook URL")}
            {renderField("social_instagram", "Instagram URL")}
            {renderField("social_pinterest", "Pinterest URL")}
          </div>
        </section>

        {/* Tracking */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Analytics
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("analytics_id", "Google Analytics ID (G-XXXXXXX)", "Optional")}
            {renderField("cookie_notice", "Cookie consent notice text", undefined, true)}
          </div>
        </section>

        {/* Spike alerts */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Spike alerts
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Get notified on the dashboard when a single tool or article crosses
            a daily views or comments threshold within one day — a great early
            signal of what&apos;s working (and what needs moderation). Tools and
            articles have their own thresholds, so a quiet blog can warn sooner
            than busy tools.
          </p>
          <div className="mt-4">
            <label className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-3 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={settings.alerts_enabled === "1"}
                onChange={(e) => set("alerts_enabled", e.target.checked ? "1" : "0")}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Enable spike alerts
            </label>
          </div>
          <div className="mt-2">
            <label className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-3 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={settings.notify_spike_alert === "1"}
                onChange={(e) => set("notify_spike_alert", e.target.checked ? "1" : "0")}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Email me when a spike fires
            </label>
            <p className="mt-1.5 text-xs text-ink-400">
              Sends an email through your SMTP setup whenever a tool or article
              crosses a threshold for the first time that day. Requires email
              sending to be enabled in the section below.
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Tools — views threshold (per day)
              </label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={settings.alert_views_threshold || "200"}
                onChange={(e) => set("alert_views_threshold", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Tools — comments threshold (per day)
              </label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={settings.alert_comments_threshold || "10"}
                onChange={(e) => set("alert_comments_threshold", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Articles — views threshold (per day)
              </label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={settings.alert_article_views_threshold || "100"}
                onChange={(e) => set("alert_article_views_threshold", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Articles — comments threshold (per day)
              </label>
              <input
                type="number"
                min="1"
                className={inputCls}
                value={settings.alert_article_comments_threshold || "5"}
                onChange={(e) => set("alert_article_comments_threshold", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Email notifications (SMTP) */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                Email notifications (SMTP)
              </h2>
              <p className="mt-1 text-xs text-ink-400">
                Get an email when something needs your attention. Works with
                Gmail, SendGrid, Brevo, Mailgun and any SMTP provider.
              </p>
            </div>
            <button
              onClick={sendTestEmail}
              disabled={testing}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {testing ? "Sending…" : "Send test email"}
            </button>
          </div>
          {testMsg && (
            <p
              className={`mt-3 rounded-md px-3 py-2 text-sm ${
                testMsg.ok
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {testMsg.text}
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={settings.smtp_enabled === "1"}
                onChange={(e) => set("smtp_enabled", e.target.checked ? "1" : "0")}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Enable email sending
            </label>
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <Mail className="h-3.5 w-3.5" />
              Sends to: {settings.smtp_to || settings.site_email || "hello@cookchase.com"}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              What to notify about
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={settings.notify_tool_created === "1"}
                  onChange={(e) => set("notify_tool_created", e.target.checked ? "1" : "0")}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                New tools
              </label>
              <label className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={settings.notify_content_edited === "1"}
                  onChange={(e) => set("notify_content_edited", e.target.checked ? "1" : "0")}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Content edits
              </label>
              <label className="flex items-center gap-2 rounded-md border border-ink-200 bg-white px-3 py-2.5 text-sm font-medium text-ink-700">
                <input
                  type="checkbox"
                  checked={settings.notify_contact === "1"}
                  onChange={(e) => set("notify_contact", e.target.checked ? "1" : "0")}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Contact messages
              </label>
            </div>
            <p className="mt-2.5 text-xs text-ink-400">
              Email me when a tool or article is created or edited, and when a
              message arrives through the contact form. Comment notifications
              always send while email sending is on.
            </p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {renderField("smtp_host", "SMTP host", "e.g. smtp.gmail.com or smtp.sendgrid.net")}
            <div className="grid grid-cols-2 gap-3">
              {renderField("smtp_port", "Port", "587 (STARTTLS) or 465 (SSL)")}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-700">
                  <input
                    type="checkbox"
                    checked={settings.smtp_secure === "1"}
                    onChange={(e) => set("smtp_secure", e.target.checked ? "1" : "0")}
                    className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  SSL/TLS
                </label>
                <p className="text-xs text-ink-400">Check for port 465</p>
              </div>
            </div>
            {renderField("smtp_user", "Username", "Full address for Gmail, API key for SendGrid")}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Password / API key</label>
              <input
                type="password"
                className={inputCls}
                value={settings.smtp_pass || ""}
                onChange={(e) => set("smtp_pass", e.target.value)}
                autoComplete="new-password"
              />
              <p className="mt-1 text-xs text-ink-400">
                Gmail needs an App Password, not your normal password.
              </p>
            </div>
            {renderField("smtp_from", "From email", "Shown as the sender")}
            {renderField("smtp_from_name", "From name", "e.g. CookChase Notifications")}
            {renderField("smtp_to", "Notify email", "Where notifications are sent — defaults to Contact email")}
          </div>
          <p className="mt-4 text-xs text-ink-400">
            Tip: for <strong>Gmail</strong>, enable 2-Step Verification and create an{" "}
            <strong>App Password</strong>. For <strong>SendGrid</strong>, use port 587 with
            username <code className="rounded bg-ink-100 px-1 py-0.5">apikey</code> and your
            API key as the password.
          </p>
        </section>

        {/* Monthly report */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
                Monthly report email
              </h2>
              <p className="mt-1 text-xs text-ink-400">
                On the 1st of each month CookChase emails you the previous
                month&apos;s performance — views, comments and top tools — as a
                PDF, CSV or both, through your SMTP setup. Sends automatically
                once per month; the button below forces a copy anytime.
              </p>
            </div>
            <button
              onClick={sendReportNow}
              disabled={reportSending}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-60"
            >
              <Send className="h-3.5 w-3.5" />
              {reportSending ? "Sending…" : "Send now"}
            </button>
          </div>
          {reportMsg && (
            <p
              className={`mt-3 rounded-md px-3 py-2 text-sm ${
                reportMsg.ok
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {reportMsg.text}
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-3 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={settings.monthly_report_enabled === "1"}
                onChange={(e) =>
                  set("monthly_report_enabled", e.target.checked ? "1" : "0")
                }
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Enable monthly report
            </label>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">
                Format
              </label>
              <select
                className={inputCls}
                value={settings.monthly_report_format || "pdf"}
                onChange={(e) => set("monthly_report_format", e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
                <option value="both">PDF + CSV</option>
              </select>
            </div>
            <div>
              {renderField(
                "monthly_report_recipient",
                "Recipient",
                "Leave empty to use the SMTP notify email above"
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Last sent: {reportStatus?.lastSent || "never"}
          </p>
        </section>

        {/* Security */}
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">
            Security — change admin password
          </h2>
          <p className="mt-1 text-xs text-ink-400">
            Default login is <code className="rounded bg-ink-100 px-1 py-0.5">admin</code> /{" "}
            <code className="rounded bg-ink-100 px-1 py-0.5">admin1234</code>. Change it
            before going live.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Current password</label>
              <input
                type="password"
                className={inputCls}
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">New password</label>
              <input
                type="password"
                className={inputCls}
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700">Confirm new password</label>
              <input
                type="password"
                className={inputCls}
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
          </div>
          {pwMsg && <p className="mt-2 text-sm text-ink-600">{pwMsg}</p>}
          <button
            onClick={changePassword}
            className="mt-3 rounded-md border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-ink-300 hover:bg-ink-50"
          >
            Update password
          </button>
        </section>
      </div>
    </div>
  );
}
