import { createContext, useCallback, useContext, useState, type ReactNode, type MouseEvent, type FocusEvent } from "react";
import { fmt } from "@/lib/painel/formatos";

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

/** Props para um grupo SVG que mostra tooltip no hover e no foco do teclado. */
function useHover(conteudo: ReactNode) {
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

/* ---------- barras horizontais ---------- */
export type Barra = { k: string; v: number; c?: string; lab?: string; tip?: ReactNode; bold?: boolean };

function LinhaBarra({ r, i, lw, rh, bh, top, sx, d }: { r: Barra; i: number; lw: number; rh: number; bh: number; top: number; sx: (v: number) => number; d: number }) {
  const y = top + i * rh;
  const w = Math.max(2, sx(r.v));
  const lab = r.lab ?? fmt(r.v, d);
  const hover = useHover(r.tip ?? <><b>{r.k}</b><br />{lab}</>);
  return (
    <g {...hover}>
      <rect x={0} y={y} width={640} height={rh} fill="transparent" />
      <text x={lw - 10} y={y + rh / 2 + 4} textAnchor="end" className={r.bold ? "val" : undefined}>{r.k}</text>
      <path d={hbarPath(lw, y + (rh - bh) / 2, w, bh)} fill={r.c ?? "var(--s1)"} className="mark" />
      <text x={lw + w + 6} y={y + rh / 2 + 4} className="val">{lab}</text>
    </g>
  );
}

export function HBarras({ dados, lw = 170, rw = 90, rh = 30, bh = 14, max, referencia: refV, refLabel, d = 0, titulo }: {
  dados: Barra[]; lw?: number; rw?: number; rh?: number; bh?: number; max?: number; referencia?: number; refLabel?: string; d?: number; titulo?: string;
}) {
  const W = 640, top = 6;
  const H = top + dados.length * rh + 4;
  const m = max ?? Math.max(...dados.map((r) => r.v), 1);
  const sx = (v: number) => ((W - lw - rw) * v) / m;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo}>
        {refV != null && (
          <g>
            <line x1={lw + sx(refV)} x2={lw + sx(refV)} y1={0} y2={H} stroke="var(--ink-3)" strokeDasharray="3 3" />
            <text x={lw + sx(refV) + 4} y={10} className="muted" fontSize={11}>{refLabel}</text>
          </g>
        )}
        {dados.map((r, i) => (
          <LinhaBarra key={r.k + i} r={r} i={i} lw={lw} rh={rh} bh={bh} top={top} sx={sx} d={d} />
        ))}
      </svg>
    </div>
  );
}

/* ---------- barras verticais ---------- */
function ColunaBarra({ r, x, w, y, h, bx, bw, pt, ih, H, d }: { r: Barra; x: number; w: number; y: number; h: number; bx: number; bw: number; pt: number; ih: number; H: number; d: number }) {
  const lab = r.lab ?? fmt(r.v, d);
  const hover = useHover(r.tip ?? <><b>{r.k}</b><br />{lab}</>);
  return (
    <g {...hover}>
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
  const W = 640, pl = 44, pr = 10, pt = 22, pb = 28;
  const m = max ?? Math.max(...dados.map((r) => r.v), 1) * 1.12;
  const ih = H - pt - pb, iw = W - pl - pr;
  const sy = (v: number) => (ih * v) / m;
  const bw = iw / Math.max(1, dados.length);
  const w = Math.min(56, bw * 0.56);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo}>
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
          return <ColunaBarra key={r.k + i} r={r} x={x} w={w} y={pt + ih - h} h={h} bx={pl + i * bw} bw={bw} pt={pt} ih={ih} H={H} d={d} />;
        })}
        <line x1={pl} x2={W - pr} y1={pt + ih} y2={pt + ih} stroke="var(--ink-3)" />
      </svg>
    </div>
  );
}

