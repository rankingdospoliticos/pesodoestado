import { useState } from "react";
import type { Painel } from "@/lib/painel/dados";
import { fmt, mesAno, reais, data } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { HBarras, Linha, Divergentes, Pilha, Legenda } from "./graficos";
import { MapaEstados } from "./MapaEstados";
import { AoVivo, Caixa, Ext, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

/** Lê uma série do BC com segurança. */
export function serie(p: Painel, k: string) {
  return p.dados.bcb?.[k];
}

/* ---------------- Resumo ---------------- */
export function Resumo({ p }: P) {
  const div = serie(p, "dividaBrutaPIB"), divR = serie(p, "dividaBrutaR"), nom = serie(p, "nominal12mPIB"), nomR = serie(p, "nominal12mR");
  const camara = p.dados.camara, senado = p.dados.senado;
  return (
    <Secao id="resumo" k="Em uma tela" titulo="Resumo" intro="Os números que melhor descrevem o tamanho e o custo do Estado hoje. Os marcados com data e hora são atualizados automaticamente.">
      <Kpis>
        <Kpi pill="Pior posição em anos" v={`${C.heritage.posicao}º`} l={`de ${C.heritage.de} países no Índice de Liberdade Econômica (Heritage 2026), nota ${fmt(C.heritage.nota, 1)}`} s="Heritage Foundation · fev/2026" />
        {div && (
          <Kpi alerta v={fmt(div.ultimo.valor, 1)} u="% PIB" l={<>Dívida bruta do governo geral{divR ? `, ${reais(divR.ultimo.valor * 1e6, 2)}` : ""}</>} s={<>Banco Central · {mesAno(div.ultimo.data)} · <AoVivo coletadoEm={p.fontes["bcb"]?.coletadoEm} rotulo="API" /></>} />
        )}
        {nom && (
          <Kpi alerta v={fmt(nom.ultimo.valor, 2)} u="% PIB" l={<>Déficit nominal em 12 meses{nomR ? `, ${reais(nomR.ultimo.valor * 1e6, 3)}` : ""}</>} s={`Banco Central · 12m até ${mesAno(nom.ultimo.data)}`} />
        )}
        <Kpi v={fmt(C.carga.total, 1)} u="% PIB" l="Carga tributária bruta, recorde da série iniciada em 2010" s="Tesouro Nacional · 2025" />
        <Kpi v={fmt(C.despesaGovernoGeral.despesa, 1)} u="% PIB" l="Despesa total do governo geral, maior nível em pelo menos 16 anos" s="Tesouro Nacional · 2025" />
        <Kpi v="≈11,7" u="mi" l="Servidores ativos nas três esferas (municípios, estados e União)" s="IBGE Munic/Estadic 2024 + MGI 2026" />
        <Kpi v={fmt(C.judiciario.pctPIB, 1)} u="% PIB" l={`Custo do Judiciário, R$ ${fmt(C.judiciario.total, 1)} bi. Média internacional: 0,3%`} s="CNJ · Justiça em Números 2026" />
        {camara && senado ? (
          <Kpi v={reais(camara.total + senado.ceaps.total, 1).replace("R$ ", "R$ ")} l={`Gastos com cota parlamentar de deputados e senadores em ${camara.ano}, até agora`} s={<AoVivo coletadoEm={p.fontes["camara"]?.coletadoEm} rotulo="Câmara e Senado" />} />
        ) : (
          <Kpi v={C.ibpt.dias} u="dias" l={`Trabalhados em 2026 só para pagar tributos (${fmt(C.ibpt.pctRenda, 1)}% da renda)`} s="IBPT · jun/2026" />
        )}
      </Kpis>
    </Secao>
  );
}

/* ---------------- Liberdade econômica ---------------- */
export function Liberdade() {
  const h = C.heritage;
  return (
    <Secao id="liberdade" k="Rankings internacionais" titulo="Liberdade econômica" intro="O Brasil é classificado como “majoritariamente não livre”. Caiu 17 posições de 2025 para 2026 no índice da Heritage e ficou em 28º de 32 países nas Américas.">
      <Kpis>
        <Kpi v={fmt(h.nota, 1)} l={`Nota Heritage 2026 (0 a 100). Média mundial: ${fmt(h.mediaMundial, 1)}`} s="dados até jun/2025" />
        <Kpi v={<>{h.posicao}º <small>/{h.de}</small></>} l="Posição Heritage 2026. Era 117º em 2025 e 124º em 2024" s="Heritage Foundation" />
        <Kpi v={`${C.fraser.posicao}º`} l={`Economic Freedom of the World ${C.fraser.relatorio} (Fraser). Era ${C.fraser.posicaoAnterior}º no relatório anterior`} s={`Fraser Institute · dados de ${C.fraser.dadosDe}`} />
        <Kpi v={<>{h.americas}º <small>/{h.deAmericas}</small></>} l="Posição do Brasil entre os países das Américas (Heritage 2026)" s="Heritage Foundation" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Nota do Brasil no índice Heritage" sub="0 a 100. Abaixo de 60 é “majoritariamente não livre”." fonte="Heritage Foundation, Index of Economic Freedom 2021–2026">
          <Linha
            pontos={h.historico.map((x) => ({ x: x.ano, k: String(x.ano), v: x.nota, lab: fmt(x.nota, 1), tip: `${fmt(x.nota, 1)}${"posicao" in x && x.posicao ? ` · ${x.posicao}º lugar` : ""}` }))}
            min={50} max={57} ticks={[50, 52, 54, 56]} titulo="Nota Heritage do Brasil"
          />
        </Caixa>
        <Caixa titulo="Onde o Brasil perde pontos" sub="Componentes do índice Heritage 2026 (0 a 100). Linha tracejada: nota geral." fonte="Heritage 2026 via TheGlobalEconomy. Faltam 3 dos 12 componentes na fonte (eficácia judicial, gasto e saúde fiscal).">
          <HBarras dados={h.componentes.map((c) => ({ ...c, c: c.v <= 40 ? "var(--crit)" : "var(--s1)" }))} max={100} referencia={h.nota} refLabel={`geral ${fmt(h.nota, 1)}`} lw={180} titulo="Componentes Heritage" />
        </Caixa>
      </Grid2>
      <Caixa titulo="Brasil no mapa da liberdade" sub="Notas do índice Heritage 2026 para comparação." fonte="Heritage 2026. Argentina: maior melhora do ano (de 49,9 em 2024 para 57,4).">
        <HBarras dados={h.comparacao.map((c) => ({ k: c.k, v: c.v, lab: fmt(c.v, 1), c: "brasil" in c ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in c }))} max={100} lw={150} titulo="Comparação Heritage" />
      </Caixa>
    </Secao>
  );
}

/* ---------------- Estados ---------------- */
export function Estados() {
  return (
    <Secao id="estados" k="Dentro do Brasil" titulo="Liberdade econômica nos estados" intro="Dois retratos estaduais: o índice acadêmico do Mackenzie (gasto, tributação e mercado de trabalho de cada estado) e a adesão à Lei de Liberdade Econômica (Lei 13.874/2019), que dispensa de alvará as atividades de baixo risco. Toque em um estado para ver os três números.">
      <Kpis>
        <Kpi v={fmt(C.lleNacional.municipios)} l={`municípios aprovaram lei ou decreto de liberdade econômica, ${fmt(C.lleNacional.pct, 1)}% dos ${fmt(C.lleNacional.total)}`} s={`ILISP / Liberdade para Trabalhar · ${data(C.lleNacional.data)}`} />
        <Kpi alerta v="5" l="estados sem lei nem decreto estadual: BA, AM, CE, PB e TO" s="ILISP · jul/2026" />
        <Kpi v="4" l="estados aprovaram a lei mas não definiram a lista de atividades: RN, RO, AP e RR" s="ILISP · jul/2026" />
        <Kpi v="Goiânia" l="é a única capital, e a única cidade com mais de 1 milhão de habitantes, sem a lei" s="ILISP · out/2026" />
      </Kpis>
      <MapaEstados />
    </Secao>
  );
}

/* ---------------- Contas públicas ---------------- */
export function Contas({ p }: P) {
  const div = serie(p, "dividaBrutaPIB"), prim = serie(p, "primario12mPIB"), primR = serie(p, "primario12mR"), jur = serie(p, "juros12mPIB"), jurR = serie(p, "juros12mR"), dl = serie(p, "dividaLiquidaPIB"), selic = serie(p, "selic"), ipca = serie(p, "ipca12m");
  const hab = p.dados.derivados?.dividaPorHabitante;
  const hist = (div?.historico ?? []).filter((_, i, a) => i % 3 === (a.length - 1) % 3);
  const vmin = Math.min(...hist.map((x) => x.valor)), vmax = Math.max(...hist.map((x) => x.valor));
  const lo = Math.floor(vmin / 4) * 4, hi = Math.ceil((vmax + 1) / 4) * 4;
  const ticks: number[] = [];
  for (let t = lo; t <= hi; t += 4) ticks.push(t);
  return (
    <Secao id="contas" k="Déficit e dívida" titulo="Contas públicas" intro={<>O governo cumpriu a meta de 2025 só depois de excluir R$ {fmt(C.primario2025.excluido, 1)} bi da conta. Com os juros, o rombo anual passa de R$ 1,2 trilhão. <AoVivo coletadoEm={p.fontes["bcb"]?.coletadoEm} rotulo="Banco Central" /></>}>
      <Kpis>
        <Kpi alerta v="−61,7" u="bi" l="Déficit primário do governo central em 2025 (0,48% do PIB). Para a meta, contou como −13 bi" s="Tesouro Nacional · jan/2026" />
        {prim && (
          <Kpi alerta={prim.ultimo.valor > 0} v={primR ? `${prim.ultimo.valor > 0 ? "−" : "+"}${fmt(primR.ultimo.valor / 1000, 1)}` : fmt(prim.ultimo.valor, 2)} u="bi"
            l={`${prim.ultimo.valor > 0 ? "Déficit" : "Superávit"} primário do setor público consolidado em 12 meses (${fmt(Math.abs(prim.ultimo.valor), 2)}% do PIB)`} s={`Banco Central · até ${mesAno(prim.ultimo.data)}`} />
        )}
        {jurR && jur && <Kpi alerta v={fmt(jurR.ultimo.valor / 1e6, 2)} u="tri" l={`Juros nominais em 12 meses, ${fmt(jur.ultimo.valor, 2)}% do PIB`} s={`Banco Central · até ${mesAno(jurR.ultimo.data)}`} />}
        {dl && <Kpi v={fmt(dl.ultimo.valor, 1)} u="% PIB" l="Dívida líquida do setor público" s={`Banco Central · ${mesAno(dl.ultimo.data)}`} />}
        {hab && <Kpi v={`R$ ${fmt(hab)}`} l="Dívida pública bruta por habitante. Em 2006 eram R$ 7.157" s="BC + IBGE · cálculo automático" />}
        {selic && ipca && <Kpi v={fmt(selic.ultimo.valor, 2)} u="% a.a." l={`Selic, com inflação de ${fmt(ipca.ultimo.valor, 2)}% em 12 meses: juro real perto de ${fmt(((1 + selic.ultimo.valor / 100) / (1 + ipca.ultimo.valor / 100) - 1) * 100, 1)}%`} s="Banco Central · hoje" />}
      </Kpis>
      <Grid2>
        {div && hist.length > 1 && (
          <Caixa titulo="Dívida bruta do governo geral" sub="% do PIB, trimestral" fonte={<Ext href={div.url}>Banco Central, série SGS {div.cod}</Ext>}>
            <Linha
              pontos={hist.map((x, i) => ({ x: i, k: mesAno(x.data), v: x.valor, lab: `${fmt(x.valor, 1)}%`, rotulo: i === 0 || i === hist.length - 1 || i % 4 === 0 }))}
              min={lo} max={hi} ticks={ticks} c="var(--crit)" h={250} rotularTodos={false} rotulosX={(i, n) => i === 0 || i === n - 1 || i % 4 === 0} titulo="Dívida bruta % PIB"
            />
          </Caixa>
        )}
        <Caixa titulo="De onde veio o déficit de 2025" sub="Resultado primário do governo central, R$ bilhões" nota="A Previdência (RGPS) sozinha teve déficit de R$ 317,2 bi. Tesouro e Banco Central tiveram superávit de R$ 255,5 bi." fonte="Tesouro Nacional, Resultado do Tesouro dez/2025">
          <Divergentes dados={[{ k: "Tesouro + Banco Central", v: C.primario2025.tesouroBC }, { k: "Previdência (RGPS)", v: C.primario2025.rgps }, { k: "Governo central", v: C.primario2025.total, bold: true }]} titulo="Primário 2025" />
        </Caixa>
      </Grid2>
      <Caixa titulo="Orçamento da União 2026" sub="Lei 15.346/2026. Total de R$ 6,54 trilhões." fonte="LOA 2026; Congresso em Foco; Agência Brasil">
        <HBarras dados={C.loa2026.map((x) => ({ k: x.k, v: x.v, lab: x.lab, c: x.destaque ? "var(--s2)" : "var(--s1)" }))} lw={190} rw={96} titulo="LOA 2026" />
      </Caixa>
    </Secao>
  );
}

/* ---------------- Impostos ---------------- */
function Calculadora() {
  const [txt, setTxt] = useState("6.000");
  const v = parseFloat(txt.replace(/\./g, "").replace(",", "."));
  const taxa = v >= 3000 && v <= 10000 ? C.ibpt.pctFaixaMedia / 100 : C.ibpt.pctRenda / 100;
  return (
    <>
      <form className="calc" onSubmit={(e) => e.preventDefault()}>
        <label htmlFor="renda">Renda bruta mensal (R$)
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

export function Impostos() {
  const k = C.carga;
  return (
    <Secao id="impostos" k="Quem paga a conta" titulo="Impostos" intro="A carga tributária bateu recorde em 2025, puxada pelo Imposto de Renda retido na fonte. Ao mesmo tempo, o governo abre mão de R$ 620,8 bi em benefícios fiscais.">
      <Grid2>
        <Caixa titulo="Carga tributária por esfera" sub={`% do PIB, ${k.ano}. Total: ${fmt(k.total, 1)}% (2024: ${fmt(k.anterior, 1)}%).`} nota={`Tributos sobre renda e lucros: ${fmt(k.renda, 2)}% do PIB (recorde). ICMS: ${fmt(k.icms, 2)}%. ISS: ${fmt(k.iss, 2)}% (recorde).`} fonte="Tesouro Nacional, Carga Tributária do Governo Geral 2025 (abr/2026)">
          <Pilha partes={[
            { k: "União", v: k.uniao, lab: `${fmt(k.uniao, 1)}%`, c: "var(--s1)", tip: "+0,26 p.p. sobre 2024" },
            { k: "Estados", v: k.estados, lab: `${fmt(k.estados, 1)}%`, c: "var(--s2)", tip: "−0,10 p.p. (ICMS cresceu menos que o PIB)" },
            { k: "Municípios", v: k.municipios, lab: `${fmt(k.municipios, 1)}%`, c: "var(--s3)", tip: "+0,03 p.p. (ISS recorde)" },
          ]} titulo="Carga por esfera" />
          <Legenda itens={[{ cor: "var(--s1)", rotulo: `União ${fmt(k.uniao, 1)}%` }, { cor: "var(--s2)", rotulo: `Estados ${fmt(k.estados, 1)}%` }, { cor: "var(--s3)", rotulo: `Municípios ${fmt(k.municipios, 1)}%` }]} />
        </Caixa>
        <Caixa titulo="Seu calendário de 2026" sub={`Cada quadrado é um dia do ano. Em vermelho, os ${C.ibpt.dias} dias de trabalho que foram para tributos.`} nota={`Em 1986 eram ${C.ibpt.dias1986} dias. Para quem ganha de R$ 3 mil a R$ 10 mil por mês, são ${C.ibpt.diasFaixaMedia} dias (${fmt(C.ibpt.pctFaixaMedia, 0)}% da renda).`} fonte="IBPT, estudo de jun/2026">
          <div className="days" aria-label={`${C.ibpt.dias} de 365 dias do ano destacados`}>
            {Array.from({ length: 365 }, (_, i) => <span key={i} className={i < C.ibpt.dias ? "t" : undefined} />)}
          </div>
        </Caixa>
      </Grid2>
      <Grid2>
        <Caixa titulo="Quanto do seu salário vai para o Estado?" sub="Estimativa com a alíquota média do IBPT para a sua faixa de renda." nota="Usa 43,01% para renda entre R$ 3 mil e R$ 10 mil e 41,1% (média geral) nas demais faixas. É uma ordem de grandeza, não um cálculo individual.">
          <Calculadora />
        </Caixa>
        <Caixa titulo="Benefícios fiscais (gastos tributários)" sub={`Projeção para 2026: R$ ${fmt(C.gastosTributarios.total, 1)} bi, ${fmt(C.gastosTributarios.pctPIB, 2)}% do PIB. Em 2025: R$ ${fmt(C.gastosTributarios.anterior, 1)} bi.`} fonte="Demonstrativo de Gastos Tributários, PLDO 2026">
          <HBarras dados={C.gastosTributarios.itens.map((x) => ({ ...x, lab: `R$ ${fmt(x.v, 1)} bi` }))} lw={160} rw={100} titulo="Gastos tributários" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* ---------------- Brasil × mundo ---------------- */
export function Mundo({ p }: P) {
  const pop = p.dados.ibge?.populacao;
  const porHab = pop ? Math.round((C.judiciario.total * 1e9) / pop) : 770;
  return (
    <Secao id="mundo" k="Comparações internacionais" titulo="Brasil × mundo" intro="O Brasil cobra impostos no nível dos países ricos da OCDE, com renda de país emergente, e é o que menos devolve em bem-estar entre os 30 países de carga mais alta.">
      <Kpis>
        <Kpi alerta pill="Pior do mundo" v="1.501" u="h/ano" l="que uma empresa gasta para calcular e pagar tributos. Média da OCDE: 156 h" s="Banco Mundial · Doing Business 2021" />
        <Kpi alerta pill="Último de 30" v="30º" l="no índice de retorno dos impostos em bem-estar (IRBES), entre os 30 países de maior carga" s="IBPT · última edição" />
        <Kpi pill="Maior da região" v="33,7" u="% PIB" l="carga na metodologia da OCDE, a maior da América Latina. Média regional: 21,7%" s="OCDE/CIAT/BID/Cepal 2026 · dados de 2024" />
        <Kpi v="65,3%" l="do lucro de uma empresa média vai para tributos. OCDE: 38,8%" s="Banco Mundial · Doing Business 2021" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Horas por ano para pagar impostos" sub="Empresa padrão, preparar, declarar e pagar tributos" nota="O Doing Business foi descontinuado; este é o último dado comparável publicado. A reforma tributária sobre o consumo (IBS/CBS) promete reduzir esse tempo a partir de 2027." fonte="Banco Mundial, Doing Business Subnacional Brasil 2021">
          <HBarras dados={C.horasImpostos.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v)} h`, c: "brasil" in x ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in x }))} lw={170} rw={80} titulo="Horas para pagar impostos" />
        </Caixa>
        <Caixa titulo="Carga tributária: Brasil, região e OCDE" sub="% do PIB, metodologia comparável da OCDE, 2024" nota="A média da OCDE reúne países com renda per capita várias vezes maior que a brasileira." fonte="Revenue Statistics in Latin America and the Caribbean 2026 (OCDE, CIAT, BID, Cepal)">
          <HBarras dados={C.cargaOCDE.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1)}%`, c: "brasil" in x ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in x }))} lw={180} rw={70} max={40} titulo="Carga OCDE" />
        </Caixa>
      </Grid2>
      <Grid2>
        <Caixa titulo="Quanto dos impostos vai para a Justiça" nota="O Brasil gasta 4 vezes a média internacional com tribunais, em proporção do PIB." fonte="CNJ 2026; Tesouro Nacional 2025; IBGE (população)">
          <Kpis min={150}>
            <Kpi fundo v="≈ 4%" l={`de tudo que se arrecada no país paga o Judiciário (${fmt(C.judiciario.pctPIB, 1)}% ÷ ${fmt(C.carga.total, 1)}% do PIB)`} s="cálculo do painel" />
            <Kpi fundo v={<>R$ 1 <small>em 25</small></>} l="de cada real de tributo vai para tribunais" s="cálculo do painel" />
            <Kpi fundo v={`R$ ${fmt(porHab)}`} l={`por habitante em 2025 (R$ ${fmt(C.judiciario.total, 1)} bi ÷ ${pop ? fmt(pop / 1e6, 1) : "~213"} mi)`} s="cálculo automático" />
          </Kpis>
        </Caixa>
        <Caixa titulo="Processos trabalhistas: o dado e o mito" fonte="TST via Poder360 (mai/2025); Agência Pública, Truco (2017)">
          <span className="pill neu">Checagem</span>
          <p style={{ margin: 0 }}>A frase de que o Brasil teria mais ações trabalhistas que o resto do mundo somado circula desde 2017 e foi classificada como <b>falsa</b> pela Agência Pública: a comparação misturava anos, contava números absolutos e a OIT diz que não há base internacional comparável.</p>
          <p style={{ margin: 0 }}>O dado real já é alto: a Justiça do Trabalho recebeu <b className="num">3,6 milhões</b> de novas ações em 2024, alta de 16,1% e o maior volume em 15 anos, voltando ao nível de antes da reforma trabalhista de 2017 (3,68 milhões).</p>
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* ---------------- Burocracia ---------------- */
export function Burocracia() {
  return (
    <Secao id="burocracia" k="O custo invisível" titulo="Burocracia, normas e estatais" intro="Além do que o Estado arrecada e gasta, há o custo que ele impõe para produzir: normas em excesso, licenças, insegurança jurídica e empresas públicas no vermelho.">
      <Kpis>
        <Kpi v="7,8" u="mi" l="normas editadas desde a Constituição de 1988, cerca de 860 por dia útil" s="IBPT · até set/2024" />
        <Kpi v="517.388" l="normas tributárias editadas no período, cerca de 39 por dia. Em vigor: ~36 mil" s="IBPT · até set/2024" />
        <Kpi alerta v="R$ 1,7" u="tri" l="por ano de Custo Brasil, 19,5% do PIB: o que custa produzir aqui a mais que a média da OCDE" s="MBC/MDIC · 2023" />
        <Kpi alerta v="−R$ 7,8" u="bi" l="déficit das estatais federais no 1º semestre de 2026, recorde desde 2002. Os Correios perderam R$ 8,5 bi em 2025" s="Banco Central · jul/2026" />
        <Kpi v="R$ 186,4" u="bi" l="economia possível em 10 anos limitando supersalários acima do teto de R$ 46,3 mil" s="República.org · mar/2026" />
        <Kpi v="R$ 1" u="bi" l="pago acima do teto só a magistrados da Justiça do Trabalho em 2025" s="CNJ · 2026" />
      </Kpis>
    </Secao>
  );
}
