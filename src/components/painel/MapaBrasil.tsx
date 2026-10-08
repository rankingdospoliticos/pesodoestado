import { useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { Painel } from "@/lib/painel/dados";
import { fmt, reais } from "@/lib/painel/formatos";
import { CONTORNOS, MAPA_CREDITO } from "@/data/mapa-brasil";
import { UF_GRADE, imlee, cnaeEstadual, municipiosLLE, cadeirasCamara, regiaoUF, lleNacional } from "@/data/curados";
import { useTip } from "./graficos";
import { useRevelar } from "./animacao";

type Modo = "imlee" | "cnae" | "mun" | "cota";
type Valor = number | "lei" | "sem" | undefined;

type DefModo = {
  rotulo: string; titulo: string; dados: Record<string, Valor>; min: number; max: number;
  fmt: (v: Valor) => string; nota: string; fonte: string; lo: string; hi: string;
  cor: string; // matiz da escala sequencial (claro → escuro)
  brasil: string; // referência nacional
  maiorEMelhor: boolean;
};

const UFS = Object.keys(CONTORNOS);

/** Rótulos: posição dentro do estado ou chamada lateral (estados pequenos do litoral). */
const CHAMADAS: Record<string, [number, number]> = {
  RN: [628, 160], PB: [628, 184], PE: [628, 208], AL: [628, 232], SE: [628, 256], ES: [556, 404], RJ: [520, 458],
};
const AJUSTE: Record<string, [number, number]> = { GO: [372, 348], DF: [409.4, 333], MG: [462, 372], PA: [318, 140], AM: [140, 140] };

function construirModos(p: Painel): Record<Modo, DefModo> {
  const cotaUF: Record<string, Valor> = {};
  for (const x of p.dados.camara?.porUF ?? []) {
    const cad = cadeirasCamara[x.nome];
    if (cad) cotaUF[x.nome] = x.valor / cad;
  }
  const valsCota = Object.values(cotaUF).filter((v): v is number => typeof v === "number");
  const ano = p.dados.camara?.ano ?? new Date().getFullYear();
  const mediaCota = p.dados.camara ? p.dados.camara.total / 513 : 0;
  return {
    imlee: {
      rotulo: "Liberdade econômica", titulo: "Índice Mackenzie de Liberdade Econômica Estadual", dados: imlee, min: 3.9, max: 6.3,
      fmt: (v) => (typeof v === "number" ? fmt(v, 2) : "sem dado"),
      nota: "Escala de 0 a 10. Combina gasto do governo estadual, tributação e regras do mercado de trabalho, com dados de 2023. O Distrito Federal não é avaliado.",
      fonte: "Mackenzie, IMLEE 2025", lo: "3,96", hi: "6,26", cor: "var(--seq)", brasil: "Média nacional: 5,10", maiorEMelhor: true,
    },
    cnae: {
      rotulo: "Atividades sem alvará", titulo: "Atividades dispensadas de alvará pela lei estadual", dados: cnaeEstadual, min: 250, max: 980,
      fmt: (v) => (typeof v === "number" ? `${fmt(v)} atividades` : v === "lei" ? "lei sem lista" : v === "sem" ? "sem lei" : "sem dado"),
      nota: "Atividades econômicas (CNAEs) de baixo risco liberadas de alvará. A lei federal libera 298; abaixo disso, o estado não foi além da regra federal.",
      fonte: "ILISP / Liberdade para Trabalhar, jul/2026", lo: "264", hi: "975", cor: "var(--seq)", brasil: "Lei federal: 298 atividades", maiorEMelhor: true,
    },
    mun: {
      rotulo: "Municípios com a lei", titulo: "Municípios que aprovaram a Lei de Liberdade Econômica", dados: municipiosLLE, min: 0, max: 100,
      fmt: (v) => (typeof v === "number" ? `${fmt(v, 1).replace(",0", "")}%` : "sem dado"),
      nota: "% dos municípios do estado com lei ou decreto de liberdade econômica. Em SP todos aderiram, mas a maioria ainda não definiu a lista de atividades. Sem dado na fonte: PR, RJ e DF.",
      fonte: "ILISP / Liberdade para Trabalhar, out/2026", lo: "0%", hi: "100%", cor: "var(--seq)", brasil: `Brasil: ${fmt(lleNacional.pct, 1)}% (${fmt(lleNacional.municipios)} de ${fmt(lleNacional.total)})`, maiorEMelhor: true,
    },
    cota: {
      rotulo: "Cota parlamentar (ao vivo)", titulo: `Cota parlamentar por cadeira de deputado em ${ano}`, dados: cotaUF,
      min: valsCota.length ? Math.min(...valsCota) : 0, max: valsCota.length ? Math.max(...valsCota) : 1,
      fmt: (v) => (typeof v === "number" ? reais(v, 0) : "sem dado"),
      nota: "Total gasto pelos deputados de cada estado dividido pelo número de cadeiras. O teto da cota é maior para estados longe de Brasília. Atualizado automaticamente com os dados abertos da Câmara.",
      fonte: "Câmara dos Deputados, dados abertos da cota parlamentar", lo: valsCota.length ? reais(Math.min(...valsCota), 0) : "", hi: valsCota.length ? reais(Math.max(...valsCota), 0) : "",
      cor: "#B4530A", brasil: `Média nacional: ${reais(mediaCota, 0)} por cadeira`, maiorEMelhor: false,
    },
  };
}

const t01 = (v: number, m: DefModo) => Math.max(0, Math.min(1, (v - m.min) / (m.max - m.min || 1)));

function preenchimento(v: Valor, m: DefModo): string {
  if (typeof v === "number") return `color-mix(in oklab, ${m.cor} ${Math.round(14 + t01(v, m) * 86)}%, #EEF1F3)`;
  if (v === "sem") return "url(#pad-sem)";
  if (v === "lei") return "url(#pad-lei)";
  return "#E3E3E6";
}

function ranking(m: DefModo) {
  return UFS.map((k) => [k, m.dados[k]] as const)
    .filter(([, v]) => v != null)
    .sort((a, b) => (typeof b[1] === "number" ? b[1] : -1) - (typeof a[1] === "number" ? a[1] : -1));
}

export function MapaBrasil({ p }: { p: Painel }) {
  const MODOS = useMemo(() => construirModos(p), [p]);
  const temCota = Object.keys(MODOS.cota.dados).length > 0;
  const [modo, setModo] = useState<Modo>("imlee");
  const [sel, setSel] = useState<string | null>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [todos, setTodos] = useState(false);
  const [ref, estado] = useRevelar<HTMLDivElement>();
  const { mostrar, esconder } = useTip();
  const m = MODOS[modo];
  const lista = ranking(m);
  const posicao = (uf: string) => {
    const i = lista.filter(([, v]) => typeof v === "number").findIndex(([k]) => k === uf);
    return i < 0 ? null : i + 1;
  };
  const nNum = lista.filter(([, v]) => typeof v === "number").length;
  const nome = (uf: string) => UF_GRADE[uf]?.n ?? uf;
  const dica = (uf: string) => (
    <>
      <b>{nome(uf)}</b>
      <br />
      {m.fmt(m.dados[uf])}
      {posicao(uf) ? ` · ${posicao(uf)}º de ${nNum}` : ""}
    </>
  );
  const destaque = foco ?? sel;
  const ordemX = useMemo(() => [...UFS].sort((a, b) => (CONTORNOS[a]?.cx ?? 0) - (CONTORNOS[b]?.cx ?? 0)), []);
  const escolher = (uf: string) => setSel((s) => (s === uf ? null : uf));
  const tecla = (e: KeyboardEvent, uf: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      escolher(uf);
    }
  };

  const modos = (Object.keys(MODOS) as Modo[]).filter((k) => k !== "cota" || temCota);

  return (
    <div className="panel mapa-painel">
      <div className="toggle" role="group" aria-label="Indicador do mapa">
        {modos.map((k) => (
          <button key={k} type="button" aria-pressed={modo === k} onClick={() => setModo(k)}>{MODOS[k].rotulo}</button>
        ))}
      </div>
      <div className="maprow">
        <div className="mapa-col">
          <h3 className="mapa-titulo">{m.titulo}</h3>
          <div ref={ref} className={`mapa ${estado}`}>
            <svg viewBox="0 0 660 639" role="img" aria-label={`Mapa do Brasil: ${m.titulo}`}>
              <defs>
                <pattern id="pad-sem" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="#F6E3E2" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#C2312C" strokeWidth="2" opacity=".55" />
                </pattern>
                <pattern id="pad-lei" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
                  <rect width="6" height="6" fill="#EEF1F3" />
                  <line x1="0" y1="0" x2="0" y2="6" stroke="#5C5E66" strokeWidth="2" opacity=".5" />
                </pattern>
                <filter id="sombra-uf" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#021E2F" floodOpacity=".35" />
                </filter>
              </defs>
              <g>
                {ordemX.map((uf, i) => {
                  const c = CONTORNOS[uf]!;
                  return (
                    <path
                      key={uf}
                      d={c.d}
                      className={`uf${sel === uf ? " sel" : ""}`}
                      style={{ fill: preenchimento(m.dados[uf], m), "--i": i } as CSSProperties}
                      tabIndex={0}
                      role="button"
                      aria-pressed={sel === uf}
                      aria-label={`${nome(uf)}: ${m.fmt(m.dados[uf])}`}
                      onMouseEnter={(e) => { setFoco(uf); mostrar(e, dica(uf)); }}
                      onMouseMove={(e) => mostrar(e, dica(uf))}
                      onMouseLeave={() => { setFoco(null); esconder(); }}
                      onFocus={(e) => { setFoco(uf); const r = e.currentTarget.getBoundingClientRect(); mostrar({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, dica(uf)); }}
                      onBlur={() => { setFoco(null); esconder(); }}
                      onClick={() => escolher(uf)}
                      onKeyDown={(e) => tecla(e, uf)}
                    />
                  );
                })}
              </g>
              {destaque && CONTORNOS[destaque] && (
                <path d={CONTORNOS[destaque]!.d} className="uf-contorno" filter="url(#sombra-uf)" style={{ fill: preenchimento(m.dados[destaque], m) }} pointerEvents="none" />
              )}
              <g className="rotulos" aria-hidden="true">
                {UFS.map((uf) => {
                  const c = CONTORNOS[uf]!;
                  const ch = CHAMADAS[uf];
                  const [x, y] = AJUSTE[uf] ?? [c.cx, c.cy];
                  const escuro = typeof m.dados[uf] === "number" && t01(m.dados[uf] as number, m) > 0.55;
                  if (ch) {
                    return (
                      <g key={uf} className={destaque === uf ? "ativo" : undefined}>
                        <line x1={c.cx} y1={c.cy} x2={ch[0] - 14} y2={ch[1] - 4} className="chamada" />
                        <circle cx={c.cx} cy={c.cy} r={1.8} className="ponto" />
                        <text x={ch[0]} y={ch[1]} textAnchor="middle">{uf}</text>
                      </g>
                    );
                  }
                  return (
                    <text key={uf} x={x} y={y + 4} textAnchor="middle" className={`${escuro ? "claro" : ""}${uf === "DF" ? " mini" : ""}${destaque === uf ? " ativo" : ""}`}>{uf}</text>
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="scale">
            <span>{m.maiorEMelhor ? "menos" : "menor"} {m.lo}</span>
            <span className="bar" style={{ background: `linear-gradient(90deg,color-mix(in oklab,${m.cor} 14%,#EEF1F3),${m.cor})` }} />
            <span>{m.hi} {m.maiorEMelhor ? "mais" : "maior"}</span>
          </div>
          <div className="scale">
            {modo === "cnae" && <><span><i className="sw sw-lei" />lei sem lista</span><span><i className="sw sw-sem" />sem lei</span></>}
            <span><i className="sw sw-nd" />sem dado</span>
          </div>
        </div>
        <div className="mapa-lado">
          <FichaEstado uf={sel} modos={MODOS} modo={modo} posicao={posicao} nNum={nNum} onLimpar={() => setSel(null)} />
          <ol className={`ranklist${todos ? "" : " curta"}`}>
            {lista.map(([k, v], i) => {
              const num = typeof v === "number";
              return (
                <li key={k} className={k === sel ? "hl" : k === foco ? "fo" : undefined}>
                  <button type="button" onClick={() => escolher(k)} onMouseEnter={() => setFoco(k)} onMouseLeave={() => setFoco(null)} aria-pressed={k === sel}>
                    <span className="p">{num ? i + 1 : "–"}</span>
                    <span>{nome(k)}</span>
                    <span className="x">{m.fmt(v)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {!todos && lista.length > 10 && <button type="button" className="ranklist-mais" onClick={() => setTodos(true)}>Ver os {lista.length} estados</button>}
          <p className="note">{m.nota}</p>
        </div>
      </div>
      <p className="src">{m.fonte} · {MAPA_CREDITO}</p>
    </div>
  );
}

function FichaEstado({ uf, modos, modo, posicao, nNum, onLimpar }: {
  uf: string | null; modos: Record<Modo, DefModo>; modo: Modo; posicao: (uf: string) => number | null; nNum: number; onLimpar: () => void;
}) {
  const m = modos[modo];
  if (!uf) {
    return (
      <div className="ficha vazia">
        <span className="ficha-k">Brasil</span>
        <b className="ficha-v">{m.brasil}</b>
        <span className="note">Toque em um estado no mapa ou na lista para ver o raio-x dele.</span>
      </div>
    );
  }
  const pos = posicao(uf);
  return (
    <div className="ficha">
      <div className="ficha-topo">
        <span className="ficha-k">{UF_GRADE[uf]?.n ?? uf} · {regiaoUF[uf]}</span>
        <button type="button" className="ficha-x" onClick={onLimpar} aria-label="Fechar">×</button>
      </div>
      <b className="ficha-v">{m.fmt(m.dados[uf])}</b>
      <span className="note">{pos ? `${pos}º de ${nNum} no ranking` : "fora do ranking"} · {m.brasil}</span>
      <div className="ficha-linhas">
        {(Object.keys(modos) as Modo[]).filter((k) => Object.keys(modos[k].dados).length > 0).map((k) => {
          const d = modos[k], v = d.dados[uf];
          const t = typeof v === "number" ? t01(v, d) : 0;
          return (
            <div key={k} className={`ficha-l${k === modo ? " atual" : ""}`}>
              <span>{d.rotulo}</span>
              <span className="ficha-barra"><i style={{ width: `${Math.max(3, t * 100)}%`, background: typeof v === "number" ? d.cor : "var(--none)" }} /></span>
              <b>{d.fmt(v)}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
