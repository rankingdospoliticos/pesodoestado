import type { ReactNode } from "react";
import { fmt } from "@/lib/painel/formatos";
import { atraso, ESTREITO, Quadro, useHover } from "./graficos";
import { useRevelar } from "./animacao";

/* =====================================================================
 * Visualizações sob medida: cada uma pensada para um tipo de dado.
 * ===================================================================== */

/* ---------- Waffle: 100 quadrados, cada um uma fração do todo ---------- */
export type ParteWaffle = { k: string; v: number; c: string; lab: string };

function CelulaWaffle({ x, y, s, p, i }: { x: number; y: number; s: number; p: ParteWaffle; i: number }) {
  const hover = useHover(<><b>{p.k}</b><br />{p.lab}</>);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={x} y={y} width={s} height={s} rx={3} fill={p.c} className="cel" />
    </g>
  );
}

export function Waffle({ partes, colunas = 20, unidade, titulo }: { partes: ParteWaffle[]; colunas?: number; unidade: string; titulo: string }) {
  const total = partes.reduce((a, p) => a + p.v, 0);
  // maior resto: garante exatamente 100 células
  const brutos = partes.map((p) => (p.v / total) * 100);
  const cel = brutos.map(Math.floor);
  let falta = 100 - cel.reduce((a, b) => a + b, 0);
  brutos.map((b, i) => [b - Math.floor(b), i] as const).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (falta > 0) { cel[i]! += 1; falta--; } });
  const lista: ParteWaffle[] = [];
  partes.forEach((p, i) => { for (let n = 0; n < (cel[i] ?? 0); n++) lista.push(p); });
  return (
    <Quadro tipo="wf">
      {(larg) => {
        const col = larg < ESTREITO ? 10 : colunas;
        const s = 26, g = 5, linhas = Math.ceil(100 / col);
        const W = col * (s + g) - g, H = linhas * (s + g) - g;
        return (
          <>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={titulo} style={{ maxWidth: col === 10 ? 320 : undefined }}>
              {lista.map((p, i) => (
                <CelulaWaffle key={i} x={(i % col) * (s + g)} y={Math.floor(i / col) * (s + g)} s={s} p={p} i={i} />
              ))}
            </svg>
            <p className="note">Cada quadrado = {unidade}</p>
          </>
        );
      }}
    </Quadro>
  );
}

/* ---------- Treemap: área proporcional ao valor ---------- */
export type ItemArea = { k: string; v: number; lab: string; tip?: ReactNode };
type Ret = { x: number; y: number; w: number; h: number };

function squarify(valores: number[], r: Ret): Ret[] {
  const out: Ret[] = new Array(valores.length);
  const total = valores.reduce((a, b) => a + b, 0) || 1;
  const area = valores.map((v) => (v / total) * r.w * r.h);
  let resto = { ...r };
  let i = 0;
  const pior = (linha: number[], lado: number) => {
    const s = linha.reduce((a, b) => a + b, 0);
    const mx = Math.max(...linha), mn = Math.min(...linha);
    return Math.max((lado * lado * mx) / (s * s), (s * s) / (lado * lado * mn));
  };
  while (i < area.length) {
    const lado = Math.min(resto.w, resto.h);
    const linha: number[] = [area[i]!];
    let j = i + 1;
    while (j < area.length && pior([...linha, area[j]!], lado) <= pior(linha, lado)) { linha.push(area[j]!); j++; }
    const s = linha.reduce((a, b) => a + b, 0);
    if (resto.w >= resto.h) {
      const w = s / resto.h; let y = resto.y;
      linha.forEach((a, n) => { const h = a / w; out[i + n] = { x: resto.x, y, w, h }; y += h; });
      resto = { x: resto.x + w, y: resto.y, w: resto.w - w, h: resto.h };
    } else {
      const h = s / resto.w; let x = resto.x;
      linha.forEach((a, n) => { const w = a / h; out[i + n] = { x, y: resto.y, w, h }; x += w; });
      resto = { x: resto.x, y: resto.y + h, w: resto.w, h: resto.h - h };
    }
    i = j;
  }
  return out;
}

function quebra(txt: string, max: number): string[] {
  const out: string[] = [];
  let atual = "";
  for (const p of txt.split(" ")) {
    if ((atual + " " + p).trim().length > max && atual) { out.push(atual); atual = p; } else atual = (atual + " " + p).trim();
  }
  if (atual) out.push(atual);
  return out;
}

