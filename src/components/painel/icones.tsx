import type { CSSProperties } from "react";
import type { Unidade } from "@/lib/painel/equivalencias";

/** Ícones simples de traço (24×24) para as equivalências. Herdam a cor do texto. */
const TRACOS: Record<Unidade, string[]> = {
  casa: ["M3 11.5 12 4l9 7.5", "M5.5 9.8V20h13V9.8", "M10 20v-5.5h4V20"],
  creche: ["M3 10.5 12 5l9 5.5", "M5 9.6V20h14V9.6", "M9.5 20v-4.5h5V20", "M8 12.5h1.5M14.5 12.5H16", "M12 5V2.2h3.2"],
  ubs: ["M4.5 6.5h15v13h-15z", "M12 9.5v7M8.5 13h7", "M9 6.5V4h6v2.5"],
  icesp: ["M6 21V4.5h12V21", "M3 21h18", "M12 7.5v5M9.5 10h5", "M10.5 21v-4h3v4"],
  professor: ["M3 4h12v8.5H3z", "M6 8h6", "M18 9.2a2 2 0 1 0 0-.1", "M15 21v-3.5a3 3 0 0 1 6 0V21", "M15 14.5l-3-2.5"],
  bolsa: ["M7.5 8.5a2.3 2.3 0 1 0 0-.1", "M16.5 8.5a2.3 2.3 0 1 0 0-.1", "M12 14.2a1.7 1.7 0 1 0 0-.1", "M3.5 20v-2.5a4 4 0 0 1 7-2.6", "M20.5 20v-2.5a4 4 0 0 0-7-2.6", "M9.5 20.5a2.5 2.5 0 0 1 5 0"],
  onibus: ["M5 3.5h14a1.5 1.5 0 0 1 1.5 1.5v12h-17V5A1.5 1.5 0 0 1 5 3.5z", "M3.5 10.5h17", "M7.5 19.2a1.5 1.5 0 1 0 0-.1", "M16.5 19.2a1.5 1.5 0 1 0 0-.1", "M7 14h1.5M15.5 14H17"],
  salario: ["M2.5 7h19v10h-19z", "M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z", "M5.5 10v4M18.5 10v4"],
  cesta: ["M3 10h18l-2.2 10H5.2z", "M7.5 10 11 4.5M16.5 10 13 4.5", "M8.5 13.5v3.5M12 13.5v3.5M15.5 13.5v3.5"],
};

export function Icone({ u, tamanho = 22, className }: { u: Unidade; tamanho?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {TRACOS[u].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Versão em <g> para usar dentro de um SVG maior (pictogramas). */
export function IconeG({ u, x, y, s = 1, style, className }: { u: Unidade; x: number; y: number; s?: number; style?: CSSProperties; className?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
      {TRACOS[u].map((d) => <path key={d} d={d} />)}
    </g>
  );
}
