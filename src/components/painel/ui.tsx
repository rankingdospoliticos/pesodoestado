import type { ReactNode } from "react";

export function Secao({ id, k, titulo, children, intro }: { id: string; k: string; titulo: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <section id={id}>
      <div className="sec-head">
        <span className="k">{k}</span>
        <h2>{titulo}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function Kpi({ v, u, l, s, alerta, pill, pillTipo = "crit", fundo }: {
  v: ReactNode; u?: string; l: ReactNode; s?: ReactNode; alerta?: boolean; pill?: string; pillTipo?: "crit" | "good" | "neu"; fundo?: boolean;
}) {
  return (
    <div className={`kpi${alerta ? " alert" : ""}`} style={fundo ? { background: "var(--surface-2)" } : undefined}>
      {pill ? <span className={`pill ${pillTipo}`}>{pill}</span> : null}
      <div className="v num">
        {v}
        {u ? <small>{u}</small> : null}
      </div>
      <div className="l">{l}</div>
      {s ? <div className="s">{s}</div> : null}
    </div>
  );
}

export function Kpis({ children, min }: { children: ReactNode; min?: number }) {
  return (
    <div className="kpis" style={min ? { gridTemplateColumns: `repeat(auto-fit,minmax(${min}px,1fr))` } : undefined}>
      {children}
    </div>
  );
}

export function Caixa({ titulo, sub, children, fonte, nota }: { titulo?: ReactNode; sub?: ReactNode; children?: ReactNode; fonte?: ReactNode; nota?: ReactNode }) {
  return (
    <div className="panel">
      {titulo ? <h3>{titulo}</h3> : null}
      {sub ? <p className="sub">{sub}</p> : null}
      {children}
      {nota ? <p className="note">{nota}</p> : null}
      {fonte ? <p className="src">{fonte}</p> : null}
    </div>
  );
}

export const Grid2 = ({ children }: { children: ReactNode }) => <div className="grid2">{children}</div>;

export function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Selo "ao vivo" com a data da última coleta. Fica laranja se a coleta tiver mais de 2 dias. */
export function AoVivo({ coletadoEm, rotulo = "Atualizado automaticamente" }: { coletadoEm?: string | undefined; rotulo?: string }) {
  if (!coletadoEm) return null;
  const idadeH = (Date.now() - new Date(coletadoEm).getTime()) / 36e5;
  const quando = new Date(coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
  return <span className={`live${idadeH > 48 ? " stale" : ""}`}>{rotulo} · {quando}</span>;
}
