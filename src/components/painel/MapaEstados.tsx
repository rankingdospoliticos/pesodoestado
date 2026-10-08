import { useState, type CSSProperties } from "react";
import { fmt } from "@/lib/painel/formatos";
import { UF_GRADE, imlee, cnaeEstadual, municipiosLLE } from "@/data/curados";

type Modo = "imlee" | "cnae" | "mun";
type Valor = number | "lei" | "sem" | undefined;

const MODOS: Record<Modo, { rotulo: string; titulo: string; dados: Record<string, Valor>; min: number; max: number; fmt: (v: Valor) => string; nota: string; lo: string; hi: string }> = {
  imlee: {
    rotulo: "Índice Mackenzie (IMLEE)", titulo: "Índice Mackenzie de Liberdade Econômica Estadual 2025", dados: imlee, min: 3.9, max: 6.3,
    fmt: (v) => (typeof v === "number" ? fmt(v, 2) : "sem dado"),
    nota: "Escala de 0 a 10; média nacional 5,10. Combina gasto do governo estadual, tributação e regras do mercado de trabalho, com dados de 2023. O Distrito Federal não é avaliado.",
    lo: "3,96", hi: "6,26",
  },
  cnae: {
    rotulo: "Atividades sem alvará (lei estadual)", titulo: "Atividades dispensadas de alvará pela norma estadual", dados: cnaeEstadual, min: 250, max: 980,
    fmt: (v) => (typeof v === "number" ? fmt(v) : v === "lei" ? "lei sem lista" : v === "sem" ? "sem lei" : "sem dado"),
    nota: "Número de atividades econômicas (CNAEs) de baixo risco liberadas de alvará. A lei federal libera 298; abaixo disso, o estado não foi além da regra federal. Ranking ILISP divulgado em jul/2026.",
    lo: "264", hi: "975",
  },
  mun: {
    rotulo: "% de municípios com a lei", titulo: "Municípios que aprovaram a Lei de Liberdade Econômica", dados: municipiosLLE, min: 0, max: 100,
    fmt: (v) => (typeof v === "number" ? `${fmt(v, 1).replace(",0", "")}%` : "sem dado"),
    nota: "% dos municípios do estado com lei ou decreto de liberdade econômica. Em SP todos aderiram, mas a maioria ainda não definiu a lista de atividades. Sem dado na fonte: PR e RJ. RS calculado a partir de 261 de 497 municípios.",
    lo: "0%", hi: "100%",
  },
};

function estiloTile(v: Valor, m: (typeof MODOS)[Modo]): CSSProperties {
  if (typeof v === "number") {
    const t = Math.max(0, Math.min(1, (v - m.min) / (m.max - m.min)));
    return { background: `color-mix(in oklab, var(--seq) ${Math.round(12 + t * 88)}%, var(--surface-2))`, color: t > 0.5 ? "#fff" : "var(--ink)" };
  }
  if (v === "sem") return { background: "var(--surface-2)", color: "var(--crit)", backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, color-mix(in oklab,var(--crit) 35%,transparent) 4px 5px)" };
  if (v === "lei") return { background: "var(--surface-2)", color: "var(--ink-2)", backgroundImage: "repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in oklab,var(--ink-3) 45%,transparent) 4px 5px)" };
  return { background: "var(--none)", color: "var(--ink-3)" };
}

export function MapaEstados() {
  const [modo, setModo] = useState<Modo>("imlee");
  const [sel, setSel] = useState<string | null>(null);
  const m = MODOS[modo];
  const resumo = (uf: string) => `${UF_GRADE[uf]?.n ?? uf} · IMLEE: ${MODOS.imlee.fmt(imlee[uf])} · Atividades sem alvará: ${MODOS.cnae.fmt(cnaeEstadual[uf])} · Municípios com a lei: ${MODOS.mun.fmt(municipiosLLE[uf])}`;

  const celulas = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 7; c++) {
      const uf = Object.keys(UF_GRADE).find((k) => UF_GRADE[k]?.r === r && UF_GRADE[k]?.c === c);
      celulas.push(
        uf ? (
          <button key={uf} type="button" id={`uf-${uf}`} className={`tile${uf === sel ? " sel" : ""}`} style={estiloTile(m.dados[uf], m)} aria-label={resumo(uf)} title={resumo(uf)} onClick={() => setSel(uf)}>
            {uf}
          </button>
        ) : (
          <span key={`${r}-${c}`} />
        ),
      );
    }

  const entradas = Object.keys(UF_GRADE)
    .map((k) => [k, m.dados[k]] as const)
    .filter(([, v]) => v != null)
    .sort((a, b) => (typeof b[1] === "number" ? b[1] : -1) - (typeof a[1] === "number" ? a[1] : -1));
  let pos = 0;

  return (
    <div className="panel">
      <div className="toggle" role="group" aria-label="Indicador do mapa">
        {(Object.keys(MODOS) as Modo[]).map((k) => (
          <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}>{MODOS[k].rotulo}</button>
        ))}
      </div>
      <div className="maprow">
        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          <div className="tilemap" aria-label="Mapa em mosaico dos estados">{celulas}</div>
          <div className="scale">
            <span>{m.lo}</span>
            <span className="bar" style={{ background: "linear-gradient(90deg,color-mix(in oklab,var(--seq) 12%,var(--surface-2)),var(--seq))" }} />
            <span>{m.hi}</span>
            {modo === "cnae" && <><span style={{ marginLeft: 8 }}>▨ lei sem lista</span><span style={{ color: "var(--crit)" }}>▨ sem lei</span></>}
            <span>▢ sem dado</span>
          </div>
          <div className="note" aria-live="polite">{sel ? resumo(sel) : "Toque em um estado."}</div>
        </div>
        <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
          <h3 style={{ fontSize: 17 }}>{m.titulo}</h3>
          <ol className="ranklist">
            {entradas.map(([k, v]) => (
              <li key={k} className={k === sel ? "hl" : undefined}>
                <span className="p">{typeof v === "number" ? ++pos : "–"}</span>
                <span>{UF_GRADE[k]?.n}</span>
                <span className="x">{m.fmt(v)}</span>
              </li>
            ))}
          </ol>
          <p className="note">{m.nota}</p>
        </div>
      </div>
      <p className="src">Mackenzie, IMLEE 2025; ILISP / Liberdade para Trabalhar (jul–out/2026)</p>
    </div>
  );
}
