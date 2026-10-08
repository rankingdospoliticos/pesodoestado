export const fmt = (n: number, d = 0) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

/** R$ com sufixo (mil, mi, bi, tri). */
export function reais(n: number, casas = 1): string {
  const a = Math.abs(n);
  const s = n < 0 ? "−" : "";
  if (a >= 1e12) return `${s}R$ ${fmt(a / 1e12, casas)} tri`;
  if (a >= 1e9) return `${s}R$ ${fmt(a / 1e9, casas)} bi`;
  if (a >= 1e6) return `${s}R$ ${fmt(a / 1e6, casas)} mi`;
  if (a >= 1e3) return `${s}R$ ${fmt(a / 1e3, casas)} mil`;
  return `${s}R$ ${fmt(a)}`;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const mesCurto = (m: number) => MESES[(m - 1 + 12) % 12] ?? String(m);

/** "2026-08-01" → "ago/26" */
export function mesAno(iso: string): string {
  const [a, m] = iso.split("-");
  return `${mesCurto(Number(m))}/${(a ?? "").slice(2)}`;
}

/** ISO → "8 out 2026, 14:20" no fuso de Brasília. */
export function dataHora(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", "");
}

export function data(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", year: "numeric" }).replace(".", "");
}

/** Capitaliza nomes em CAIXA ALTA: "LAÉRCIO OLIVEIRA" → "Laércio Oliveira" */
export function nomeProprio(s?: string | null): string {
  if (!s) return "";
  if (s !== s.toUpperCase()) return s;
  const minus = new Set(["da", "de", "do", "das", "dos", "e"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && minus.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/** Texto em caixa alta → frase: "LOCAÇÃO DE VEÍCULOS" → "Locação de veículos" */
export function frase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  const t = s.toLowerCase().replace(/\s+,/g, ",");
  return t.charAt(0).toUpperCase() + t.slice(1);
}