function BlocoArea({ it, r, i, n, cor }: { it: ItemArea; r: Ret; i: number; n: number; cor: string }) {
  const hover = useHover(it.tip ?? <><b>{it.k}</b><br />{it.lab}</>);
  const cabe = r.w > 70 && r.h > 38;
  const linhas = cabe ? quebra(it.k, Math.max(8, Math.floor((r.w - 14) / 8.2))).slice(0, r.h > 70 ? 3 : 1) : [];
  const forte = i < Math.ceil(n / 3);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} rx={4}
        fill={`color-mix(in oklab, ${cor} ${Math.round(100 - (i / Math.max(1, n - 1)) * 62)}%, #FFFFFF)`} className="bloco" />
      {cabe && (
        <text x={r.x + 10} y={r.y + 22} className={forte ? "tm-l claro" : "tm-l"}>
          {linhas.map((l, j) => <tspan key={j} x={r.x + 10} dy={j ? 15 : 0}>{l}{j === linhas.length - 1 && quebra(it.k, Math.max(8, Math.floor((r.w - 14) / 8.2))).length > linhas.length ? "…" : ""}</tspan>)}
          <tspan x={r.x + 10} dy={18} className="tm-v">{it.lab}</tspan>
        </text>
      )}
    </g>
  );
}

