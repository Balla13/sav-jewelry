"use client";

import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

type Props = { onSuccess: () => void; onCancel: () => void };

export default function CheckoutPaymentForm({ onSuccess, onCancel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}${window.location.pathname.includes("?") ? "&" : "?"}success=1`
        : "";
    const { error: err } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Payment failed");
      return;
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-noir-900/20 bg-white py-3 text-sm font-medium text-noir-700 hover:bg-noir-900/5"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || !elements || loading}
          className="flex-1 rounded-full border border-noir-900 bg-noir-900 py-3 text-sm font-medium text-champagne-50 transition hover:bg-noir-800 disabled:opacity-60"
        >
          {loading ? "Processing..." : "Confirm payment"}
        </button>
      </div>
    </form>
  );
}
