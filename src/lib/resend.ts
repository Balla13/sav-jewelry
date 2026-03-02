import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type OrderItem = { name: string; quantity: number; priceUsd: number };

function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const templates = {
  en: {
    subject: "Order Confirmation – SÁV+ Jewelry",
    greeting: "Thank you for your order.",
    items: "Items",
    subtotal: "Subtotal",
    shipping: "Shipping (fixed)",
    total: "Total",
    footer: "We will process your order shortly.",
  },
  es: {
    subject: "Confirmación de pedido – SÁV+ Jewelry",
    greeting: "Gracias por tu pedido.",
    items: "Productos",
    subtotal: "Subtotal",
    shipping: "Envío (fijo)",
    total: "Total",
    footer: "Procesaremos tu pedido en breve.",
  },
};

const abandonedTemplates = {
  en: {
    subject: "You left items in your cart – SÁV+ Jewelry",
    greeting: "You left some items in your cart.",
    cta: "Complete your purchase",
    footer: "Your cart is waiting for you.",
  },
  es: {
    subject: "Dejaste artículos en tu carrito – SÁV+ Jewelry",
    greeting: "Dejaste algunos artículos en tu carrito.",
    cta: "Completa tu compra",
    footer: "Tu carrito te espera.",
  },
};

export async function sendOrderConfirmation(params: {
  to: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  locale?: "en" | "es";
}): Promise<{ error?: string }> {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  const { to, items, subtotal, shipping, total, locale = "en" } = params;
  const t = templates[locale];

  const rows = items.map((i) => `${i.name} × ${i.quantity}: ${formatUsd(i.priceUsd * i.quantity)}`).join("<br/>");
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${t.greeting}</p>
      <h3>${t.items}</h3>
      <p>${rows}</p>
      <p><strong>${t.subtotal}</strong> ${formatUsd(subtotal)}</p>
      <p><strong>${t.shipping}</strong> ${formatUsd(shipping)}</p>
      <p><strong>${t.total}</strong> ${formatUsd(total)}</p>
      <p style="margin-top: 2rem; color: #666;">${t.footer}</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: t.subject,
    html,
  });
  return error ? { error: error.message } : {};
}

export async function sendAbandonedCartEmail(params: {
  to: string;
  items: OrderItem[];
  locale?: "en" | "es";
}): Promise<{ error?: string }> {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  const { to, items, locale = "en" } = params;
  const t = abandonedTemplates[locale];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const rows = items.map((i) => `${i.name} × ${i.quantity}: ${formatUsd(i.priceUsd * i.quantity)}`).join("<br/>");
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p>${t.greeting}</p>
      <p>${rows}</p>
      <p><a href="${siteUrl}/collection" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 9999px;">${t.cta}</a></p>
      <p style="margin-top: 2rem; color: #666;">${t.footer}</p>
    </div>
  `;
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [to],
    subject: t.subject,
    html,
  });
  return error ? { error: error.message } : {};
}

const CONTACT_TO_EMAIL = "eduardobalassiano13@gmail.com";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendContactFormEmail(params: {
  name: string;
  email: string;
  reason: string;
  message: string;
}): Promise<{ error?: string }> {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  const { name, email, reason, message } = params;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <p><strong>New contact form message – SÁV+ Jewelry</strong></p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  `;
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [CONTACT_TO_EMAIL],
    // Resend usa reply_to (snake_case)
    reply_to: email,
    subject: `Contact: ${reason} – ${name}`,
    html,
  });
  return error ? { error: error.message } : {};
}
