import { useState } from "react";
import type { Painel } from "@/lib/painel/dados";
import { fmt, mesAno, reais } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { ORDEM, qtd, quantos, UNIDADES, type Unidade } from "@/lib/painel/equivalencias";
import { HBarras, Legenda, Pilha, atraso } from "./graficos";
import { Contador, ContadorVivo } from "./animacao";
import { Calendario, Versus } from "./visuais";
import { Icone, IconeG } from "./icones";
import { Caixa, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

/** Arrecadação estimada em 12 meses: carga tributária (Tesouro) × PIB acumulado em 12 meses (Banco Central). */
export function arrecadacao(p: Painel) {
  const pib = p.dados.bcb?.["pib12mR"];
  const pibR = pib ? pib.ultimo.valor * 1e6 : 13.3e12;
  return { total: (C.carga.total / 100) * pibR, pib: pibR, data: pib?.ultimo.data };
}
const populacao = (p: Painel) => p.dados.ibge?.populacao ?? 213_400_000;
const SEG_ANO = 365.25 * 24 * 3600;

/* =================== 1. Quanto você paga =================== */
function Calculadora() {
  const [txt, setTxt] = useState("6.000");
  const v = parseFloat(txt.replace(/\./g, "").replace(",", "."));
  const taxa = v >= 3000 && v <= 10000 ? C.ibpt.pctFaixaMedia / 100 : C.ibpt.pctRenda / 100;
  return (
    <>
      <form className="calc" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="renda">Sua renda bruta mensal (R$)
          <input id="renda" inputMode="numeric" value={txt} autoComplete="off" onChange={(e) => setTxt(e.target.value)} />
        </label>
      </form>
      <div className="calc-out" aria-live="polite">
        {v > 0 ? (
          <>Cerca de <b>R$ {fmt(v * taxa)}</b> por mês em tributos, ou <b>R$ {fmt(v * taxa * 13.33)}</b> no ano (com 13º e férias).<br />Você trabalha cerca de <b>{Math.round(365 * taxa)} dias</b> por ano para o Estado.</>
        ) : "Digite sua renda mensal em reais."}
      </div>
    </>
  );
}

export function Conta({ p }: P) {
  const a = arrecadacao(p);
  const pop = populacao(p);
  const porHab = a.total / pop;
  const k = C.carga;
  return (
    <Secao id="conta" n={1} k="A conta" titulo="Quanto o brasileiro paga ao Estado"
      intro="Somando União, estados e municípios, o Estado fica com perto de um terço de tudo o que o país produz. É a maior carga tributária da série histórica, e ela é paga por todos: no salário, no preço de cada produto, na conta de luz, no combustível."
      ponte="Quatro trilhões é um número difícil de imaginar. Antes de ver para onde ele vai, vale traduzir esse dinheiro em coisas concretas.">
      <div className="hero-conta">
        <div className="hc-principal">
          <span className="hc-rot">Tributos pagos em 12 meses</span>
          <b className="hc-v"><Contador valor={a.total} formato={(n) => `R$ ${fmt(n / 1e12, 2)} tri`} duracao={1800} /></b>
          <span className="hc-sub">{fmt(k.total, 1)}% do PIB de {reais(a.pib, 2)} acumulado até {a.data ? mesAno(a.data) : "o último mês"}. Estimativa do painel com a carga de {k.ano} (Tesouro Nacional) e o PIB do Banco Central.</span>
        </div>
        <div className="hc-lista">
          <div><b className="num"><Contador valor={porHab} formato={(n) => `R$ ${fmt(n)}`} /></b><span>por brasileiro, por ano, incluindo crianças. São <b className="num">R$ {fmt(porHab / 12)}</b> por mês</span></div>
          <div><b className="num">{reais(a.total / 365.25, 1)}</b><span>por dia</span></div>
          <div><b className="num">R$ {fmt(a.total / SEG_ANO)}</b><span>por segundo</span></div>
        </div>
      </div>
      <Kpis>
        <Kpi alerta v={fmt(k.total, 1)} u="% PIB" l={`carga tributária bruta em ${k.ano}, recorde da série do Tesouro, iniciada em 2010 (${fmt(k.anterior, 1)}% em 2024)`} s="Tesouro Nacional · abr/2026" />
        <Kpi alerta v={C.ibpt.dias} u="dias" l={`de trabalho em 2026 só para pagar tributos: ${fmt(C.ibpt.pctRenda, 1)}% da renda. Em 1986 eram ${C.ibpt.dias1986} dias`} s="IBPT · jun/2026" />
        <Kpi v={fmt(C.cargaOCDE.find((x) => "brasil" in x)?.v ?? 33.7, 1)} u="% PIB" l="carga na metodologia da OCDE: a maior da América Latina (média 21,7%) e quase igual à média dos países ricos (34%)" s="OCDE/CIAT/BID/Cepal 2026" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Seu ano de trabalho" sub={`Cada quadrado é um dia de 2026. Em vermelho, os ${C.ibpt.dias} dias cuja renda vai inteira para tributos.`}
          nota={`Só a partir de 31 de maio o brasileiro médio começa a trabalhar para si. Para quem ganha de R$ 3 mil a R$ 10 mil por mês, são ${C.ibpt.diasFaixaMedia} dias (${fmt(C.ibpt.pctFaixaMedia, 0)}% da renda).`} fonte="IBPT, estudo de jun/2026">
          <Calendario dias={C.ibpt.dias} rotuloDia="30 de maio" />
          <Legenda itens={[{ cor: "var(--crit)", rotulo: "trabalhando para pagar tributos" }, { cor: "#DDE6EC", rotulo: "trabalhando para você" }]} />
        </Caixa>
        <Caixa titulo="Quanto do seu salário vai para o Estado?" sub="Estimativa com a alíquota média do IBPT para a sua faixa de renda." nota="Usa 43,01% para renda entre R$ 3 mil e R$ 10 mil e 41,1% (média geral) nas demais faixas. Inclui os tributos embutidos no consumo. É uma ordem de grandeza, não um cálculo individual.">
          <Calculadora />
        </Caixa>
      </Grid2>
      <Caixa titulo="Quem fica com o dinheiro" sub={`Carga tributária por esfera, % do PIB em ${k.ano}. Total: ${fmt(k.total, 1)}%.`} nota={`Tributos sobre renda e lucros: ${fmt(k.renda, 2)}% do PIB (recorde). ICMS, o maior imposto estadual: ${fmt(k.icms, 2)}%. ISS, dos municípios: ${fmt(k.iss, 2)}% (recorde).`} fonte="Tesouro Nacional, Carga Tributária do Governo Geral 2025 (abr/2026)">
        <Pilha partes={[
          { k: "União", v: k.uniao, lab: `União ${fmt(k.uniao, 1)}%`, c: "var(--s1)", tip: `≈ ${reais((k.uniao / k.total) * a.total, 2)} em 12 meses` },
          { k: "Estados", v: k.estados, lab: `Estados ${fmt(k.estados, 1)}%`, c: "var(--s2)", tip: `≈ ${reais((k.estados / k.total) * a.total, 2)} em 12 meses` },
          { k: "Municípios", v: k.municipios, lab: `Munic. ${fmt(k.municipios, 1)}%`, c: "var(--s3)", tip: `≈ ${reais((k.municipios / k.total) * a.total, 2)} em 12 meses` },
        ]} titulo="Carga por esfera" />
        <Legenda itens={[{ cor: "var(--s1)", rotulo: `União: ${fmt((k.uniao / k.total) * 100, 0)}% do total` }, { cor: "var(--s2)", rotulo: `Estados: ${fmt((k.estados / k.total) * 100, 0)}%` }, { cor: "var(--s3)", rotulo: `Municípios: ${fmt((k.municipios / k.total) * 100, 0)}%` }]} />
      </Caixa>
    </Secao>
  );
}

/* =================== 2. O que daria para fazer =================== */
type Gasto = { id: string; rotulo: string; valor: number; quando: string; cap?: string };

function listaGastos(p: Painel): Gasto[] {
  const a = arrecadacao(p);
  const jur = p.dados.bcb?.["juros12mR"];
  const c = p.dados.camara, s = p.dados.senado;
  const lista: (Gasto | null)[] = [
    { id: "arrec", rotulo: "Tudo o que pagamos em tributos", valor: a.total, quando: "12 meses, estimativa", cap: "conta" },
    jur ? { id: "juros", rotulo: "Juros da dívida pública", valor: jur.ultimo.valor * 1e6, quando: `12 meses até ${mesAno(jur.ultimo.data)}`, cap: "contas" } : null,
    { id: "subs", rotulo: "Subsídios da União", valor: 678.4e9, quando: "2024", cap: "protecionismo" },
    { id: "jud", rotulo: "Custo do Poder Judiciário", valor: C.judiciario.total * 1e9, quando: "2025", cap: "judiciario" },
    { id: "emendas", rotulo: "Emendas parlamentares", valor: (C.emendas.serie.at(-1)?.v ?? 61.4) * 1e9, quando: "LOA 2026", cap: "congresso" },
    { id: "zfm", rotulo: "Renúncia fiscal da Zona Franca", valor: C.zfm.renunciaTotal * 1e9, quando: "2024", cap: "zfm" },
    { id: "indeniz", rotulo: "Penduricalhos do Judiciário", valor: 9.8e9, quando: "verbas indenizatórias, 2025", cap: "judiciario" },
    { id: "estatais", rotulo: "Rombo das estatais federais", valor: 7.8e9, quando: "1º semestre de 2026", cap: "burocracia" },
    { id: "diesel", rotulo: "Diesel perdido em estradas ruins", valor: 7.2e9, quando: "por ano", cap: "logistica" },
    { id: "fundo", rotulo: "Fundo Eleitoral", valor: C.emendas.fundoEleitoral * 1e9, quando: "2026", cap: "congresso" },
    { id: "gabinete", rotulo: "Verba de gabinete dos 513 deputados", valor: C.camaraEstrutura.verbaGabineteMensal * 513 * 12, quando: "por ano, estimativa", cap: "congresso" },
    c && s ? { id: "cota", rotulo: "Cota parlamentar (Câmara + Senado)", valor: c.total + s.ceaps.total, quando: `${c.ano}, até agora · ao vivo`, cap: "ao-vivo" } : null,
  ];
  return lista.filter((x): x is Gasto => x != null);
}

const PASSOS = [1, 2, 5];
function porIcone(q: number, max = 100) {
  for (let e = 0; e < 12; e++) for (const b of PASSOS) { const v = b * 10 ** e; if (q / v <= max) return v; }
  return 1e12;
}

function Pictograma({ u, q }: { u: Unidade; q: number }) {
  const por = porIcone(q);
  const n = q / por;
  const cheios = Math.floor(n), resto = n - cheios;
  const col = 20, s = 30, g = 2;
  const total = cheios + (resto > 0.05 ? 1 : 0);
  const linhas = Math.max(1, Math.ceil(total / col));
  const W = col * (s + g), H = linhas * (s + g);
  return (
    <div className="picto">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${qtd(q)} ${UNIDADES[u].plural}; cada ícone representa ${fmt(por)}`}>
        <defs>
          <clipPath id="picto-resto"><rect x={0} y={0} width={24 * resto} height={24} /></clipPath>
        </defs>
        {Array.from({ length: total }, (_, i) => {
          const x = (i % col) * (s + g) + 3, y = Math.floor(i / col) * (s + g) + 3;
          const parcial = i === cheios;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              {parcial && <IconeG u={u} x={0} y={0} className="pi-fantasma" />}
              <g clipPath={parcial ? "url(#picto-resto)" : undefined}>
                <IconeG u={u} x={0} y={0} className="pi" style={atraso(i)} />
              </g>
            </g>
          );
        })}
      </svg>
      <p className="note">Cada ícone = <b>{fmt(por)}</b> {por === 1 ? UNIDADES[u].singular : UNIDADES[u].plural}.</p>
    </div>
  );
}

export function Traduzindo({ p }: P) {
  const gastos = listaGastos(p);
  const [id, setId] = useState(gastos[0]?.id ?? "arrec");
  const [livre, setLivre] = useState("");
  const [u, setU] = useState<Unidade>("casa");
  const valorLivre = parseFloat(livre.replace(/[^\d,]/g, "").replace(",", ".")) * (/tri/i.test(livre) ? 1e12 : /bi/i.test(livre) ? 1e9 : /mi/i.test(livre) ? 1e6 : /mil/i.test(livre) ? 1e3 : 1);
  const usandoLivre = id === "livre" && valorLivre > 0;
  const g = gastos.find((x) => x.id === id) ?? gastos[0]!;
  const valor = usandoLivre ? valorLivre : g.valor;
  const pop = populacao(p);
  const q = quantos(valor, u);
  return (
    <Secao id="traduzindo" n={2} k="A conta em coisas concretas" titulo="O que daria para fazer com esse dinheiro"
      intro="Escolha um valor e veja quanto ele representa em casas populares, creches, hospitais e salários. Os itens da lista são temas dos próximos capítulos. Os custos usam valores oficiais conservadores, então as quantidades tendem a ser as menores possíveis."
      ponte="Esse dinheiro, porém, não vai para casas e creches na proporção que o tamanho da conta sugere. A próxima parte mostra para onde ele vai de fato.">
      <div className="panel trad">
        <div className="trad-lista" role="listbox" aria-label="Escolha um valor">
          {gastos.map((x) => (
            <button key={x.id} type="button" role="option" aria-selected={x.id === id} className={x.id === id ? "on" : undefined} onClick={() => setId(x.id)}>
              <span className="tl-r">{x.rotulo}</span>
              <span className="tl-v num">{reais(x.valor, x.valor >= 1e12 ? 2 : 1)}</span>
              <span className="tl-q">{x.quando}</span>
            </button>
          ))}
          <label className={`trad-livre${id === "livre" ? " on" : ""}`}>
            <span className="tl-r">Ou digite um valor</span>
            <input value={livre} placeholder="ex.: 2,5 bi" inputMode="text" onFocus={() => setId("livre")} onChange={(e) => { setLivre(e.target.value); setId("livre"); }} />
          </label>
        </div>
        <div className="trad-res" aria-live="polite">
          <div className="tr-topo">
            <b className="tr-v"><ContadorVivo valor={valor} formato={(n) => reais(n, n >= 1e12 ? 2 : 1)} /></b>
            <span className="tr-sub">{usandoLivre ? "valor digitado" : `${g.rotulo} · ${g.quando}`} · <b className="num">R$ {fmt(valor / pop, valor / pop < 10 ? 2 : 0)}</b> por brasileiro</span>
          </div>
          <div className="tr-cards">
            {ORDEM.map((un) => {
              const qq = quantos(valor, un);
              return (
                <button key={un} type="button" className={`tr-card${un === u ? " on" : ""}`} aria-pressed={un === u} onClick={() => setU(un)}>
                  <Icone u={un} tamanho={26} className="tr-ic" />
                  <b className="num"><ContadorVivo valor={qq} formato={qtd} /></b>
                  <span>{UNIDADES[un].curto}</span>
                </button>
              );
            })}
          </div>
          {q >= 1 ? <Pictograma key={`${id}-${u}-${Math.round(valor)}`} u={u} q={q} /> : <p className="note">O valor é menor que o custo de {UNIDADES[u].singular}.</p>}
          {!usandoLivre && g.cap ? <a className="tr-cap" href={`#${g.cap}`}>Ver o capítulo sobre este gasto →</a> : null}
        </div>
      </div>
      <details className="custos">
        <summary>Custos usados nas comparações</summary>
        <ul>
          {ORDEM.map((un) => (
            <li key={un}><b>{UNIDADES[un].curto}:</b> R$ {fmt(UNIDADES[un].custo)} cada. <a href={UNIDADES[un].url} target="_blank" rel="noopener noreferrer">{UNIDADES[un].fonte}</a></li>
          ))}
        </ul>
      </details>
    </Secao>
  );
}

/* =================== 3. Para onde vai =================== */
export function Orcamento({ p }: P) {
  const a = arrecadacao(p);
  const d = C.despesaGovernoGeral;
  return (
    <Secao id="orcamento" n={3} k="Para onde vai" titulo="O orçamento"
      intro={<>O governo geral (União, estados e municípios) gasta {fmt(d.despesa, 1)}% do PIB, bem mais do que arrecada. Na União, quase metade do orçamento de 2026 não chega a virar serviço: vai para rolar a dívida e pagar a Previdência.</>}
      ponte="A diferença entre o que entra e o que sai não desaparece: vira dívida. E dívida cobra juros.">
      <Kpis>
        <Kpi alerta v={fmt(d.despesa, 1)} u="% PIB" l={`de despesa do governo geral em ${d.ano}, o maior nível em pelo menos 16 anos`} s="Tesouro Nacional · 2025" eq={(d.despesa / 100) * a.pib} eqUn={["casa", "icesp"]} />
        <Kpi v="R$ 6,54" u="tri" l="orçamento da União aprovado para 2026 (Lei 15.346/2026)" s="LOA 2026" />
        <Kpi alerta v="R$ 1,82" u="tri" l="só para refinanciar a dívida, a maior linha do orçamento federal" s="LOA 2026" eq={1.82e12} eqUn={["casa", "creche"]} />
      </Kpis>
      <Caixa titulo="Gasta mais do que arrecada" sub={`Governo geral, % do PIB em ${d.ano}`} fonte="Tesouro Nacional, Estatísticas de Finanças Públicas do Governo Geral (2025)">
        <Versus
          a={{ rotulo: "Despesa total", v: d.despesa, lab: `${fmt(d.despesa, 1)}% do PIB`, c: "var(--crit)" }}
          b={{ rotulo: "Receita total", v: d.receita, lab: `${fmt(d.receita, 1)}% do PIB`, c: "var(--s1)" }}
          fator={`${fmt(d.necessidade, 1)} p.p. do PIB`}
          legenda={<>de diferença, coberta com nova dívida. Em reais de hoje, cerca de <b>{reais((d.necessidade / 100) * a.pib, 1)}</b> por ano.</>}
        />
      </Caixa>
      <Caixa titulo="Orçamento da União 2026" sub="Principais destinos, R$. As linhas se sobrepõem em parte: o Bolsa Família está dentro de Desenvolvimento Social, e as emendas se espalham por várias áreas." fonte="LOA 2026; Congresso em Foco; Agência Brasil">
        <HBarras dados={C.loa2026.map((x) => ({ k: x.k, v: x.v, lab: x.lab, c: x.destaque ? "var(--s2)" : x.k.startsWith("Refin") || x.k.startsWith("Previd") ? "var(--crit)" : "var(--s1)" }))} lw={190} rw={96} titulo="LOA 2026" />
      </Caixa>
    </Secao>
  );
}

/* =================== Fecho: a conta em uma tela =================== */
export function Fecho({ p }: P) {
  const a = arrecadacao(p);
  const nom = p.dados.bcb?.["nominal12mR"], jur = p.dados.bcb?.["juros12mR"];
  const passos: [string, string, string][] = [
    ["conta", reais(a.total, 2), "pagos em tributos em 12 meses, 32,4% do PIB"],
    ["orcamento", `${fmt(C.despesaGovernoGeral.despesa, 1)}% do PIB`, "é quanto o Estado gasta, mais do que arrecada"],
    ["contas", nom ? reais(nom.ultimo.valor * 1e6, 2) : "R$ 1,26 tri", "de déficit nominal em 12 meses, coberto com dívida"],
    ["contas", jur ? reais(jur.ultimo.valor * 1e6, 2) : "R$ 1,18 tri", "em juros dessa dívida no mesmo período"],
    ["funcionalismo", "≈ 11,7 mi", "de servidores ativos nas três esferas"],
    ["judiciario", `R$ ${fmt(C.judiciario.total, 1)} bi`, `para o Judiciário, ${fmt(C.judiciario.pctPIB, 1)}% do PIB, 4 vezes a média internacional`],
    ["congresso", `R$ ${fmt(C.emendas.serie.at(-1)?.v ?? 61.4, 1)} bi`, "em emendas parlamentares em 2026"],
    ["protecionismo", "R$ 678 bi", "em subsídios da União em um ano"],
    ["burocracia", "1.501 h", "por ano para uma empresa pagar impostos, recorde mundial"],
    ["liberdade", `${C.heritage.posicao}º`, `de ${C.heritage.de} países em liberdade econômica`],
    ["retorno", "30º de 30", "no retorno dos impostos em bem-estar, entre os países de carga mais alta"],
  ];
  return (
    <Secao id="resumo" k="Em uma tela" titulo="O fio da conta" intro="O caminho do dinheiro, do bolso de quem paga até o que volta. Toque em um passo para rever o capítulo.">
      <ol className="fio">
        {passos.map(([cap, v, l], i) => (
          <li key={i} style={atraso(i)}>
            <a href={`#${cap}`}><b className="num">{v}</b><span>{l}</span></a>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
