"use client";

import { Link } from "@/i18n/navigation";

/** Menu único do admin: todas as páginas mostram as mesmas opções. */
export default function AdminNav() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href="/admin/dashboard"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Dashboard
      </Link>
      <Link
        href="/admin"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Add product
      </Link>
      <Link
        href="/admin/inventory"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Inventory
      </Link>
      <Link
        href="/admin/order-bump"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Order bump
      </Link>
      <Link
        href="/admin/contacts"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Contacts
      </Link>
      <Link
        href="/admin/settings"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Settings
      </Link>
      <Link
        href="/admin/ebay-sync"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        eBay Sync
      </Link>
      <Link
        href="/admin/abandoned-carts"
        className="rounded-full border border-noir-900/20 bg-white px-4 py-2 text-sm font-medium text-noir-700 transition hover:bg-noir-900/5"
      >
        Abandoned carts
      </Link>
      <Link href="/collection" className="text-sm font-medium text-noir-600 hover:text-noir-900">
        Back to store
      </Link>
    </div>
  );
}
