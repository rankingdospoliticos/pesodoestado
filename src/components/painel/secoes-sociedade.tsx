import type { Painel, ValorPais } from "@/lib/painel/dados";
import { fmt } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { quantos } from "@/lib/painel/equivalencias";
import { BarrasAgrupadas, HBarras, Legenda, Linha, VBarras } from "./graficos";
import { Halteres, Versus, Waffle } from "./visuais";
import { Equivale } from "./equivale";
import { AoVivo, Caixa, Ext, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

const NOMES_PAIS: Record<string, string> = { BRA: "Brasil", WLD: "Média mundial", ARG: "Argentina", CHL: "Chile", MEX: "México", CHN: "China", IND: "Índia", ZAF: "África do Sul", USA: "Estados Unidos", EUU: "União Europeia", JPN: "Japão" };
const barrasPais = (vals: ValorPais[]) =>
  [...vals]
    .sort((a, b) => b.valor - a.valor)
    .map((x) => ({ k: `${NOMES_PAIS[x.pais] ?? x.nome}`, v: x.valor, lab: `${fmt(x.valor, 1)}%`, c: x.pais === "BRA" ? "var(--crit)" : "var(--ink-3)", bold: x.pais === "BRA", tip: <><b>{NOMES_PAIS[x.pais] ?? x.nome}</b><br />{fmt(x.valor, 1)}% ({x.ano})</> }));

/** "= 129 salários mínimos" para dicas de salário. */
const emSM = (v: number) => `${fmt(quantos(v, "salario"), 1).replace(",0", "")} salários mínimos`;

/* =================== 5. Funcionalismo =================== */
export function Funcionalismo({ p }: P) {
  const sen = p.dados.senado;
  return (
    <Secao id="funcionalismo" n={5} k="Quem trabalha para o Estado" titulo="Funcionalismo"
      intro="Cerca de 11,7 milhões de pessoas trabalham para o poder público. Seis em cada dez estão nas prefeituras, onde o número cresceu 3,8% em um ano, e a fatia sem vínculo permanente subiu para 26,8%."
      ponte="Quantas pessoas é uma parte da conta. A outra é quanto cada uma ganha, e aí as diferenças são enormes.">
      <Kpis>
        <Kpi v="7,6" u="mi" l="servidores municipais (+280 mil em 2024)" s="IBGE Munic · 2024" />
        <Kpi v="3,1" u="mi" l="servidores estaduais e distritais (+3%)" s="IBGE Estadic · 2024" />
        <Kpi v="987,5" u="mil" l="servidores ativos da administração federal, civis e militares" s="MGI · mar/2026" />
        <Kpi alerta v="R$ 214,4" u="bi" l="gasto da União com pessoal só no 1º semestre de 2026, alta real de 10,6%" s="Tesouro · 1º sem/2026" eq={214.4e9} eqUn={["casa", "professor"]} />
        {sen?.pessoal ? (
          <Kpi v={fmt(sen.pessoal.ativos)} l={`servidores ativos no Senado, ${fmt(sen.pessoal.porVinculo["COMISSIONADO"] ?? 0)} deles comissionados (sem concurso), para 81 senadores. Mais ${fmt(sen.terceirizados ?? 0)} terceirizados`} s={<AoVivo coletadoEm={p.fontes["senado"]?.coletadoEm} rotulo="API do Senado" />} />
        ) : (
          <Kpi v={<>12 <small>em 100</small></>} l="trabalhadores brasileiros são servidores. Média da OCDE: 21" s="Ipea/OCDE" />
        )}
      </Kpis>
      <Grid2>
        <Caixa titulo="Onde estão os 11,7 milhões de servidores" sub="Servidores ativos por esfera de governo" nota="Pelo registro da RAIS (Ipea), eram cerca de 12 milhões de vínculos públicos em 2023. A PNAD contou 12,65 milhões de pessoas no setor público no 2º tri de 2024, recorde da série." fonte="IBGE Munic e Estadic 2024; MGI mar/2026; Ipea Atlas do Estado">
          <Waffle titulo="Servidores por esfera" unidade="cerca de 117 mil servidores" partes={[
            { k: "Municípios", v: 7.6, c: "var(--s3)", lab: "7,6 milhões (65%)" },
            { k: "Estados e DF", v: 3.1, c: "var(--s2)", lab: "3,1 milhões (27%)" },
            { k: "União", v: 0.9875, c: "var(--s1)", lab: "0,99 milhão (8%)" },
          ]} />
          <Legenda itens={[{ cor: "var(--s3)", rotulo: "Municípios 65%" }, { cor: "var(--s2)", rotulo: "Estados e DF 27%" }, { cor: "var(--s1)", rotulo: "União 8%" }]} />
        </Caixa>
        <Caixa titulo="Executivo federal: servidores civis ativos" sub="Milhares de servidores, posição em junho de cada ano" nota="O pico da série, desde 2018, foi de 633.635 servidores no governo Temer." fonte="Painel Estatístico de Pessoal (MGI) via Poder360">
          <Linha pontos={C.executivoFederal.map((x) => ({ x: x.ano, k: String(x.ano), v: x.v / 1000, lab: `${fmt(x.v / 1000, 1)} mil`, tip: `${fmt(x.v)} servidores` }))} min={540} max={590} ticks={[540, 560, 580]} titulo="Executivo federal, milhares" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* =================== 6. Salários =================== */
export function Salarios() {
  const cores = ["var(--s1)", "var(--s2)", "var(--s3)"];
  const topo = C.escadaSalarial[C.escadaSalarial.length - 1]!;
  return (
    <Secao id="salarios" n={6} k="Quanto ganham" titulo="Salários no setor público"
      intro="A média esconde dois Estados diferentes: a base, nas prefeituras, ganha perto do trabalhador privado; o topo, no Judiciário e no nível federal, ganha várias vezes mais, e boa parte acima do teto constitucional."
      ponte="O topo da escada está no Judiciário. É por ele que começa a visita aos Poderes.">
      <Caixa titulo="A escada salarial em 2025–2026" sub={`R$ por mês, do trabalhador comum ao topo do Judiciário. Passe o mouse para ver quantos salários mínimos (R$ 1.621) cada um representa.`} nota={`“Custo” inclui salário, benefícios, encargos e indenizações pagos pelo tribunal. “Remuneração” é o valor bruto recebido. O magistrado do TJ-RJ custa por mês o equivalente a ${emSM(topo.v)}.`} fonte="IBGE PNAD; Ipea; Câmara dos Deputados; CNJ Justiça em Números 2026; Folha/Jornal de Brasília">
        <HBarras dados={C.escadaSalarial.map((x) => ({ k: x.k, v: x.v, lab: `R$ ${fmt(x.v)}`, c: x.tipo === 3 ? "var(--crit)" : x.tipo === -1 ? "var(--ink-3)" : cores[x.tipo] ?? "var(--s1)", tip: <><b>{x.k}</b><br />R$ {fmt(x.v)}/mês = {emSM(x.v)}<br />{x.nota}</> }))} lw={230} rw={96} titulo="Escada salarial" />
      </Caixa>
      <Grid2>
        <Caixa titulo="Remuneração média por esfera e Poder" sub="R$ por mês, valores brutos sem “penduricalhos”. RAIS 2019, última matriz completa publicada pelo Ipea." nota="Municípios não têm Judiciário próprio. A mediana do Executivo municipal em 2023 era R$ 2.640, e a mediana de todo o setor público, R$ 3.281." fonte="Ipea, Atlas do Estado Brasileiro (RAIS 2019 e 2023)">
          <BarrasAgrupadas grupos={C.salariosRAIS2019.map((g) => ({ k: g.k, valores: g.valores, ...("nota" in g && g.nota ? { nota: g.nota } : {}) }))} series={["Executivo", "Legislativo", "Judiciário"]} cores={cores} max={17000} ticks={[0, 5000, 10000, 15000]}
            fmtValor={(n) => `${fmt(n / 1000, 1).replace(",0", "")}k`} fmtTick={(n) => (n ? `${fmt(n / 1000)} mil` : "0")} titulo="Remuneração por esfera e Poder" />
          <Legenda itens={[{ cor: "var(--s1)", rotulo: "Executivo" }, { cor: "var(--s2)", rotulo: "Legislativo" }, { cor: "var(--s3)", rotulo: "Judiciário" }]} />
        </Caixa>
        <Caixa titulo="Quem ganha acima de R$ 15 mil" sub="% dos vínculos em cada Poder. RAIS 2019." nota="Limitar os supersalários acima do teto de R$ 46,3 mil economizaria R$ 186,4 bi em 10 anos (República.org, mar/2026)." fonte="Ipea, Atlas do Estado Brasileiro">
          <HBarras dados={C.acima15mil.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1)}%`, c: cores[x.p] ?? "var(--s1)" }))} max={60} lw={150} titulo="Acima de R$ 15 mil" />
          <Equivale valor={18.64e9} prefixo="A economia de um ano com o teto pagaria" un={["casa", "ubs"]} />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* =================== 10. Subsídios e proteção =================== */
export function Industria({ p }: P) {
  const wb = p.dados.bancoMundial;
  const bra = (lista?: ValorPais[]) => lista?.find((x) => x.pais === "BRA");
  const ab = bra(wb?.abertura?.valores), tar = bra(wb?.tarifaMedia?.valores), mundo = wb?.abertura?.valores.find((x) => x.pais === "WLD");
  const gt = C.gastosTributarios;
  return (
    <Secao id="protecionismo" n={10} k="O que o Estado dá a poucos" titulo="Subsídios, benefícios e proteção"
      intro={<>Além de gastar, o Estado abre mão de receita em favor de setores escolhidos e protege a indústria da concorrência externa. Mesmo assim, a indústria de transformação encolheu de 21% para cerca de 12% do PIB em quatro décadas. <AoVivo coletadoEm={p.fontes["bancoMundial"]?.coletadoEm} rotulo="Banco Mundial" /></>}
      ponte="O caso mais extremo de incentivo regional fica no meio da Amazônia.">
      <Kpis>
        <Kpi alerta v="R$ 678,4" u="bi" l="em subsídios da União em 2024 (tributários, financeiros e de crédito), 5,78% do PIB: mais que Saúde e Educação somadas" s="Ministério do Planejamento · ago/2025" eq={678.4e9} eqUn={["casa", "icesp"]} />
        <Kpi alerta v={`R$ ${fmt(gt.total, 1)}`} u="bi" l={`em benefícios tributários previstos para 2026 (${fmt(gt.pctPIB, 2)}% do PIB). Eram R$ ${fmt(gt.anterior, 1)} bi em 2025`} s="PLDO 2026" />
        {tar && <Kpi alerta v={`${fmt(tar.valor, 1)}%`} l={`tarifa média de importação (${tar.ano}). EUA: 2,7%; Chile: 1,0%`} s="Banco Mundial (WITS) · API" />}
        {ab && <Kpi alerta v={fmt(ab.valor, 1)} u="% PIB" l={`de abertura comercial (exportações + importações) em ${ab.ano}.${mundo ? ` Média mundial: ${fmt(mundo.valor, 1)}%` : ""}`} s="Banco Mundial · API" />}
      </Kpis>
      <Grid2>
        <Caixa titulo="Subsídios da União" sub="Benefícios tributários, financeiros e de crédito, R$ bilhões por ano" fonte="Ministério do Planejamento, Orçamento de Subsídios da União (ago/2025)">
          <VBarras dados={C.subsidiosUniao.map((x, i, a) => ({ k: x.ano, v: x.v, lab: fmt(x.v), c: i === a.length - 1 ? "var(--crit)" : "var(--s1)", tip: <><b>{x.ano}</b><br />R$ {fmt(x.v, 1)} bi</> }))} ticks={[0, 200, 400, 600]} max={780} titulo="Subsídios da União" />
        </Caixa>
        <Caixa titulo="Quem recebe os benefícios tributários" sub={`Projeção para 2026, R$ bilhões. Total: R$ ${fmt(gt.total, 1)} bi.`} fonte="Demonstrativo de Gastos Tributários, PLDO 2026">
          <HBarras dados={gt.itens.map((x) => ({ ...x, lab: `R$ ${fmt(x.v, 1)} bi` }))} lw={160} rw={100} titulo="Gastos tributários" />
        </Caixa>
      </Grid2>
      <Grid2>
        {wb?.tarifaMedia && (
          <Caixa titulo="Tarifa média de importação" sub="% sobre o valor importado, média simples de todos os produtos" nota="Além da tarifa, 86,4% das importações enfrentam barreiras não tarifárias (licenças, cotas, normas). Média mundial: 72%." fonte={<Ext href={wb.tarifaMedia.url}>Banco Mundial, TM.TAX.MRCH.SM.AR.ZS; BTG/WITS (jul/2025)</Ext>}>
            <HBarras dados={barrasPais(wb.tarifaMedia.valores)} lw={130} rw={60} titulo="Tarifa média" />
          </Caixa>
        )}
        {wb?.abertura && (
          <Caixa titulo="Abertura comercial" sub="Exportações + importações, % do PIB" fonte={<Ext href={wb.abertura.url}>Banco Mundial, NE.TRD.GNFS.ZS</Ext>}>
            <HBarras dados={barrasPais(wb.abertura.valores)} lw={130} rw={60} titulo="Abertura comercial" />
          </Caixa>
        )}
      </Grid2>
      <Caixa titulo="Indústria automotiva: incentivo contínuo, produção estagnada" nota="O Mover é o sucessor do Rota 2030 (R$ 1,7 bi por ano em média) e do Inovar-Auto, que sucederam outros regimes automotivos desde a década de 1950. Em troca, o consumidor paga tarifa de 35% sobre carros importados e tem acesso a menos modelos. A política industrial atual, Nova Indústria Brasil, prometeu R$ 300 bi em financiamentos de 2024 a 2026." fonte="Poder360; InfoMoney/Anfavea; Contábeis; IEDI; Governo Federal">
        <Kpis>
          <Kpi fundo v="R$ 19,3" u="bi" l="em incentivos fiscais do programa Mover de 2024 a 2028 (R$ 3,9 bi em 2026)" s="MP 1.205/2023" eq={19.3e9} eqUn={["casa", "creche"]} />
          <Kpi fundo v="2,64" u="mi" l="veículos produzidos em 2025, ainda abaixo dos quase 3 milhões de 2019, com cerca de 59% da capacidade em uso" s="Anfavea · jan/2026" />
          <Kpi fundo v="21% → 12%" l="participação da indústria de transformação no PIB, do pico de 1980 a 2020" s="IEDI (preços de 2015)" />
        </Kpis>
      </Caixa>
    </Secao>
  );
}

/* =================== 11. Zona Franca =================== */
export function ZonaFranca() {
  const z = C.zfm;
  const porEmp = (bi: number) => (bi * 1e9) / z.empregos;
  const folha = (z.faturamento * z.pctSalarios) / 100;
  const linhas = [
    { k: "Renúncia federal total da ZFM (Receita, 2024)", bi: z.renunciaTotal },
    { k: "Só o polo industrial, faixa alta (Holland, 2024)", bi: z.renunciaPoloAlta },
    { k: "Só o polo industrial, faixa baixa (Holland, 2024)", bi: z.renunciaPoloBaixa },
    { k: "Folha de salários estimada do polo (5% do faturamento)", bi: folha, aprox: true },
  ];
  const custoMes = porEmp(z.renunciaTotal) / 12, salMes = porEmp(folha) / 12;
  return (
    <Secao id="zfm" n={11} k="Checagem" titulo="Zona Franca de Manaus"
      intro="Criada em 1967 e prorrogada até 2073, a ZFM importa a maior parte dos insumos, monta no meio da floresta e reenvia quase tudo para o Sudeste, com frete de ida e volta pago pelo consumidor."
      ponte="Incentivos como esse são uma parte do custo de produzir no Brasil. A próxima parte mostra o resto: regras, papelada e estradas.">
      <Kpis>
        <Kpi alerta v={`R$ ${fmt(z.renunciaTotal, 1)}`} u="bi" l="de renúncia fiscal federal estimada para a ZFM em 2024. Em 2023, a estimativa foi de R$ 55,3 bi" s="Receita Federal via FGV (Márcio Holland, jun/2025)" eq={z.renunciaTotal * 1e9} eqUn={["casa", "ubs"]} />
        <Kpi v={fmt(z.empregos)} l="empregos diretos no Polo Industrial de Manaus em 2025 (média mensal)" s="Suframa · jan/2026" />
        <Kpi v="65%" l="dos insumos vêm do exterior. Só 2% do faturamento vem de exportações" s="Amazônia 2030 / CPI PUC-Rio (dados de 2019)" />
        <Kpi v="5%" l="do faturamento vira salário no polo. Média da indústria brasileira: 11%. 59% dos empregados ganham até 2 salários mínimos" s="Amazônia 2030 (2019); IBGE PIA (2018)" />
      </Kpis>
      <Caixa titulo="“Sairia mais barato pagar os trabalhadores para ficar em casa”" fonte="FGV/Holland (2025); Suframa (2026); Amazônia 2030/CPI (2021)"
        nota={`Pela medida ampla, a renúncia é quase o triplo de toda a folha do polo: daria para pagar o salário de cada trabalhador e ainda sobrariam cerca de R$ ${fmt(z.renunciaTotal - folha, 0)} bi por ano. Pela medida estreita, que considera só a indústria, o custo por emprego fica perto de um salário. Os valores não incluem os incentivos de ICMS do Amazonas, que aumentariam o custo. Cálculos do painel.`}>
        <span className="pill neu">Checagem</span>
        <p className="sub" style={{ margin: 0 }}>Veredito: <b>verdadeiro pelo custo total da ZFM, discutível pelo custo só do polo industrial.</b> Não encontramos estudo publicado que faça essa conta; abaixo, a conta com os números oficiais.</p>
        <Versus
          a={{ rotulo: "Renúncia fiscal por emprego, por mês", v: custoMes, lab: `R$ ${fmt(custoMes)}`, c: "var(--crit)", nota: "renúncia total ÷ 131.401 empregos ÷ 12" }}
          b={{ rotulo: "Salário médio estimado no polo, por mês", v: salMes, lab: `≈ R$ ${fmt(salMes)}`, c: "var(--s3)", nota: "folha estimada ÷ empregos ÷ 12" }}
          fator={`${fmt(custoMes / salMes, 1)}×`}
          legenda="o custo fiscal de cada emprego é quase o triplo do salário que ele paga"
        />
        <div className="tscroll">
          <table className="t">
            <thead><tr><th>Medida de custo</th><th style={{ textAlign: "right" }}>Custo por ano</th><th style={{ textAlign: "right" }}>Por emprego/ano</th><th style={{ textAlign: "right" }}>Por emprego/mês</th></tr></thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.k}>
                  <td>{l.k}</td>
                  <td className="n">{l.aprox ? "≈ " : ""}R$ {fmt(l.bi, 1)} bi</td>
                  <td className="n">{l.aprox ? "≈ " : ""}R$ {fmt(porEmp(l.bi) / 1000, 1)} mil</td>
                  <td className="n">{l.aprox ? "≈ " : ""}R$ {fmt(porEmp(l.bi) / 12000, 1)} mil</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Caixa>
    </Secao>
  );
}

/* =================== 13. Logística =================== */
export function Logistica() {
  const f = C.ferrovias;
  const br = (x: { brasil?: boolean }) => (x.brasil ? "var(--crit)" : "var(--ink-3)");
  return (
    <Secao id="logistica" n={13} k="Infraestrutura" titulo="Ferrovias e rodovias"
      intro="Um país continental que move dois terços da carga em caminhão, sobre estradas de asfalto em mau estado. A malha ferroviária é menor hoje do que em 1960."
      ponte="Somados, imposto alto, burocracia e infraestrutura ruim aparecem nos rankings internacionais de liberdade econômica.">
      <Kpis>
        <Kpi alerta v="12,6" u="% PIB" l="custo logístico no Brasil. Nos EUA: 6% a 7%" s="ILOS/Abol · 2020" />
        <Kpi alerta v="62%" l="das rodovias avaliadas estão regulares, ruins ou péssimas. O pavimento ruim encarece o frete em 31,2%" s="Pesquisa CNT de Rodovias 2025" />
        <Kpi alerta v="R$ 7,2" u="bi" l="de diesel desperdiçado por ano por causa da má qualidade das estradas" s="CNT · dez/2025" eq={7.2e9} eqUn={["onibus", "ubs"]} />
        <Kpi v="30,8" u="mil km" l="de ferrovias, incluindo trechos desativados. O pico foi de 38 mil km, por volta de 1960. 72% do que os trens carregam é minério de ferro" s="Infra S.A. · 2025" />
        <Kpi v="2%" l="das rodovias federais têm pavimento de concreto. O DNIT quer chegar a 10% até 2035" s="DNIT via DGABC · jun/2025" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Quanto da carga vai de trem" sub="Participação da ferrovia no transporte de carga (t·km)" nota="No Brasil, 68% da carga vai por rodovia. Nos EUA, 42%." fonte="Infra S.A./ONTL (2025, dados de 2021); Rússia: Panorama Ferroviário 2025">
          <HBarras dados={f.participacao.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1).replace(",0", "")}%`, c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={60} max={100} titulo="Participação da ferrovia" />
        </Caixa>
        <Caixa titulo="Densidade ferroviária" sub="km de ferrovia por 1.000 km² de território" nota="Entre os países comparados, o Brasil fica em último." fonte="Infra S.A., Panorama do Sistema Ferroviário Brasileiro (dez/2025)">
          <HBarras dados={f.densidade.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={50} titulo="Densidade ferroviária" />
        </Caixa>
      </Grid2>
      <Grid2>
        <Caixa titulo="Extensão das malhas ferroviárias" sub="mil km" nota="O Brasil, 5º maior país do mundo em área, tem malha parecida com a da França, que cabe 15 vezes no território brasileiro." fonte="CIA World Factbook (2014–2018); Infra S.A. (Brasil, 2023)">
          <HBarras dados={f.extensao.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={56} titulo="Extensão ferroviária" />
        </Caixa>
        <Caixa titulo="Estradas pavimentadas por território" sub="km pavimentados por 1.000 km²" nota="Só 54% da malha federal é pavimentada. Na Amazônia, a BR-319, única ligação rodoviária de Manaus com o resto do país, tem cerca de 340 km críticos sem asfalto; o DNIT lançou editais para o trecho em abril de 2026." fonte="Infra S.A./ONTL (2025); DNIT; Correio 24 Horas (abr/2026)">
          <HBarras dados={C.rodoviasDensidade.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={56} titulo="Densidade rodoviária" />
        </Caixa>
      </Grid2>
      <Caixa titulo="Asfalto × concreto" nota="O concreto custa mais para construir e menos para manter. Os números de vida útil e economia vêm de estudos citados pelo setor de transporte e cimento; trate como ordem de grandeza." fonte="DNIT e estudos citados pelo Diário do Grande ABC (jun/2025)">
        <div className="tscroll">
          <table className="t">
            <thead><tr><th /><th>Asfalto (flexível)</th><th>Concreto (rígido)</th></tr></thead>
            <tbody>
              <tr><td>Participação nas rodovias federais</td><td>≈ 98%</td><td>≈ 2%</td></tr>
              <tr><td>Vida útil típica</td><td>cerca de 10 anos</td><td>até 30 anos, com pouca manutenção</td></tr>
              <tr><td>Custo ao longo da vida útil</td><td>maior, com recapeamentos</td><td>até 40% menor, segundo estudos citados pelo setor</td></tr>
              <tr><td>Estados que já investem</td><td>—</td><td>PR, SC, BA e MA</td></tr>
            </tbody>
          </table>
        </div>
      </Caixa>
    </Secao>
  );
}

/* =================== 16. O que volta =================== */
export function Retorno() {
  return (
    <Secao id="retorno" n={16} k="O que o contribuinte recebe" titulo="O que volta para quem paga"
      intro="Carga de país rico, entrega de país pobre. Entre os 30 países de carga mais alta, o Brasil é o que menos devolve em bem-estar. Integridade, educação e segurança mostram por quê.">
      <Kpis>
        <Kpi alerta pill="Último de 30" v="30º" l="no índice de retorno dos impostos em bem-estar (IRBES), entre os 30 países de maior carga" s="IBPT · última edição" />
        <Kpi alerta pill="2ª pior nota da série" v={<>35 <small>/100</small></>} l="no Índice de Percepção da Corrupção 2025. Brasil em 107º de 182 países" s="Transparência Internacional · fev/2026" />
        <Kpi alerta pill="1º do mundo" v="45.562" l="homicídios em 2021, maior número absoluto do planeta: cerca de 10% do total mundial com 2,6% da população" s="ONU · Estudo Global sobre Homicídios (dez/2023)" />
        <Kpi alerta v="40,7" u="mil" l="mortes violentas intencionais em 2025 (19,1 por 100 mil). Menor nível desde 2012, ainda 3 vezes a média mundial de 5,8" s="FBSP · Anuário 2026" />
        <Kpi alerta v="84,7" u="mil" l="pessoas desaparecidas em 2025, média de 232 por dia" s="FBSP · Anuário 2026" />
        <Kpi v="6,6" u="mil" l="mortes por intervenção policial em 2025, recorde: 1 em cada 6 mortes violentas" s="FBSP · Anuário 2026" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Mesma carga dos ricos, sem o retorno" sub="Carga tributária, % do PIB, metodologia comparável da OCDE, 2024" nota="A média da OCDE reúne países com renda per capita várias vezes maior que a brasileira, e serviços públicos à altura." fonte="Revenue Statistics in Latin America and the Caribbean 2026 (OCDE, CIAT, BID, Cepal)">
          <HBarras dados={C.cargaOCDE.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1)}%`, c: "brasil" in x ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in x }))} lw={180} rw={70} max={40} titulo="Carga OCDE" />
        </Caixa>
        <Caixa titulo="PISA 2025: a distância para os países ricos" sub="Pontuação média dos alunos de 15 anos. Vermelho: Brasil. Cinza: média da OCDE." nota="Cerca de 20 pontos equivalem a um ano letivo: em matemática, o aluno brasileiro está mais de quatro anos atrás. Em relação a 2022: matemática −2, leitura −2, ciências +6." fonte="OCDE, PISA 2025">
          <Halteres titulo="PISA 2025, Brasil × OCDE" min={340} max={510} ticks={[350, 400, 450, 500]}
            dados={C.pisa2025.map((x) => ({ k: x.k, a: x.brasil, b: x.ocde, nota: `≈ ${fmt((x.ocde - x.brasil) / 20, 1)} anos letivos de atraso` }))} />
          <Legenda itens={[{ cor: "var(--crit)", rotulo: "Brasil" }, { cor: "var(--ink-3)", rotulo: "Média OCDE" }]} />
        </Caixa>
      </Grid2>
      <Caixa titulo="Estados mais e menos violentos" sub="Mortes violentas intencionais por 100 mil habitantes, 2025" nota="Maranguape (CE) teve a maior taxa entre cidades com mais de 100 mil habitantes: 100,3 por 100 mil." fonte="Fórum Brasileiro de Segurança Pública, Anuário 2026">
        <HBarras dados={C.violenciaUF.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), bold: x.tipo === "brasil", c: x.tipo === "alto" ? "var(--crit)" : x.tipo === "baixo" ? "var(--good)" : x.tipo === "brasil" ? "var(--band-bg)" : "var(--ink-3)" }))} lw={160} rw={60} titulo="Violência por UF" />
      </Caixa>
    </Secao>
  );
}
