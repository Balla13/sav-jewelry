/**
 * Layout único para e-mails transacionais (pedido, carrinho abandonado, etc.)
 * Estética alinhada ao site: fundo claro, tipografia elegante, logo no topo.
 */

const FONT_FAMILY = "'Georgia', 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const BG = "#faf9f7";
const TEXT = "#1a1a1a";
const MUTED = "#6b6b6b";
const GOLD = "#b8860b";
const BORDER = "#e5e2dd";
const BTN_BG = "#1a1a1a";
const BTN_COLOR = "#faf9f7";

export type EmailLayoutProps = {
  logoUrl?: string | null;
  children: string;
  /** Rodapé opcional (ex.: "SÁV+ Jewelry · savjewelry.shop") */
  footerText?: string;
};

export function emailLayout({ logoUrl, children, footerText }: EmailLayoutProps): string {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="SÁV+ Jewelry" width="160" height="48" style="display:block; max-width:160px; height:auto;" />`
    : `<span style="font-family:${FONT_FAMILY}; font-size:24px; font-weight:400; letter-spacing:0.02em; color:${TEXT};">SÁV+ Jewelry</span>`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SÁV+ Jewelry</title>
</head>
<body style="margin:0; padding:0; background-color:${BG}; font-family:${SANS}; font-size:16px; line-height:1.6; color:${TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          <tr>
            <td style="padding:24px 0; border-bottom:1px solid ${BORDER};">
              ${logoHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 0;">
              ${children}
            </td>
          </tr>
          ${footerText ? `<tr><td style="padding-top:24px; border-top:1px solid ${BORDER}; font-size:13px; color:${MUTED}; text-align:center;">${footerText}</td></tr>` : ""}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function formatUsd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Bloco de endereço formatado para e-mail */
export function formatAddressBlock(address: {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}): string {
  const parts: string[] = [];
  const name = [address.firstName, address.lastName].filter(Boolean).join(" ");
  if (name) parts.push(escapeHtml(name));
  if (address.address) parts.push(escapeHtml(address.address));
  const cityStateZip = [address.city, address.state, address.zipCode].filter(Boolean).join(", ");
  if (cityStateZip) parts.push(escapeHtml(cityStateZip));
  if (address.country) parts.push(escapeHtml(address.country));
  if (parts.length === 0) return "";
  return `<p style="margin:0 0 12px; color:${MUTED}; font-size:14px;">${parts.join("<br/>")}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Botão CTA no estilo do site */
export function ctaButton(href: string, label: string): string {
  return `
    <p style="margin:24px 0 0;">
      <a href="${href}" style="display:inline-block; background:${BTN_BG}; color:${BTN_COLOR}; padding:14px 28px; text-decoration:none; border-radius:9999px; font-size:14px; font-weight:500;">${escapeHtml(label)}</a>
    </p>
  `;
}
