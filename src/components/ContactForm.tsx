"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const REASON_KEYS = ["reasonOrder", "reasonStatus", "reasonProduct", "reasonPartnership", "reasonOther"] as const;

export default function ContactForm() {
  const t = useTranslations("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const reasonLabel = reason ? t(reason as (typeof REASON_KEYS)[number]) : "";
    if (!name.trim() || !email.trim() || !reason || !message.trim()) {
      setError(t("error"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason: reasonLabel,
          message: message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setSubmitting(false);
      if (res.ok && data.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setReason("");
        setMessage("");
      } else {
        setError(data.error || t("error"));
      }
    } catch {
      setSubmitting(false);
      setError(t("error"));
    }
  };

  const inputClass = "mt-1 w-full rounded-2xl border border-champagne-300 bg-white px-4 py-2.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900";

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-6">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-noir-700">
          {t("name")} *
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-noir-700">
          {t("email")} *
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="contact-reason" className="block text-sm font-medium text-noir-700">
          {t("reason")} *
        </label>
        <select
          id="contact-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className={inputClass}
          required
        >
          <option value="">—</option>
          {REASON_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(key)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-noir-700">
          {t("message")} *
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={inputClass}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{t("success")}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-noir-900 py-3 text-sm font-medium text-white transition hover:bg-noir-800 disabled:opacity-60"
      >
        {submitting ? t("sending") : t("send")}
      </button>
    </form>
  );
}
