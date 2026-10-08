import { createContext, useCallback, useContext, useEffect, useState, type CSSProperties, type ReactNode, type MouseEvent, type FocusEvent } from "react";
import { fmt } from "@/lib/painel/formatos";
import { useRevelar } from "./animacao";

/** Atraso escalonado da animação de entrada (lido pelo CSS em --i). */
export const atraso = (i: number) => ({ "--i": i }) as CSSProperties;

/** Largura máxima de desenho dos gráficos (px). Acima disso o gráfico não estica. */
export const LARGURA_MAX = 760;
/** Abaixo desta largura, os gráficos usam o arranjo de celular (rótulos acima das barras etc.). */
export const ESTREITO = 500;

/**
 * Moldura dos gráficos. Mede a largura disponível (para desenhar em pixels reais,
 * com texto sempre legível, inclusive no celular) e dá a animação de entrada
 * quando o gráfico aparece na tela. Sem JavaScript (servidor), desenha com 640 px.
 */
export function Quadro({ tipo, children, className }: { tipo: string; children: ReactNode | ((largura: number) => ReactNode); className?: string }) {
  const [ref, estado] = useRevelar<HTMLDivElement>();
  const [largura, setLargura] = useState<number | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const medir = () => setLargura(Math.max(280, Math.min(LARGURA_MAX, Math.round(el.clientWidth))));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  const W = largura ?? 640;
  return (
    <div ref={ref} className={["chart", tipo, estado, className].filter(Boolean).join(" ")}>
      {typeof children === "function" ? children(W) : children}
    </div>
  );
}

/* ---------- tooltip compartilhado ---------- */
type Tip = { conteudo: ReactNode; x: number; y: number } | null;
type TipApi = { mostrar: (e: { clientX: number; clientY: number }, c: ReactNode) => void; esconder: () => void };
const TipCtx = createContext<TipApi>({ mostrar: () => {}, esconder: () => {} });

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tip, setTip] = useState<Tip>(null);
  const mostrar = useCallback((e: { clientX: number; clientY: number }, conteudo: ReactNode) => setTip({ conteudo, x: e.clientX, y: e.clientY }), []);
  const esconder = useCallback(() => setTip(null), []);
  const largura = typeof window !== "undefined" ? window.innerWidth : 1200;
  return (
    <TipCtx.Provider value={{ mostrar, esconder }}>
      {children}
      <div
        className="painel-tip"
        role="tooltip"
        style={{ opacity: tip ? 1 : 0, left: tip ? Math.max(8, tip.x + 274 > largura ? tip.x - 270 : tip.x + 14) : -999, top: tip ? tip.y + 14 : -999 }}
      >
        {tip?.conteudo}
      </div>
    </TipCtx.Provider>
  );
}

/** Acesso direto ao tooltip (para mapas e visuais próprios). */
export const useTip = () => useContext(TipCtx);

/** Props para um grupo SVG que mostra tooltip no hover e no foco do teclado. */
export function useHover(conteudo: ReactNode) {
  const { mostrar, esconder } = useContext(TipCtx);
  return {
    tabIndex: 0,
    className: "hit",
    onMouseEnter: (e: MouseEvent) => mostrar(e, conteudo),
    onMouseMove: (e: MouseEvent) => mostrar(e, conteudo),
    onMouseLeave: esconder,
    onFocus: (e: FocusEvent<SVGGElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      mostrar({ clientX: r.left + r.width / 2, clientY: r.top }, conteudo);
    },
    onBlur: esconder,
  };
}

