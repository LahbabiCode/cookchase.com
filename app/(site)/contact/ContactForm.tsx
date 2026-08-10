"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";

export default function ContactForm({ email }: { email: string }) {
  const { lang } = useLang();
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // hidden honeypot field
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: from, subject, message, website })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({
          ok: true,
          text: t(lang, "contact.sentOk")
        });
        setName("");
        setFrom("");
        setSubject("");
        setMessage("");
      } else {
        setStatus({
          ok: false,
          text: json.error || t(lang, "contact.sendFailed")
        });
      }
    } catch {
      setStatus({
        ok: false,
        text: t(lang, "contact.networkError")
      });
    }
    setSending(false);
  };

  const inputCls =
    "w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-300 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      {/* Honeypot — hidden from humans, bots fill it and get silently dropped */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">{t(lang, "contact.yourName")}</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">{t(lang, "contact.yourEmail")}</label>
          <input type="email" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">{t(lang, "contact.subject")}</label>
        <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t(lang, "contact.subjectPlaceholder")} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">{t(lang, "contact.message")}</label>
        <textarea className={`${inputCls} min-h-32`} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </div>
      {status && (
        <p
          className={`flex items-start gap-2 rounded-md px-3 py-2 text-sm ${
            status.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
          }`}
        >
          {status.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{status.text}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {sending ? t(lang, "contact.sending") : t(lang, "contact.sendMessage")}
        </button>
        <span className="text-xs text-ink-400">
          {t(lang, "contact.writeTo", { email: "" }).replace("{email}", "")}
          <a href={`mailto:${email}`} className="text-brand-600 underline underline-offset-2">
            {email}
          </a>
        </span>
      </div>
    </form>
  );
}
