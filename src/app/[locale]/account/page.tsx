"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Package, Check, Circle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type OrderStatus = "received" | "payment_approved" | "shipped";

const STEPS: { key: OrderStatus; labelKey: "orderReceived" | "paymentApproved" | "shipped" }[] = [
  { key: "received", labelKey: "orderReceived" },
  { key: "payment_approved", labelKey: "paymentApproved" },
  { key: "shipped", labelKey: "shipped" },
];

function OrderStatusTracker({ status }: { status: OrderStatus }) {
  const t = useTranslations("account");
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center justify-between gap-2">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {i > 0 && <div className={`h-0.5 flex-1 ${i <= currentIndex ? "bg-noir-900" : "bg-champagne-300"}`} />}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  done ? "border-noir-900 bg-noir-900 text-white" : "border-champagne-300 bg-section text-noir-500"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </div>
              {!isLast && <div className={`h-0.5 flex-1 ${i < currentIndex ? "bg-noir-900" : "bg-champagne-300"}`} />}
            </div>
            <p className={`mt-2 text-center text-xs font-medium ${done ? "text-noir-900" : "text-noir-500"}`}>
              {t(step.labelKey)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function AccountPage() {
  const t = useTranslations("account");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"signup" | "login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || undefined,
          last_name: lastName || undefined,
          date_of_birth: dateOfBirth || undefined,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthSuccess(t("signUpSuccess"));
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
    setDateOfBirth("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setAuthError(t("authError"));
      return;
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!email.trim()) {
      setAuthError(t("email") + " required");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}` : undefined,
    });
    setSubmitting(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthSuccess(t("resetEmailSent"));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (newPassword !== confirmPassword) {
      setAuthError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? "",
      password: currentPassword,
    });
    if (signInError) {
      setSubmitting(false);
      setAuthError("Current password is incorrect.");
      return;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setSubmitting(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    if (updateError) {
      setAuthError(updateError.message);
      return;
    }
    setAuthSuccess(t("passwordUpdated"));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-noir-600">{t("title")} — Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:py-24">
        <h1 className="font-display text-3xl font-light tracking-tight text-noir-900">
          {t("title")}
        </h1>
        <div className="mt-8 flex gap-2 rounded-full border border-noir-900/10 bg-section p-1">
          <button
            type="button"
            onClick={() => { setView("login"); setAuthError(""); setAuthSuccess(""); }}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
              view === "login" ? "bg-noir-900 text-white" : "text-noir-600 hover:text-noir-900"
            }`}
          >
            {t("login")}
          </button>
          <button
            type="button"
            onClick={() => { setView("signup"); setAuthError(""); setAuthSuccess(""); }}
            className={`flex-1 rounded-full py-2.5 text-sm font-medium transition ${
              view === "signup" ? "bg-noir-900 text-white" : "text-noir-600 hover:text-noir-900"
            }`}
          >
            {t("signUp")}
          </button>
        </div>

        {view === "forgot" ? (
          <form onSubmit={handleForgotPassword} className="mt-8 space-y-5">
            <div>
              <label htmlFor="acc-forgot-email" className="mb-1.5 block text-sm font-medium text-noir-700">{t("email")}</label>
              <input
                id="acc-forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                required
              />
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            {authSuccess && <p className="text-sm text-green-700">{authSuccess}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-noir-900 py-3.5 text-sm font-medium text-white transition hover:bg-noir-800 hover:shadow-lg disabled:opacity-60"
            >
              {t("sendResetLink")}
            </button>
            <button
              type="button"
              onClick={() => { setView("login"); setAuthError(""); setAuthSuccess(""); }}
              className="w-full text-center text-sm text-noir-600 hover:text-noir-900"
            >
              ← {t("login")}
            </button>
          </form>
        ) : view === "signup" ? (
          <form onSubmit={handleSignUp} className="mt-8 space-y-5">
            <div>
              <label htmlFor="acc-email" className="mb-1.5 block text-sm font-medium text-noir-700">{t("email")}</label>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                required
              />
            </div>
            <div>
              <label htmlFor="acc-password" className="mb-1.5 block text-sm font-medium text-noir-700">{t("password")}</label>
              <input
                id="acc-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="acc-first" className="mb-1.5 block text-sm font-medium text-noir-700">{t("firstName")}</label>
                <input
                  id="acc-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                />
              </div>
              <div>
                <label htmlFor="acc-last" className="mb-1.5 block text-sm font-medium text-noir-700">{t("lastName")}</label>
                <input
                  id="acc-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="acc-dob" className="mb-1.5 block text-sm font-medium text-noir-700">{t("dateOfBirth")}</label>
              <input
                id="acc-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              />
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            {authSuccess && <p className="text-sm text-green-700">{authSuccess}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-noir-900 py-3.5 text-sm font-medium text-white transition hover:bg-noir-800 hover:shadow-lg disabled:opacity-60"
            >
              {t("signUp")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="acc-email" className="mb-1.5 block text-sm font-medium text-noir-700">{t("email")}</label>
              <input
                id="acc-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                required
              />
            </div>
            <div>
              <label htmlFor="acc-password" className="mb-1.5 block text-sm font-medium text-noir-700">{t("password")}</label>
              <input
                id="acc-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
                required
              />
              <button
                type="button"
                onClick={() => { setView("forgot"); setAuthError(""); setAuthSuccess(""); }}
                className="mt-2 text-sm text-noir-600 hover:text-noir-900 underline"
              >
                {t("forgotPassword")}
              </button>
            </div>
            {authError && <p className="text-sm text-red-600">{authError}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-noir-900 py-3.5 text-sm font-medium text-white transition hover:bg-noir-800 hover:shadow-lg disabled:opacity-60"
            >
              {t("login")}
            </button>
          </form>
        )}
      </div>
    );
  }

  const orders: { id: string; date: string; total: number; status: OrderStatus }[] = [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-light tracking-tight text-noir-900">
          {t("title")}
        </h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-full border border-noir-900/20 bg-white px-5 py-2.5 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5 hover:shadow-md"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>
      <p className="mt-2 text-sm text-noir-600">{user.email}</p>

      <section className="mt-10 rounded-2xl border border-noir-900/10 bg-section p-6">
        <h2 className="font-display text-xl font-medium text-noir-900">{t("changePassword")}</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <div>
            <label htmlFor="acc-current-pw" className="mb-1.5 block text-sm font-medium text-noir-700">{t("currentPassword")}</label>
            <input
              id="acc-current-pw"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="acc-new-pw" className="mb-1.5 block text-sm font-medium text-noir-700">{t("newPassword")}</label>
            <input
              id="acc-new-pw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              minLength={6}
            />
          </div>
          <div>
            <label htmlFor="acc-confirm-pw" className="mb-1.5 block text-sm font-medium text-noir-700">{t("confirmNewPassword")}</label>
            <input
              id="acc-confirm-pw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-2xl border border-champagne-300 bg-white px-5 py-3.5 text-noir-900 focus:border-noir-900 focus:outline-none focus:ring-1 focus:ring-noir-900"
              minLength={6}
            />
          </div>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          {authSuccess && <p className="text-sm text-green-700">{authSuccess}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-noir-900 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-noir-800 disabled:opacity-60"
          >
            {t("changePassword")}
          </button>
        </form>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-medium text-noir-900">{t("myOrders")}</h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-noir-600">{t("noOrders")}</p>
        ) : (
          <ul className="mt-4 space-y-6">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-noir-900/10 bg-section p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Package className="h-8 w-8 text-champagne-500" />
                    <div>
                      <p className="font-medium text-noir-900">{order.id}</p>
                      <p className="text-sm text-noir-600">{order.date}</p>
                    </div>
                  </div>
                  <p className="text-noir-900">${order.total} USD</p>
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-sm font-medium text-noir-700">{t("orderStatus")}</p>
                  <OrderStatusTracker status={order.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
