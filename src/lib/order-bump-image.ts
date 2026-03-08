/**
 * Converte URL da imagem do order bump para um src que carrega corretamente.
 * Caminhos relativos (ex: /Limpa Joias SAV.png) são convertidos em URL absoluta
 * e espaços são codificados para o navegador não falhar.
 */
export function resolveOrderBumpImageSrc(url: string | null | undefined): string {
  if (!url || !url.trim()) return "";
  const u = url.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  const encoded = path.replace(/ /g, "%20");
  if (typeof window !== "undefined") {
    return window.location.origin + encoded;
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return base ? base + encoded : encoded;
}