/* ---------- barras agrupadas (2 ou 3 séries por categoria) ---------- */
export type Grupo = { k: string; valores: (number | null)[]; nota?: string };
function BarraGrupo({ x, y, w, h, c, lab, tip }: { x: number; y: number; w: number; h: number; c: string; lab: string; tip: ReactNode }) {
  const hover = useHover(tip);
  return (
    <g {...hover}>
      <path d={vbarPath(x, y, w, h)} fill={c} className="mark" />
      <text x={x + w / 2} y={y - 6} textAnchor="middle" className="val" fontSize={11}>{lab}</text>
    </g>
  );
}
export function BarrasAgrupadas({ grupos, series, cores, max, ticks, fmtValor, fmtTick, h: H = 230, titulo }: {
  grupos: Grupo[]; series: string[]; cores: string[]; max: number; ticks: number[]; fmtValor: (n: number) => string; fmtTick: (n: number) => string; h?: number; titulo?: string;
}) {
  const W = 640, pl = 44, pr = 10, pt = 22, pb = 30;
  const ih = H - pt - pb, sy = (v: number) => (ih * v) / max;
  const gw = (W - pl - pr) / grupos.length, bw = Math.min(56, (gw * 0.8) / series.length);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo}>
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
                  <BarraGrupo key={i} x={x0 + i * (bw + 2)} y={pt + ih - sy(v)} w={bw} h={sy(v)} c={cores[i] ?? "var(--s1)"} lab={fmtValor(v)}
                    tip={<><b>{series[i]} · {g.k}</b><br />{fmtValor(v)}{g.nota ? ` (${g.nota})` : ""}</>} />
                ),
              )}
              <text x={pl + gi * gw + gw / 2} y={H - 8} textAnchor="middle">{g.k}{g.nota ? " *" : ""}</text>
            </g>
          );
        })}
        <line x1={pl} x2={W - pr} y1={pt + ih} y2={pt + ih} stroke="var(--ink-3)" />
      </svg>
    </div>
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
  const W = 640, pl = 44, pr = 24, pt = 24, pb = 30;
  if (!pontos.length) return null;
  const xs = pontos.map((p) => p.x), xmin = Math.min(...xs), xmax = Math.max(...xs);
  const sx = (x: number) => pl + ((W - pl - pr) * (x - xmin)) / Math.max(1e-9, xmax - xmin);
  const sy = (v: number) => pt + (H - pt - pb) * (1 - (v - min) / (max - min));
  const dLinha = pontos.map((p, i) => `${i ? "L" : "M"}${sx(p.x)},${sy(p.v)}`).join("");
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo}>
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
        <path d={`${dLinha}L${sx(xmax)},${H - pb}L${sx(xmin)},${H - pb}Z`} fill={c} opacity={0.1} />
        <path d={dLinha} fill="none" stroke={c} strokeWidth={2} strokeLinejoin="round" />
        {pontos.map((p, i) => (
          <PontoL key={p.k + i} p={p} cx={sx(p.x)} cy={sy(p.v)} primeiro={i === 0} ultimo={i === pontos.length - 1} c={c} H={H}
            mostrarRotulo={rotularTodos || Boolean(p.rotulo)} mostrarX={rotulosX ? rotulosX(i, pontos.length) : true} />
        ))}
      </svg>
    </div>
  );
}

/* ---------- barra empilhada única ---------- */
export type Parte = { k: string; v: number; lab: string; c: string; tip?: string };
function SegmentoPilha({ p, x, w, i, n }: { p: Parte; x: number; w: number; i: number; n: number }) {
  const hover = useHover(<><b>{p.k}</b><br />{p.lab}{p.tip ? <><br />{p.tip}</> : null}</>);
  return (
    <g {...hover}>
      <rect x={x + (i ? 1 : 0)} y={4} width={Math.max(0, w - (i ? 2 : 0))} height={30} fill={p.c} rx={i === 0 || i === n - 1 ? 4 : 0} className="mark" />
      {w > 58 && <text x={x + 8} y={54} className="val">{p.lab}</text>}
    </g>
  );
}
export function Pilha({ partes, h: H = 64, titulo }: { partes: Parte[]; h?: number; titulo?: string }) {
  const W = 640;
  const tot = partes.reduce((a, p) => a + p.v, 0) || 1;
  let x = 0;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo}>
        {partes.map((p, i) => {
          const w = (W * p.v) / tot;
          const el = <SegmentoPilha key={p.k} p={p} x={x} w={w} i={i} n={partes.length} />;
          x += w;
          return el;
        })}
      </svg>
    </div>
  );
}

/* ---------- barras divergentes (positivo/negativo) ---------- */
function LinhaDiv({ r, y, mid, sc }: { r: { k: string; v: number; bold?: boolean }; y: number; mid: number; sc: number }) {
  const w = Math.abs(r.v) * sc, x = r.v < 0 ? mid - w : mid;
  const hover = useHover(<><b>{r.k}</b><br />{r.v > 0 ? "superávit" : "déficit"} de R$ {fmt(Math.abs(r.v), 1)} bi</>);
  return (
    <g {...hover}>
      <rect x={0} y={y} width={640} height={40} fill="transparent" />
      <rect x={x} y={y + 8} width={w} height={18} rx={3} fill={r.v < 0 ? "var(--crit)" : "var(--good)"} className="mark" />
      <text x={r.v < 0 ? mid + 8 : mid - 8} y={y + 22} textAnchor={r.v < 0 ? "start" : "end"} className={r.bold ? "val" : undefined}>{r.k}</text>
      <text x={r.v < 0 ? x - 6 : x + w + 6} y={y + 22} textAnchor={r.v < 0 ? "end" : "start"} className="val">{(r.v > 0 ? "+" : "−") + fmt(Math.abs(r.v), 1)}</text>
    </g>
  );
}
export function Divergentes({ dados, mid = 360, sc = 0.9, titulo }: { dados: { k: string; v: number; bold?: boolean }[]; mid?: number; sc?: number; titulo?: string }) {
  const H = 12 + dados.length * 44;
  return (
    <div className="chart">
      <svg viewBox={`0 0 640 ${H}`} role="img" aria-label={titulo}>
        <line x1={mid} x2={mid} y1={0} y2={H} stroke="var(--ink-3)" />
        {dados.map((r, i) => <LinhaDiv key={r.k} r={r} y={12 + i * 44} mid={mid} sc={sc} />)}
      </svg>
    </div>
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