export function Treemap({ itens, h = 340, cor = "var(--s1)", titulo }: { itens: ItemArea[]; h?: number; cor?: string; titulo: string }) {
  const ord = [...itens].sort((a, b) => b.v - a.v);
  return (
    <Quadro tipo="tm">
      {(W) => {
        const H = W < ESTREITO ? Math.round(h * 1.15) : h;
        const rets = squarify(ord.map((x) => x.v), { x: 0, y: 0, w: W, h: H });
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {ord.map((it, i) => <BlocoArea key={it.k} it={it} r={rets[i]!} i={i} n={ord.length} cor={cor} />)}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- Bolhas: círculos com área proporcional ---------- */
export type Bolha = { k: string; v: number; lab: string; c: string; bold?: boolean };
function CirculoBolha({ b, cx, base, r, i }: { b: Bolha; cx: number; base: number; r: number; i: number }) {
  const hover = useHover(<><b>{b.k}</b><br />{b.lab}</>);
  return (
    <g {...hover} style={atraso(i)}>
      <circle cx={cx} cy={base - r} r={r} fill={b.c} className="bolha" />
      <text x={cx} y={base - r + (r > 26 ? 7 : 5)} textAnchor="middle" className={r > 26 ? "val claro" : "val"} fontSize={r > 26 ? 20 : 12} dy={r > 26 ? 0 : -r - 8}>{b.lab}</text>
      <text x={cx} y={base + 18} textAnchor="middle" className={b.bold ? "val" : undefined}>{b.k}</text>
    </g>
  );
}
export function Bolhas({ dados, rmax = 92, titulo }: { dados: Bolha[]; rmax?: number; titulo: string }) {
  const vmax = Math.max(...dados.map((d) => d.v));
  return (
    <Quadro tipo="bo">
      {(W) => {
        const espaco = W < ESTREITO ? 24 : 40;
        const soma = dados.reduce((a, d) => a + 2 * Math.sqrt(d.v / vmax), 0);
        const R = Math.min(rmax, (W - (dados.length - 1) * espaco - 8) / soma);
        const raios = dados.map((d) => R * Math.sqrt(d.v / vmax));
        const H = R * 2 + 44, base = R * 2 + 14;
        const larg = raios.reduce((a, r) => a + r * 2, 0) + (dados.length - 1) * espaco;
        let x = (W - larg) / 2;
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            <line x1={0} x2={W} y1={base} y2={base} className="grid" />
            {dados.map((d, i) => {
              const r = raios[i]!;
              const cx = x + r;
              x += r * 2 + espaco;
              return <CirculoBolha key={d.k} b={d} cx={cx} base={base} r={r} i={i} />;
            })}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- Halteres: dois pontos ligados (Brasil × referência) ---------- */
export type Haltere = { k: string; a: number; b: number; nota?: string };
function LinhaHaltere({ d, y, sx, ca, cb, i, fmtV, W }: { d: Haltere; y: number; sx: (v: number) => number; ca: string; cb: string; i: number; fmtV: (n: number) => string; W: number }) {
  const dif = d.a - d.b;
  const hover = useHover(<><b>{d.k}</b><br />Brasil {fmtV(d.a)} · OCDE {fmtV(d.b)}<br />Diferença: {fmt(dif)} pontos{d.nota ? <><br />{d.nota}</> : null}</>);
  const x1 = sx(d.a), x2 = sx(d.b);
  return (
    <g {...hover} style={atraso(i)}>
      <rect x={0} y={y - 22} width={W} height={44} fill="transparent" />
      <text x={0} y={y + 4}>{d.k}</text>
      <line x1={x1} x2={x2} y1={y} y2={y} stroke="var(--line)" strokeWidth={6} strokeLinecap="round" className="haste" />
      <text x={(x1 + x2) / 2} y={y - 10} textAnchor="middle" className="val crit-t">{fmt(dif)}</text>
      <circle cx={x2} cy={y} r={8} fill={cb} stroke="var(--surface)" strokeWidth={2} className="ponto-b" />
      <circle cx={x1} cy={y} r={8} fill={ca} stroke="var(--surface)" strokeWidth={2} className="ponto-a" />
      <text x={x1 - 13} y={y + 4} textAnchor="end" className="val">{fmtV(d.a)}</text>
      <text x={x2 + 13} y={y + 4} className="muted">{fmtV(d.b)}</text>
    </g>
  );
}
export function Halteres({ dados, min, max, ticks, ca = "var(--crit)", cb = "var(--ink-3)", titulo, fmtV = (n: number) => fmt(n) }: {
  dados: Haltere[]; min: number; max: number; ticks: number[]; ca?: string; cb?: string; titulo: string; fmtV?: (n: number) => string;
}) {
  const rh = 56, top = 30;
  const H = top + dados.length * rh + 20;
  return (
    <Quadro tipo="ha">
      {(W) => {
        const pl = W < ESTREITO ? 78 : 110, pr = 40;
        const sx = (v: number) => pl + 30 + ((W - pl - pr - 30) * (v - min)) / (max - min);
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={sx(t)} x2={sx(t)} y1={top - 10} y2={H - 18} className="grid" />
                <text x={sx(t)} y={H - 4} textAnchor="middle" className="muted" fontSize={11}>{fmt(t)}</text>
              </g>
            ))}
            {dados.map((d, i) => <LinhaHaltere key={d.k} d={d} y={top + i * rh + rh / 2} sx={sx} ca={ca} cb={cb} i={i} fmtV={fmtV} W={W} />)}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- Termômetro: régua com faixas de classificação ---------- */
export type Faixa = { de: number; ate: number; rotulo: string; curto?: string };
export type Marco = { k: string; v: number; destaque?: boolean; antes?: number; antesRotulo?: string };
function MarcoT({ m, x, xLinha, y, linhaY, i, base }: { m: Marco; x: number; xLinha?: number; y: number; linhaY: number; i: number; base: number }) {
  const xl = xLinha ?? x;
  const hover = useHover(<><b>{m.k}</b><br />nota {fmt(m.v, 1)}{m.antes != null ? <><br />{m.antesRotulo}: {fmt(m.antes, 1)}</> : null}</>);
  return (
    <g {...hover} style={atraso(i)} className={m.destaque ? "marco destaque" : "marco"}>
      <line x1={xl} x2={xl} y1={base} y2={linhaY} stroke={m.destaque ? "var(--crit)" : "var(--ink-3)"} strokeWidth={m.destaque ? 2 : 1} />
      <circle cx={xl} cy={base} r={m.destaque ? 9 : 6} fill={m.destaque ? "var(--crit)" : "var(--surface)"} stroke={m.destaque ? "var(--surface)" : "var(--ink-2)"} strokeWidth={2} />
      <text x={x} y={y} textAnchor="middle" className={m.destaque ? "val crit-t grande" : undefined}>{m.k}</text>
      <text x={x} y={y + (m.destaque ? 17 : 14)} textAnchor="middle" className={m.destaque ? "val crit-t" : "val"} fontSize={m.destaque ? 13 : 11.5}>{fmt(m.v, 1)}</text>
    </g>
  );
}
export function Termometro({ faixas, marcos, min = 0, max = 100, cor = "var(--seq)", titulo }: { faixas: Faixa[]; marcos: Marco[]; min?: number; max?: number; cor?: string; titulo: string }) {
  return (
    <Quadro tipo="te">
      {(W) => {
        const estreito = W < ESTREITO;
        const pl = 12, pr = 12, base = 112, bh = 26;
        const sx = (v: number) => pl + ((W - pl - pr) * (v - min)) / (max - min);
        // rótulos: destaque acima, demais abaixo em níveis para não colidir
        const ord = [...marcos].filter((m) => !m.destaque).sort((a, b) => a.v - b.v);
        const niveis: number[] = [];
        const nivelDe = new Map<string, number>();
        for (const m of ord) {
          const x = sx(m.v);
          let n = 0;
          while (niveis[n] != null && x - niveis[n]! < (estreito ? 78 : 92)) n++;
          niveis[n] = x;
          nivelDe.set(m.k, n);
        }
        const maxNivel = Math.max(0, ...nivelDe.values());
        const H = base + bh / 2 + 44 + maxNivel * 34 + 10;
        const dest = marcos.find((m) => m.destaque);
        return (
          <svg viewBox={`0 0 ${W} ${H}`} width={W} role="img" aria-label={titulo}>
            {faixas.map((f, i) => (
              <g key={f.rotulo} style={atraso(i)}>
                <rect x={sx(f.de)} y={base - bh / 2} width={sx(f.ate) - sx(f.de) - 2} height={bh} rx={4}
                  fill={`color-mix(in oklab, ${cor} ${Math.round(12 + (i / Math.max(1, faixas.length - 1)) * 70)}%, #FFFFFF)`} className="faixa" />
                <text x={(sx(f.de) + sx(f.ate)) / 2} y={base - bh / 2 - (i % 2 ? 22 : 8)} textAnchor="middle" className="muted" fontSize={10.5}>{estreito && f.curto ? f.curto : f.rotulo}</text>
              </g>
            ))}
            {dest?.antes != null && (
              <g className="seta">
                <line x1={sx(dest.antes)} x2={sx(dest.v) + 12} y1={base} y2={base} stroke="var(--crit)" strokeWidth={2} strokeDasharray="3 3" />
                <circle cx={sx(dest.antes)} cy={base} r={6} fill="var(--surface)" stroke="var(--crit)" strokeWidth={2} strokeDasharray="2 2" />
              </g>
            )}
            {marcos.map((m, i) => {
              const x = Math.max(36, Math.min(W - 36, sx(m.v)));
              if (m.destaque) return <MarcoT key={m.k} m={m} x={sx(m.v)} y={28} linhaY={44} i={i} base={base} />;
              const n = nivelDe.get(m.k) ?? 0;
              const y = base + bh / 2 + 24 + n * 34;
              return <MarcoT key={m.k} m={m} x={x} xLinha={sx(m.v)} y={y} linhaY={y - 12} i={i} base={base} />;
            })}
          </svg>
        );
      }}
    </Quadro>
  );
}

/* ---------- Versus: dois números lado a lado, com barras proporcionais ---------- */
export type LadoVs = { rotulo: string; v: number; lab: string; c: string; nota?: string };
export function Versus({ a, b, fator, legenda }: { a: LadoVs; b: LadoVs; fator?: string; legenda?: ReactNode }) {
  const [ref, estado] = useRevelar<HTMLDivElement>();
  const mx = Math.max(a.v, b.v);
  return (
    <div ref={ref} className={`versus ${estado}`}>
      {[a, b].map((l, i) => (
        <div key={l.rotulo} className="vs-l" style={atraso(i)}>
          <div className="vs-top"><span className="vs-r">{l.rotulo}</span><b className="vs-v" style={{ color: l.c }}>{l.lab}</b></div>
          <div className="vs-trilho"><i style={{ width: `${(l.v / mx) * 100}%`, background: l.c }} /></div>
          {l.nota ? <span className="note">{l.nota}</span> : null}
        </div>
      ))}
      {fator ? <div className="vs-fator"><b>{fator}</b>{legenda ? <span>{legenda}</span> : null}</div> : null}
    </div>
  );
}

/* ---------- Calendário: 12 meses, dias pagando tributos em destaque ---------- */
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export function Calendario({ dias, rotuloDia }: { dias: number; rotuloDia: string }) {
  const [ref, estado] = useRevelar<HTMLDivElement>();
  let n = 0;
  return (
    <div ref={ref} className={`cal ${estado}`} role="img" aria-label={`${dias} de 365 dias do ano destacados; ${rotuloDia}`}>
      {MESES.map((m, mi) => (
        <div key={m} className="cal-mes">
          <span className="cal-nome">{m}</span>
          <span className="cal-dias">
            {Array.from({ length: DIAS_MES[mi]! }, (_, d) => {
              n++;
              const t = n <= dias;
              const ultimo = n === dias;
              return <i key={d} className={t ? (ultimo ? "t u" : "t") : undefined} style={t ? atraso(n) : undefined} />;
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