const hbarPath = (x: number, y: number, w: number, h: number, r = 4) => {
  r = Math.min(r, w, h / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
};
const vbarPath = (x: number, y: number, w: number, h: number, r = 4) => {
  r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
};

/** Corta um rótulo longo para caber em `px` pixels (estimativa de ~6,6 px por caractere). */
const caber = (t: string, px: number) => {
  const n = Math.max(4, Math.floor(px / 6.6));
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

/* ---------- barras horizontais ---------- */
export type Barra = { k: string; v: number; c?: string; lab?: string; tip?: ReactNode; bold?: boolean };

function LinhaBarra({ r, i, W, lw, rh, bh, top, sx, d, empilhado }: { r: Barra; i: number; W: number; lw: number; rh: number; bh: number; top: number; sx: (v: number) => number; d: number; empilhado: boolean }) {
  const y = top + i * rh;
  const w = Math.max(2, sx(r.v));
  const lab = r.lab ?? fmt(r.v, d);
  const hover = useHover(r.tip ?? <><b>{r.k}</b><br />{lab}</>);
  if (empilhado) {
    return (
      <g {...hover} style={atraso(i)}>
        <rect x={0} y={y} width={W} height={rh} fill="transparent" />
        <text x={0} y={y + 13} className={r.bold ? "val" : undefined}>{caber(r.k, W)}</text>
        <path d={hbarPath(0, y + 19, w, bh)} fill={r.c ?? "var(--s1)"} className="mark" />
        <text x={w + 6} y={y + 19 + bh / 2 + 4} className="val">{lab}</text>
      </g>
    );
  }
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={0} y={y} width={W} height={rh} fill="transparent" />
      <text x={lw - 10} y={y + rh / 2 + 4} textAnchor="end" className={r.bold ? "val" : undefined}>{caber(r.k, lw - 12)}</text>
      <path d={hbarPath(lw, y + (rh - bh) / 2, w, bh)} fill={r.c ?? "var(--s1)"} className="mark" />
      <text x={lw + w + 6} y={y + rh / 2 + 4} className="val">{lab}</text>
    </g>
  );
}

export function HBarras({ dados, lw = 170, rw = 90, rh = 30, bh = 14, max, referencia: refV, refLabel, d = 0, titulo }: {
  dados: Barra[]; lw?: number; rw?: number; rh?: number; bh?: number; max?: number; referencia?: number; refLabel?: string; d?: number; titulo?: string;
}) {
  const m = max ?? Math.max(...dados.map((r) => r.v), 1);
  return (
    <Quadro tipo="hb">
      {(W) => {
        const empilhado = W < ESTREITO;
        const top = empilhado ? 14 : 6;
        const linha = empilhado ? 40 : rh;
        const x0 = empilhado ? 0 : lw;
        const larg = W - x0 - Math.min(rw, empilhado ? 84 : rw);
        const sx = (v: number) => (larg * v) / m;
        const H = top + dados.length * linha + 4;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {refV != null && (
              <g>
                <line x1={x0 + sx(refV)} x2={x0 + sx(refV)} y1={0} y2={H} stroke="var(--ink-3)" strokeDasharray="3 3" />
                <text x={x0 + sx(refV) + 4} y={10} className="muted" fontSize={11}>{refLabel}</text>
              </g>
            )}
            {dados.map((r, i) => (
              <LinhaBarra key={r.k + i} r={r} i={i} W={W} lw={lw} rh={linha} bh={bh} top={top} sx={sx} d={d} empilhado={empilhado} />
            ))}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- barras verticais ---------- */
function ColunaBarra({ r, i, x, w, y, h, bx, bw, pt, ih, H, d }: { r: Barra; i: number; x: number; w: number; y: number; h: number; bx: number; bw: number; pt: number; ih: number; H: number; d: number }) {
  const lab = r.lab ?? fmt(r.v, d);
  const hover = useHover(r.tip ?? <><b>{r.k}</b><br />{lab}</>);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={bx} y={pt} width={bw} height={ih} fill="transparent" />
      <path d={vbarPath(x, y, w, Math.max(h, 0.5))} fill={r.c ?? "var(--s1)"} className="mark" />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" className="val">{lab}</text>
      <text x={x + w / 2} y={H - 8} textAnchor="middle">{r.k}</text>
    </g>
  );
}

export function VBarras({ dados, h: H = 250, max, ticks = [], d = 0, titulo, fmtTick }: {
  dados: Barra[]; h?: number; max?: number; ticks?: number[]; d?: number; titulo?: string; fmtTick?: (n: number) => string;
}) {
  const pl = 40, pr = 6, pt = 22, pb = 28;
  const m = max ?? Math.max(...dados.map((r) => r.v), 1) * 1.12;
  return (
    <Quadro tipo="vb">
      {(W) => {
        const ih = H - pt - pb, iw = W - pl - pr;
        const sy = (v: number) => (ih * v) / m;
        const bw = iw / Math.max(1, dados.length);
        const w = Math.min(56, bw * 0.62);
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {ticks.map((t) => {
              const y = pt + ih - sy(t);
              return (
                <g key={t}>
                  <line x1={pl} x2={W - pr} y1={y} y2={y} className="grid" />
                  <text x={pl - 6} y={y + 4} textAnchor="end" className="muted" fontSize={11}>{fmtTick ? fmtTick(t) : fmt(t)}</text>
                </g>
              );
            })}
            {dados.map((r, i) => {
              const x = pl + i * bw + (bw - w) / 2, h = sy(r.v);
              return <ColunaBarra key={r.k + i} r={r} i={i} x={x} w={w} y={pt + ih - h} h={h} bx={pl + i * bw} bw={bw} pt={pt} ih={ih} H={H} d={d} />;
            })}
            <line x1={pl} x2={W - pr} y1={pt + ih} y2={pt + ih} stroke="var(--ink-3)" />
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- barras agrupadas (2 ou 3 séries por categoria) ---------- */
export type Grupo = { k: string; valores: (number | null)[]; nota?: string };
function BarraGrupo({ i, x, y, w, h, c, lab, tip }: { i: number; x: number; y: number; w: number; h: number; c: string; lab: string; tip: ReactNode }) {
  const hover = useHover(tip);
  return (
    <g {...hover} style={atraso(i)}>
      <path d={vbarPath(x, y, w, h)} fill={c} className="mark" />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" className="val" fontSize={11}>{lab}</text>
    </g>
  );
}
export function BarrasAgrupadas({ grupos, series, cores, max, ticks, fmtValor, fmtTick, h: H = 230, titulo }: {
  grupos: Grupo[]; series: string[]; cores: string[]; max: number; ticks: number[]; fmtValor: (n: number) => string; fmtTick: (n: number) => string; h?: number; titulo?: string;
}) {
  const pl = 44, pr = 6, pt = 22, pb = 30;
  return (
    <Quadro tipo="vb">
      {(W) => {
        const ih = H - pt - pb, sy = (v: number) => (ih * v) / max;
        const gw = (W - pl - pr) / grupos.length, bw = Math.min(56, (gw * 0.86) / series.length);
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {ticks.map((t) => {
              const y = pt + ih - sy(t);
              return (
                <g key={t}>
                  <line x1={pl} x2={W - pr} y1={y} y2={y} className="grid" />
                  <text x={pl - 6} y={y + 4} textAnchor="end" className="muted" fontSize={11}>{fmtTick(t)}</text>
                </g>
              );
            })}
            {grupos.map((g, gi) => {
              const x0 = pl + gi * gw + (gw - series.length * (bw + 2)) / 2;
              return (
                <g key={g.k}>
                  {g.valores.map((v, i) =>
                    v == null ? null : (
                      <BarraGrupo key={i} i={gi * series.length + i} x={x0 + i * (bw + 2)} y={pt + ih - sy(v)} w={bw} h={sy(v)} c={cores[i] ?? "var(--s1)"} lab={fmtValor(v)}
                        tip={<><b>{series[i]} · {g.k}</b><br />{fmtValor(v)}{g.nota ? ` (${g.nota})` : ""}</>} />
                    ),
                  )}
                  <text x={pl + gi * gw + gw / 2} y={H - 8} textAnchor="middle">{g.k}{g.nota ? " *" : ""}</text>
                </g>
              );
            })}
            <line x1={pl} x2={W - pr} y1={pt + ih} y2={pt + ih} stroke="var(--ink-3)" />
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- linha ---------- */
export type PontoLinha = { x: number; k: string; v: number; lab?: string; tip?: ReactNode; rotulo?: boolean };
function PontoL({ p, cx, cy, ultimo, primeiro, c, H, mostrarRotulo, mostrarX }: { p: PontoLinha; cx: number; cy: number; ultimo: boolean; primeiro: boolean; c: string; H: number; mostrarRotulo: boolean; mostrarX: boolean }) {
  const hover = useHover(<><b>{p.k}</b><br />{p.tip ?? p.lab ?? fmt(p.v)}</>);
  const anchor = primeiro ? "start" : ultimo ? "end" : "middle";
  return (
    <g {...hover}>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      {(mostrarRotulo || ultimo) && <circle cx={cx} cy={cy} r={ultimo ? 5.5 : 4} fill={ultimo ? c : "var(--surface)"} stroke={c} strokeWidth={2} />}
      {(mostrarRotulo || ultimo) && <text x={cx} y={cy - 11} textAnchor={anchor} className="val">{p.lab ?? fmt(p.v)}</text>}
      {mostrarX && <text x={cx} y={H - 9} textAnchor={anchor} className="muted" fontSize={11}>{p.k}</text>}
    </g>
  );
}
export function Linha({ pontos, min, max, ticks, c = "var(--s1)", h: H = 240, td = 0, faixa, titulo, rotularTodos = true, rotulosX }: {
  pontos: PontoLinha[]; min: number; max: number; ticks: number[]; c?: string; h?: number; td?: number; faixa?: { de: number; ate: number; rotulo: string }; titulo?: string; rotularTodos?: boolean; rotulosX?: (i: number, n: number) => boolean;
}) {
  const pl = 40, pr = 18, pt = 24, pb = 30;
  if (!pontos.length) return null;
  const xs = pontos.map((p) => p.x), xmin = Math.min(...xs), xmax = Math.max(...xs);
  const sy = (v: number) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  return (
    <Quadro tipo="ln">
      {(W) => {
        const sx = (x: number) => pl + ((W - pl - pr) * (x - xmin)) / Math.max(1e-9, xmax - xmin);
        const dLinha = pontos.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.v)}`).join("");
        // no celular, rótulos só em pontos alternados para não encavalar
        const passo = W < ESTREITO && pontos.length > 5 ? 2 : 1;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pl} x2={W - pr} y1={sy(t)} y2={sy(t)} className="grid" />
                <text x={pl - 6} y={sy(t) + 4} textAnchor="end" className="muted" fontSize={11}>{fmt(t, td)}</text>
              </g>
            ))}
            {faixa && (
              <g>
                <rect x={pl} y={sy(faixa.ate)} width={W - pl - pr} height={sy(faixa.de) - sy(faixa.ate)} fill="var(--crit)" opacity={0.07} />
                <text x={W - pr - 4} y={sy(faixa.ate) + 14} textAnchor="end" className="muted" fontSize={11}>{faixa.rotulo}</text>
              </g>
            )}
            <path d={`${dLinha}L${sx(xmax)},${H - pb}L${sx(xmin)},${H - pb}Z`} fill={c} opacity={0.1} className="area" />
            <path d={dLinha} fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" pathLength={1} className="tracado" />
            {pontos.map((p, i) => (
              <PontoL key={p.k + i} p={p} cx={sx(p.x)} cy={sy(p.v)} primeiro={i === 0} ultimo={i === pontos.length - 1} c={c} H={H}
                mostrarRotulo={(rotularTodos || Boolean(p.rotulo)) && (i % passo === (pontos.length - 1) % passo)}
                mostrarX={(rotulosX ? rotulosX(i, pontos.length) : true) && (i % passo === (pontos.length - 1) % passo || i === 0)} />
            ))}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- barra empilhada única ---------- */
export type Parte = { k: string; v: number; lab: string; c: string; tip?: string };
function SegmentoPilha({ p, x, w, i, n }: { p: Parte; x: number; w: number; i: number; n: number }) {
  const hover = useHover(<><b>{p.k}</b><br />{p.lab}{p.tip ? <><br />{p.tip}</> : null}</>);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={x + (i ? 1 : 0)} y={4} width={Math.max(0, w - (i ? 2 : 0))} height={30} fill={p.c} rx={i === 0 || i === n - 1 ? 4 : 0} className="mark" />
      {w > p.lab.length * 7 && <text x={x + 8} y={54} className="val">{p.lab}</text>}
    </g>
  );
}
export function Pilha({ partes, h: H = 64, titulo }: { partes: Parte[]; h?: number; titulo?: string }) {
  const tot = partes.reduce((a, p) => a + p.v, 0) || 1;
  return (
    <Quadro tipo="hb">
      {(W) => {
        let x = 0;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {partes.map((p, i) => {
              const w = (W * p.v) / tot;
              const el = <SegmentoPilha key={p.k} p={p} x={x} w={w} i={i} n={partes.length} />;
              x += w;
              return el;
            })}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- barras divergentes (positivo/negativo) ---------- */
function LinhaDiv({ r, i, y, mid, sc, W }: { r: { k: string; v: number; bold?: boolean }; i: number; y: number; mid: number; sc: number; W: number }) {
  const w = Math.abs(r.v) * sc, x = r.v < 0 ? mid - w : mid;
  const hover = useHover(<><b>{r.k}</b><br />{r.v > 0 ? "superávit" : "déficit"} de R$ {fmt(Math.abs(r.v), 1)} bi</>);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={0} y={y} width={W} height={40} fill="transparent" />
      <rect x={x} y={y + 8} width={w} height={18} rx={3} fill={r.v < 0 ? "var(--crit)" : "var(--good)"} className={r.v < 0 ? "mark neg" : "mark"} />
      <text x={r.v < 0 ? mid + 8 : mid - 8} y={y + 22} textAnchor={r.v < 0 ? "start" : "end"} className={r.bold ? "val" : undefined}>{r.k}</text>
      <text x={r.v < 0 ? x - 6 : x + w + 6} y={y + 22} textAnchor={r.v < 0 ? "end" : "start"} className="val">{(r.v > 0 ? "+" : "−") + fmt(Math.abs(r.v), 1)}</text>
    </g>
  );
}
export function Divergentes({ dados, titulo }: { dados: { k: string; v: number; bold?: boolean }[]; titulo?: string }) {
  const H = 12 + dados.length * 44;
  const maxNeg = Math.max(1, ...dados.filter((d) => d.v < 0).map((d) => -d.v));
  const maxPos = Math.max(1, ...dados.filter((d) => d.v > 0).map((d) => d.v));
  return (
    <Quadro tipo="hb">
      {(W) => {
        // reserva espaço para rótulos de valor (≈ 52 px de cada lado)
        const sc = (W - 104) / (maxNeg + maxPos);
        const mid = 52 + maxNeg * sc;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            <line x1={mid} x2={mid} y1={0} y2={H} stroke="var(--ink-3)" />
            {dados.map((r, i) => <LinhaDiv key={r.k} r={r} i={i} y={12 + i * 44} mid={mid} sc={sc} W={W} />)}
          </svg>
        );
      }}
    </Quadro>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <div className="legend">
      {itens.map((i) => (
        <span key={i.rotulo}><i style={{ background: i.cor }} />{i.rotulo}</span>
      ))}
    </div>
  );
}
