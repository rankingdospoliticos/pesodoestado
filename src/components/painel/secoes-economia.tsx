import type { Painel } from "@/lib/painel/dados";
import { fmt, mesAno, reais, data } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { HBarras, Linha, Divergentes } from "./graficos";
import { MapaBrasil } from "./MapaBrasil";
import { Termometro } from "./visuais";
import { AoVivo, Caixa, Ext, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

/** Lê uma série do BC com segurança. */
export function serie(p: Painel, k: string) {
  return p.dados.bcb?.[k];
}

/* =================== 4. O rombo =================== */
export function Contas({ p }: P) {
  const div = serie(p, "dividaBrutaPIB"), divR = serie(p, "dividaBrutaR"), prim = serie(p, "primario12mPIB"), primR = serie(p, "primario12mR"), jur = serie(p, "juros12mPIB"), jurR = serie(p, "juros12mR"), nom = serie(p, "nominal12mPIB"), nomR = serie(p, "nominal12mR"), selic = serie(p, "selic"), ipca = serie(p, "ipca12m");
  const hab = p.dados.derivados?.dividaPorHabitante;
  const hist = (div?.historico ?? []).filter((_, i, a) => i % 3 === (a.length - 1) % 3);
  const vmin = Math.min(...hist.map((x) => x.valor)), vmax = Math.max(...hist.map((x) => x.valor));
  const lo = Math.floor(vmin / 4) * 4, hi = Math.ceil((vmax + 1) / 4) * 4;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 4) ticks.push(t);
  const jurReal = selic && ipca ? ((1 + selic.ultimo.valor / 100) / (1 + ipca.ultimo.valor / 100) - 1) * 100 : null;
  return (
    <Secao id="contas" n={4} k="O rombo" titulo="Déficit, dívida e juros"
      intro={<>Mesmo com arrecadação recorde, as contas não fecham. Somando os juros, o setor público gastou {nomR ? reais(nomR.ultimo.valor * 1e6, 2) : "mais de R$ 1,2 trilhão"} a mais do que arrecadou em 12 meses, e a dívida cresce. <AoVivo coletadoEm={p.fontes["bcb"]?.coletadoEm} rotulo="Banco Central" /></>}
      ponte="Quem recebe a maior parte do que o Estado gasta, além dos credores da dívida? A próxima parte olha para a máquina pública.">
      <Kpis>
        {nom && nomR && <Kpi alerta v={reais(nomR.ultimo.valor * 1e6, 2)} l={`de déficit nominal em 12 meses (${fmt(nom.ultimo.valor, 2)}% do PIB): tudo o que faltou, juros incluídos`} s={`Banco Central · até ${mesAno(nom.ultimo.data)}`} eq={nomR.ultimo.valor * 1e6} eqUn={["casa", "icesp"]} />}
        {jurR && jur && <Kpi alerta v={fmt(jurR.ultimo.valor / 1e6, 2)} u="tri" l={`só de juros da dívida em 12 meses, ${fmt(jur.ultimo.valor, 2)}% do PIB`} s={`Banco Central · até ${mesAno(jurR.ultimo.data)}`} eq={jurR.ultimo.valor * 1e6} eqUn={["creche", "bolsa"]} />}
        {div && <Kpi alerta v={fmt(div.ultimo.valor, 1)} u="% PIB" l={<>Dívida bruta do governo geral{divR ? `: ${reais(divR.ultimo.valor * 1e6, 2)}` : ""}</>} s={`Banco Central · ${mesAno(div.ultimo.data)}`} />}
        {hab && <Kpi v={`R$ ${fmt(hab)}`} l="de dívida pública por habitante, incluindo crianças. Em 2006 eram R$ 7.157" s="BC + IBGE · cálculo automático" />}
        {prim && (
          <Kpi alerta={prim.ultimo.valor > 0} v={primR ? `${prim.ultimo.valor > 0 ? "−" : "+"}${fmt(primR.ultimo.valor / 1000, 1)}` : fmt(prim.ultimo.valor, 2)} u="bi"
            l={`${prim.ultimo.valor > 0 ? "déficit" : "superávit"} primário (sem contar juros) do setor público em 12 meses, ${fmt(Math.abs(prim.ultimo.valor), 2)}% do PIB`} s={`Banco Central · até ${mesAno(prim.ultimo.data)}`} />
        )}
        {selic && ipca && jurReal != null && <Kpi v={fmt(selic.ultimo.valor, 2)} u="% a.a." l={`Selic. Com inflação de ${fmt(ipca.ultimo.valor, 2)}% em 12 meses, o juro real fica perto de ${fmt(jurReal, 1)}%, um dos maiores do mundo`} s="Banco Central · hoje" />}
      </Kpis>
      <Grid2>
        {div && hist.length > 1 && (
          <Caixa titulo="Dívida bruta do governo geral" sub="% do PIB, a cada trimestre" fonte={<Ext href={div.url}>Banco Central, série SGS {div.cod}</Ext>}>
            <Linha
              pontos={hist.map((x, i) => ({ x: i, k: mesAno(x.data), v: x.valor, lab: `${fmt(x.valor, 1)}%`, rotulo: i === 0 || i === hist.length - 1 || i % 4 === 0 }))}
              min={lo} max={hi} ticks={ticks} c="var(--crit)" h={250} rotularTodos={false} rotulosX={(i, n) => i === 0 || i === n - 1 || i % 4 === 0} titulo="Dívida bruta % PIB"
            />
          </Caixa>
        )}
        <Caixa titulo="De onde veio o déficit de 2025" sub="Resultado primário do governo central, R$ bilhões" nota={`A Previdência (RGPS) sozinha teve déficit de R$ 317,2 bi. Tesouro e Banco Central tiveram superávit de R$ 255,5 bi. A meta só foi cumprida depois de excluir R$ ${fmt(C.primario2025.excluido, 1)} bi da conta.`} fonte="Tesouro Nacional, Resultado do Tesouro dez/2025">
          <Divergentes dados={[{ k: "Tesouro + Banco Central", v: C.primario2025.tesouroBC }, { k: "Previdência (RGPS)", v: C.primario2025.rgps }, { k: "Governo central", v: C.primario2025.total, bold: true }]} titulo="Primário 2025" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* =================== 12. Burocracia =================== */
export function Burocracia() {
  return (
    <Secao id="burocracia" n={12} k="O custo invisível" titulo="Burocracia, normas e estatais"
      intro="Além do que arrecada e gasta, o Estado impõe um custo para produzir: horas preenchendo guias, normas que mudam todo dia, licenças e empresas públicas no vermelho."
      ponte="Ao custo das regras soma-se o da infraestrutura que falta.">
      <Kpis>
        <Kpi alerta pill="Pior do mundo" v="1.501" u="h/ano" l="que uma empresa gasta para calcular e pagar tributos. Média da OCDE: 156 h" s="Banco Mundial · Doing Business 2021" />
        <Kpi v="7,8" u="mi" l="normas editadas desde a Constituição de 1988, cerca de 860 por dia útil" s="IBPT · até set/2024" />
        <Kpi v="517.388" l="normas tributárias editadas no período, cerca de 39 por dia. Em vigor: ~36 mil" s="IBPT · até set/2024" />
        <Kpi alerta v="R$ 1,7" u="tri" l="por ano de Custo Brasil, 19,5% do PIB: o que custa produzir aqui a mais que a média da OCDE" s="MBC/MDIC · 2023" />
        <Kpi alerta v="−R$ 7,8" u="bi" l="déficit das estatais federais no 1º semestre de 2026, recorde desde 2002. Os Correios perderam R$ 8,5 bi em 2025" s="Banco Central · jul/2026" eq={7.8e9} eqUn={["creche", "ubs"]} />
        <Kpi v="65,3%" l="do lucro de uma empresa média vai para tributos. OCDE: 38,8%" s="Banco Mundial · Doing Business 2021" />
      </Kpis>
      <Caixa titulo="Horas por ano para pagar impostos" sub="Empresa padrão: preparar, declarar e pagar tributos" nota="Quase dez vezes a média dos países ricos. O Doing Business foi descontinuado; este é o último dado comparável. A reforma tributária sobre o consumo (IBS/CBS) promete reduzir esse tempo a partir de 2027." fonte="Banco Mundial, Doing Business Subnacional Brasil 2021">
        <HBarras dados={C.horasImpostos.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v)} h`, c: "brasil" in x ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in x, tip: <><b>{x.k}</b><br />{fmt(x.v)} horas por ano<br />≈ {fmt(x.v / 8)} dias de trabalho de 8 h</> }))} lw={170} rw={80} titulo="Horas para pagar impostos" />
      </Caixa>
    </Secao>
  );
}

/* =================== 14. Liberdade econômica =================== */
export function Liberdade() {
  const h = C.heritage;
  return (
    <Secao id="liberdade" n={14} k="O resultado nos rankings" titulo="Liberdade econômica"
      intro={`Imposto alto, burocracia e infraestrutura ruim aparecem nos rankings internacionais: o Brasil é “majoritariamente não livre”, caiu 17 posições de 2025 para 2026 no índice da Heritage e está em ${h.americas}º de ${h.deAmericas} países nas Américas.`}
      ponte="Dentro do país, a situação muda muito de estado para estado.">
      <Caixa titulo="O termômetro da liberdade econômica" sub="Notas do índice Heritage 2026 (0 a 100) e as faixas de classificação. “Não livre” e “quase livre” resumem “majoritariamente não livre” e “majoritariamente livre”. O círculo tracejado é a nota do Brasil em 2025 (55,1)." fonte="Heritage Foundation, Index of Economic Freedom 2026. Argentina: maior melhora do ano (de 49,9 em 2024 para 57,4).">
        <Termometro
          titulo="Termômetro Heritage 2026"
          faixas={[{ de: 0, ate: 50, rotulo: "Reprimido" }, { de: 50, ate: 60, rotulo: "Não livre" }, { de: 60, ate: 70, rotulo: "Moderado" }, { de: 70, ate: 80, rotulo: "Quase livre" }, { de: 80, ate: 100, rotulo: "Livre" }]}
          marcos={h.comparacao.map((c) => ({ k: c.k.replace(/ \(\d+º\)/, ""), v: c.v, ...("brasil" in c ? { destaque: true, antes: 55.1, antesRotulo: "2025:" } : {}) }))}
        />
      </Caixa>
      <Kpis>
        <Kpi alerta v={<>{h.posicao}º <small>/{h.de}</small></>} l="no índice Heritage 2026. Era 117º em 2025 e 124º em 2024" s="Heritage Foundation" />
        <Kpi v={fmt(h.nota, 1)} l={`nota Heritage 2026 (0 a 100). Média mundial: ${fmt(h.mediaMundial, 1)}`} s="dados até jun/2025" />
        <Kpi v={`${C.fraser.posicao}º`} l={`no Economic Freedom of the World ${C.fraser.relatorio} (Fraser). Era ${C.fraser.posicaoAnterior}º no relatório anterior`} s={`Fraser Institute · dados de ${C.fraser.dadosDe}`} />
      </Kpis>
      <Grid2>
        <Caixa titulo="Nota do Brasil ano a ano" sub="Índice Heritage, 0 a 100. Abaixo de 60 é “majoritariamente não livre”." fonte="Heritage Foundation, Index of Economic Freedom 2021–2026">
          <Linha
            pontos={h.historico.map((x) => ({ x: x.ano, k: String(x.ano), v: x.nota, lab: fmt(x.nota, 1), tip: `${fmt(x.nota, 1)}${"posicao" in x && x.posicao ? ` · ${x.posicao}º lugar` : ""}` }))}
            min={50} max={57} ticks={[50, 52, 54, 56]} titulo="Nota Heritage do Brasil"
          />
        </Caixa>
        <Caixa titulo="Onde o Brasil perde pontos" sub="Componentes do índice Heritage 2026 (0 a 100). Linha tracejada: nota geral." fonte="Heritage 2026 via TheGlobalEconomy. Faltam 3 dos 12 componentes na fonte (eficácia judicial, gasto e saúde fiscal).">
          <HBarras dados={h.componentes.map((c) => ({ ...c, c: c.v <= 40 ? "var(--crit)" : "var(--s1)" }))} max={100} referencia={h.nota} refLabel={`geral ${fmt(h.nota, 1)}`} lw={180} titulo="Componentes Heritage" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* =================== 15. Estados =================== */
export function Estados({ p }: P) {
  return (
    <Secao id="estados" n={15} k="Dentro do Brasil" titulo="Liberdade econômica nos estados"
      intro="Três retratos estaduais: o índice acadêmico do Mackenzie (gasto, tributação e mercado de trabalho), a adesão à Lei de Liberdade Econômica (Lei 13.874/2019), que dispensa de alvará as atividades de baixo risco, e, ao vivo, quanto os deputados de cada estado gastam da cota parlamentar."
      ponte="Depois de pagar a conta, sustentar a máquina e enfrentar o custo de produzir, a pergunta que sobra: o que volta para quem paga?">
      <Kpis>
        <Kpi v={fmt(C.lleNacional.municipios)} l={`municípios aprovaram lei ou decreto de liberdade econômica, ${fmt(C.lleNacional.pct, 1)}% dos ${fmt(C.lleNacional.total)}`} s={`ILISP / Liberdade para Trabalhar · ${data(C.lleNacional.data)}`} />
        <Kpi alerta v="5" l="estados sem lei nem decreto estadual: BA, AM, CE, PB e TO" s="ILISP · jul/2026" />
        <Kpi v="4" l="estados aprovaram a lei mas não definiram a lista de atividades: RN, RO, AP e RR" s="ILISP · jul/2026" />
        <Kpi v="Goiânia" l="é a única capital, e a única cidade com mais de 1 milhão de habitantes, sem a lei" s="ILISP · out/2026" />
      </Kpis>
      <MapaBrasil p={p} />
    </Secao>
  );
}
