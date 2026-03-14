import { Resend } from "resend";
import { emailLayout, formatUsd, formatAddressBlock, ctaButton } from "./email-template";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://savjewelry.shop";
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type OrderItem = { name: string; quantity: number; priceUsd: number };

const orderTemplates = {
  en: {
    subject: "Order Confirmation – SÁV+ Jewelry",
    greeting: "Thank you for your order.",
    items: "Items",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    footer: "We will process your order shortly.",
    shippingAddress: "Shipping address",
  },
  es: {
    subject: "Confirmación de pedido – SÁV+ Jewelry",
    greeting: "Gracias por tu pedido.",
    items: "Productos",
    subtotal: "Subtotal",
    shipping: "Envío",
    total: "Total",
    footer: "Procesaremos tu pedido en breve.",
    shippingAddress: "Dirección de envío",
  },
};

const abandonedTemplates = {
  en: {
    subject: "You left items in your cart – SÁV+ Jewelry",
    greeting: "You left some items in your cart.",
    cta: "Complete your purchase",
    footer: "Your cart is waiting for you.",
    shippingAddress: "Shipping address",
  },
  es: {
    subject: "Dejaste artículos en tu carrito – SÁV+ Jewelry",
    greeting: "Dejaste algunos artículos en tu carrito.",
    cta: "Completa tu compra",
    footer: "Tu carrito te espera.",
    shippingAddress: "Dirección de envío",
  },
};

export async function sendOrderConfirmation(params: {
  to: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  locale?: "en" | "es";
  logoUrl?: string | null;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}): Promise<{ error?: string }> {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  const { to, items, subtotal, shipping, total, locale = "en", logoUrl, shippingAddress } = params;
  const t = orderTemplates[locale];

  const rows = items
    .map((i) => `${i.name} × ${i.quantity}: ${formatUsd(i.priceUsd * i.quantity)}`)
    .join("<br/>");
  const addressBlock = shippingAddress ? formatAddressBlock(shippingAddress) : "";

  const body = `
    <p style="margin:0 0 20px; font-size:17px;">${t.greeting}</p>
    <h3 style="margin:0 0 12px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b6b6b;">${t.items}</h3>
    <p style="margin:0 0 16px;">${rows}</p>
    <p style="margin:0 0 8px;"><strong>${t.subtotal}</strong> ${formatUsd(subtotal)}</p>
    <p style="margin:0 0 8px;"><strong>${t.shipping}</strong> ${formatUsd(shipping)}</p>
    <p style="margin:0 0 16px;"><strong>${t.total}</strong> ${formatUsd(total)}</p>
    ${addressBlock ? `<h3 style="margin:16px 0 8px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b6b6b;">${t.shippingAddress}</h3>${addressBlock}` : ""}
    <p style="margin:24px 0 0; color:#6b6b6b;">${t.footer}</p>
  `;

  const html = emailLayout({
    logoUrl,
    children: body,
    footerText: "SÁV+ Jewelry",
  });

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
  logoUrl?: string | null;
  /** Link direto para recuperar este carrinho (preenchido no checkout). */
  recoveryUrl?: string | null;
  shippingAddress?: {
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}): Promise<{ error?: string }> {
  if (!resend) return { error: "RESEND_API_KEY not set" };
  const { to, items, locale = "en", logoUrl, recoveryUrl, shippingAddress } = params;
  const t = abandonedTemplates[locale];

  const rows = items
    .map((i) => `${i.name} × ${i.quantity}: ${formatUsd(i.priceUsd * i.quantity)}`)
    .join("<br/>");
  const addressBlock = shippingAddress ? formatAddressBlock(shippingAddress) : "";
  const ctaUrl = recoveryUrl || `${siteUrl}/${locale === "es" ? "es" : "en"}/checkout`;
  const cta = ctaButton(ctaUrl, t.cta);

  const body = `
    <p style="margin:0 0 20px; font-size:17px;">${t.greeting}</p>
    <p style="margin:0 0 16px;">${rows}</p>
    ${addressBlock ? `<h3 style="margin:16px 0 8px; font-size:14px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#6b6b6b;">${t.shippingAddress}</h3>${addressBlock}` : ""}
    ${cta}
    <p style="margin:24px 0 0; color:#6b6b6b;">${t.footer}</p>
  `;

  const html = emailLayout({
    logoUrl,
    children: body,
    footerText: "SÁV+ Jewelry",
  });

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
  const body = `
    <p style="margin:0 0 16px;"><strong>New contact form message – SÁV+ Jewelry</strong></p>
    <p style="margin:0 0 8px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p style="margin:0 0 8px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p style="margin:0 0 8px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
    <p style="margin:0 0 8px;"><strong>Message:</strong></p>
    <p style="margin:0; white-space:pre-wrap;">${escapeHtml(message)}</p>
  `;
  const html = emailLayout({ children: body, footerText: "SÁV+ Jewelry" });
  const { error } = await resend.emails.send({
    from: fromEmail,
    to: [CONTACT_TO_EMAIL],
    replyTo: email,
    subject: `Contact: ${reason} – ${name}`,
    html,
  });
  return error ? { error: error.message } : {};
}
