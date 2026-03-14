"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AdminNav from "@/components/AdminNav";

type Contact = {
  id: string;
  email: string;
  source: string;
  created_at: string;
};

export default function AdminContactsPage() {
  const router = useRouter();
  const locale = useLocale();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/contacts", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace(`/${locale}/admin`);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setError("Failed to load contacts.");
      });
  }, [router, locale]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-semibold text-noir-900">Contacts</h1>
        <AdminNav />
      </div>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {contacts.length === 0 ? (
        <p className="rounded-2xl border border-noir-900/10 bg-section px-6 py-8 text-center text-noir-600">
          No contacts yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-noir-900/10 bg-section">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/80">
              <tr className="border-b border-noir-900/10">
                <th className="px-6 py-3 font-medium text-noir-700">Email</th>
                <th className="px-6 py-3 font-medium text-noir-700">Source</th>
                <th className="px-6 py-3 font-medium text-noir-700">Created at</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-noir-900/5 last:border-0">
                  <td className="px-6 py-3 text-noir-900">{c.email}</td>
                  <td className="px-6 py-3 text-noir-600">{c.source}</td>
                  <td className="px-6 py-3 text-noir-500">
                    {new Date(c.created_at).toLocaleString(locale === "es" ? "es-ES" : "en-US", {
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

