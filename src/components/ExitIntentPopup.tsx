"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "sav_exit_intent_dismissed_v1";

export default function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return;

    const isMobile = window.innerWidth < 768;
    let timeoutId: number | undefined;

    const handleExit = (e: MouseEvent) => {
      if (e.clientY <= 0 || e.clientY < 10) {
        window.removeEventListener("mousemove", handleExit);
        setOpen(true);
      }
    };

    if (isMobile) {
      timeoutId = window.setTimeout(() => setOpen(true), 30000);
    } else {
      window.addEventListener("mousemove", handleExit);
    }

    return () => {
      if (!isMobile) {
        window.removeEventListener("mousemove", handleExit);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const close = () => {
    setOpen(false);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value, source: "exit-intent" }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, "1");
      setTimeout(() => setOpen(false), 1200);
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-900/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-3xl bg-white px-6 py-7 shadow-2xl sm:px-8">
        <button
          type="button"
          onClick={close}
          className="ml-auto block text-sm text-noir-400 hover:text-noir-700"
        >
          ×
        </button>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-noir-500">
          Exclusive welcome
        </p>
        <h2 className="mt-2 font-display text-2xl font-light tracking-tight text-noir-900">
          Enjoy <span className="font-semibold">10% OFF</span> your first order
        </h2>
        <p className="mt-3 text-sm text-noir-600">
          Enter your email to receive the <span className="font-semibold">WELCOME10</span> code and be the first to
          know about new drops.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-champagne-300 px-4 py-3 text-sm text-noir-900 placeholder:text-noir-400 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-full bg-noir-900 py-3 text-sm font-medium uppercase tracking-[0.18em] text-champagne-50 transition hover:bg-noir-800 disabled:opacity-60"
          >
            {status === "loading" ? "Sending..." : "Get my 10% off"}
          </button>
          {status === "done" && (
            <p className="text-xs text-green-700">Check your inbox for the code WELCOME10.</p>
          )}
          {status === "error" && (
            <p className="text-xs text-red-600">Please enter a valid email.</p>
          )}
        </form>
        <p className="mt-3 text-[11px] text-noir-400">
          We respect your privacy. No spam, only curated jewelry updates.
        </p>
      </div>
    </div>
  );
}

