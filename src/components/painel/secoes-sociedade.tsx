import type { Painel, ValorPais } from "@/lib/painel/dados";
import { fmt } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { BarrasAgrupadas, HBarras, Legenda, Linha, VBarras } from "./graficos";
import { AoVivo, Caixa, Ext, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

const NOMES_PAIS: Record<string, string> = { BRA: "Brasil", WLD: "Média mundial", ARG: "Argentina", CHL: "Chile", MEX: "México", CHN: "China", IND: "Índia", ZAF: "África do Sul", USA: "Estados Unidos", EUU: "União Europeia", JPN: "Japão" };
const barrasPais = (vals: ValorPais[]) =>
  [...vals]
    .sort((a, b) => b.valor - a.valor)
    .map((x) => ({ k: `${NOMES_PAIS[x.pais] ?? x.nome}`, v: x.valor, lab: `${fmt(x.valor, 1)}%`, c: x.pais === "BRA" ? "var(--crit)" : "var(--ink-3)", bold: x.pais === "BRA", tip: <><b>{NOMES_PAIS[x.pais] ?? x.nome}</b><br />{fmt(x.valor, 1)}% ({x.ano})</> }));

/* ---------------- Indústria e importação ---------------- */
export function Industria({ p }: P) {
  const wb = p.dados.bancoMundial;
  const bra = (lista?: ValorPais[]) => lista?.find((x) => x.pais === "BRA");
  const ab = bra(wb?.abertura?.valores), tar = bra(wb?.tarifaMedia?.valores), mundo = wb?.abertura?.valores.find((x) => x.pais === "WLD");
  return (
    <Secao id="protecionismo" k="Economia fechada" titulo="Proteção e subsídios à indústria" intro={<>O Brasil é uma das economias mais fechadas do mundo e distribui centenas de bilhões por ano em subsídios. Mesmo assim, a indústria de transformação encolheu de 21% para cerca de 12% do PIB em quatro décadas. <AoVivo coletadoEm={p.fontes["bancoMundial"]?.coletadoEm} rotulo="Banco Mundial" /></>}>
      <Kpis>
        {ab && <Kpi alerta v={fmt(ab.valor, 1)} u="% PIB" l={`abertura comercial (exportações + importações) em ${ab.ano}.${mundo ? ` Média mundial: ${fmt(mundo.valor, 1)}%` : ""}`} s="Banco Mundial · API" />}
        {tar && <Kpi alerta v={`${fmt(tar.valor, 1)}%`} l={`tarifa média simples de importação (${tar.ano}). EUA: 2,7%; Chile: 1,0%`} s="Banco Mundial (WITS) · API" />}
        <Kpi v="86,4%" l="das importações enfrentam barreiras não tarifárias (licenças, cotas, normas). Média mundial: 72%" s="BTG Pactual / WITS · jul/2025" />
        <Kpi v="0,71" u="% PIB" l="arrecadação com Imposto de Importação em 2025, recorde da série" s="Tesouro Nacional · 2025" />
      </Kpis>
      <Grid2>
        {wb?.tarifaMedia && (
          <Caixa titulo="Tarifa média de importação" sub="% sobre o valor importado, média simples de todos os produtos" fonte={<Ext href={wb.tarifaMedia.url}>Banco Mundial, TM.TAX.MRCH.SM.AR.ZS</Ext>}>
            <HBarras dados={barrasPais(wb.tarifaMedia.valores)} lw={130} rw={60} titulo="Tarifa média" />
          </Caixa>
        )}
        {wb?.abertura && (
          <Caixa titulo="Abertura comercial" sub="Exportações + importações, % do PIB" fonte={<Ext href={wb.abertura.url}>Banco Mundial, NE.TRD.GNFS.ZS</Ext>}>
            <HBarras dados={barrasPais(wb.abertura.valores)} lw={130} rw={60} titulo="Abertura comercial" />
          </Caixa>
        )}
      </Grid2>
      <Grid2>
        <Caixa titulo="Subsídios da União" sub="Benefícios tributários, financeiros e de crédito, R$ bilhões por ano" nota="Em 2024: R$ 678,4 bi, ou 5,78% do PIB. Isso é mais que o orçamento da Saúde e da Educação somados." fonte="Ministério do Planejamento, Orçamento de Subsídios da União (ago/2025)">
          <VBarras dados={C.subsidiosUniao.map((x, i, a) => ({ k: x.ano, v: x.v, lab: fmt(x.v), c: i === a.length - 1 ? "var(--crit)" : "var(--s1)", tip: <><b>{x.ano}</b><br />R$ {fmt(x.v, 1)} bi</> }))} ticks={[0, 200, 400, 600]} max={780} titulo="Subsídios da União" />
        </Caixa>
        <Caixa titulo="Mais incentivo, menos indústria" sub="Participação da indústria de transformação no PIB" nota="A política industrial atual, Nova Indústria Brasil, prometeu R$ 300 bi em financiamentos de 2024 a 2026, a maior parte via BNDES." fonte="IEDI (preços constantes de 2015); Governo Federal, jan/2024">
          <HBarras dados={[{ k: "1980 (pico)", v: 21.1, c: "var(--ink-3)", lab: "21,1% do PIB" }, { k: "2020", v: 11.88, c: "var(--crit)", bold: true, lab: "11,9% do PIB" }]} lw={110} rw={100} max={25} titulo="Indústria no PIB" />
        </Caixa>
      </Grid2>
      <Caixa titulo="Indústria automotiva: incentivo contínuo, produção estagnada" nota="O Mover é o sucessor do Rota 2030 (R$ 1,7 bi por ano em média) e do Inovar-Auto, que sucederam outros regimes automotivos desde a década de 1950. Em troca, o consumidor brasileiro paga tarifa de 35% sobre carros importados e tem acesso a menos modelos." fonte="Poder360; InfoMoney/Anfavea; Contábeis">
        <Kpis>
          <Kpi fundo v="R$ 19,3" u="bi" l="em incentivos fiscais do programa Mover de 2024 a 2028 (R$ 3,9 bi em 2026)" s="MP 1.205/2023" />
          <Kpi fundo v="2,64" u="mi" l="veículos produzidos em 2025, ainda abaixo dos quase 3 milhões de 2019" s="Anfavea · jan/2026" />
          <Kpi fundo v="≈ 59%" l="de uso da capacidade: 2,64 mi produzidos para cerca de 4,5 mi de capacidade instalada" s="cálculo do painel" />
          <Kpi fundo v="35%" l="de imposto de importação sobre carros elétricos desde julho de 2026. Importados já são 18,5% das vendas" s="Contábeis; Anfavea" />
        </Kpis>
      </Caixa>
    </Secao>
  );
}

/* ---------------- Zona Franca ---------------- */
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
  return (
    <Secao id="zfm" k="Checagem" titulo="Zona Franca de Manaus" intro="Criada em 1967 e prorrogada até 2073, a ZFM importa a maior parte dos insumos, monta no meio da floresta e reenvia quase tudo para o Sudeste, com frete de ida e volta pago pelo consumidor.">
      <Kpis>
        <Kpi alerta v={`R$ ${fmt(z.renunciaTotal, 1)}`} u="bi" l="renúncia fiscal federal estimada para a ZFM em 2024. Em 2023, a estimativa foi de R$ 55,3 bi" s="Receita Federal via FGV (Márcio Holland, jun/2025)" />
        <Kpi v={fmt(z.empregos)} l="empregos diretos no Polo Industrial de Manaus em 2025 (média mensal)" s="Suframa · jan/2026" />
        <Kpi v="65%" l="dos insumos vêm do exterior. Só 2% do faturamento vem de exportações" s="Amazônia 2030 / CPI PUC-Rio (dados de 2019)" />
        <Kpi v="5%" l="do faturamento vira salário no polo. Média da indústria brasileira: 11%. 59% dos empregados ganham até 2 salários mínimos" s="Amazônia 2030 (2019); IBGE PIA (2018)" />
      </Kpis>
      <Caixa titulo="“Sairia mais barato pagar os trabalhadores para ficar em casa”" fonte="FGV/Holland (2025); Suframa (2026); Amazônia 2030/CPI (2021)"
        nota={`Pela medida ampla, a renúncia é quase o triplo de toda a folha do polo: daria para pagar o salário de cada trabalhador e ainda sobrariam cerca de R$ ${fmt(z.renunciaTotal - folha, 0)} bi por ano. Pela medida estreita, que considera só a indústria, o custo por emprego fica perto de um salário. Os valores não incluem os incentivos de ICMS do Amazonas, que aumentariam o custo. Cálculos do painel.`}>
        <span className="pill neu">Checagem</span>
        <p className="sub" style={{ margin: 0 }}>Veredito: <b>verdadeiro pelo custo total da ZFM, discutível pelo custo só do polo industrial.</b> Não encontramos estudo publicado que faça essa conta; abaixo, a conta com os números oficiais.</p>
        <HBarras dados={[
          { k: "Renúncia total ZFM", v: z.renunciaTotal, c: "var(--crit)", lab: `R$ ${fmt(z.renunciaTotal, 1)} bi` },
          { k: "Folha do polo (estim.)", v: folha, c: "var(--s3)", lab: `≈ R$ ${fmt(folha, 1)} bi` },
          { k: "Renúncia só do polo (alta)", v: z.renunciaPoloAlta, c: "var(--s2)", lab: `R$ ${fmt(z.renunciaPoloAlta, 1)} bi` },
          { k: "Renúncia só do polo (baixa)", v: z.renunciaPoloBaixa, c: "var(--s2)", lab: `R$ ${fmt(z.renunciaPoloBaixa, 1)} bi` },
        ]} lw={190} rw={100} titulo="ZFM: renúncia e folha" />
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

/* ---------------- Logística ---------------- */
export function Logistica() {
  const f = C.ferrovias;
  const br = (x: { brasil?: boolean }) => (x.brasil ? "var(--crit)" : "var(--ink-3)");
  return (
    <Secao id="logistica" k="Infraestrutura" titulo="Ferrovias e rodovias" intro="Um país continental que move dois terços da carga em caminhão, sobre estradas de asfalto em mau estado. A malha ferroviária é menor hoje do que em 1960.">
      <Kpis>
        <Kpi alerta v="30,8" u="mil km" l="de ferrovias, incluindo trechos desativados. O pico foi de 38 mil km, por volta de 1960" s="Infra S.A. · Panorama Ferroviário 2025" />
        <Kpi v="72%" l="do que os trens carregam é minério de ferro (2024)" s="Infra S.A. · 2025" />
        <Kpi alerta v="12,6" u="% PIB" l="custo logístico no Brasil. Nos EUA: 6% a 7%" s="ILOS/Abol · 2020" />
        <Kpi alerta v="62%" l="das rodovias avaliadas estão regulares, ruins ou péssimas. O pavimento ruim encarece o frete em 31,2%" s="Pesquisa CNT de Rodovias 2025" />
        <Kpi v="2%" l="das rodovias federais têm pavimento de concreto. O DNIT quer chegar a 10% até 2035" s="DNIT via DGABC · jun/2025" />
        <Kpi v="R$ 7,2" u="bi" l="de diesel desperdiçado por ano por causa da má qualidade das estradas" s="CNT · dez/2025" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Densidade ferroviária" sub="km de ferrovia por 1.000 km² de território" nota="Entre 10 países comparados, o Brasil fica em último." fonte="Infra S.A., Panorama do Sistema Ferroviário Brasileiro (dez/2025)">
          <HBarras dados={f.densidade.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={50} titulo="Densidade ferroviária" />
        </Caixa>
        <Caixa titulo="Quanto da carga vai de trem" sub="Participação da ferrovia no transporte de carga (t·km)" nota="No Brasil, 68% da carga vai por rodovia. Nos EUA, 42%." fonte="Infra S.A./ONTL (2025, dados de 2021); Rússia: Panorama Ferroviário 2025">
          <HBarras dados={f.participacao.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1).replace(",0", "")}%`, c: br(x), bold: Boolean(x.brasil) }))} lw={130} rw={60} max={100} titulo="Participação da ferrovia" />
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

/* ---------------- O que volta ---------------- */
export function Retorno() {
  return (
    <Secao id="retorno" k="O que o contribuinte recebe" titulo="O que volta para a sociedade" intro="Carga de país rico, entrega de país pobre: integridade, educação e segurança, com os dados mais recentes de cada série.">
      <Kpis>
        <Kpi alerta pill="2ª pior nota da série" v={<>35 <small>/100</small></>} l="no Índice de Percepção da Corrupção 2025. Brasil em 107º de 182 países" s="Transparência Internacional · fev/2026" />
        <Kpi alerta pill="1º do mundo" v="45.562" l="homicídios em 2021, maior número absoluto do planeta, cerca de 10% do total mundial com 2,6% da população" s="ONU · Estudo Global sobre Homicídios (dez/2023)" />
        <Kpi alerta v="40,7" u="mil" l="mortes violentas intencionais em 2025 (19,1 por 100 mil). Menor nível desde 2012, ainda 3 vezes a média mundial de 5,8" s="FBSP · Anuário 2026" />
        <Kpi alerta v="84,7" u="mil" l="pessoas desaparecidas em 2025, média de 232 por dia" s="FBSP · Anuário 2026" />
        <Kpi v="6,6" u="mil" l="mortes por intervenção policial em 2025, recorde: 1 em cada 6 mortes violentas" s="FBSP · Anuário 2026" />
        <Kpi v="377" l="pontos em matemática no PISA 2025, 92 abaixo da média da OCDE (469)" s="OCDE · PISA 2025 (set/2026)" />
      </Kpis>
      <Grid2>
        <Caixa titulo="PISA 2025: Brasil × média da OCDE" sub="Pontuação média dos alunos de 15 anos" nota="Em relação a 2022: matemática −2, leitura −2, ciências +6. Cerca de 20 pontos equivalem a um ano letivo, então a distância em matemática é de mais de quatro anos de escola." fonte="OCDE, PISA 2025">
          <BarrasAgrupadas grupos={C.pisa2025.map((x) => ({ k: x.k, valores: [x.brasil, x.ocde] }))} series={["Brasil", "Média OCDE"]} cores={["var(--crit)", "var(--ink-3)"]} max={520} ticks={[0, 100, 200, 300, 400, 500]} fmtValor={(n) => fmt(n)} fmtTick={(n) => fmt(n)} titulo="PISA 2025" />
          <Legenda itens={[{ cor: "var(--crit)", rotulo: "Brasil" }, { cor: "var(--ink-3)", rotulo: "Média OCDE" }]} />
        </Caixa>
        <Caixa titulo="Estados mais e menos violentos" sub="Mortes violentas intencionais por 100 mil habitantes, 2025" nota="Maranguape (CE) teve a maior taxa entre cidades com mais de 100 mil habitantes: 100,3 por 100 mil." fonte="Fórum Brasileiro de Segurança Pública, Anuário 2026">
          <HBarras dados={C.violenciaUF.map((x) => ({ k: x.k, v: x.v, lab: fmt(x.v, 1), bold: x.tipo === "brasil", c: x.tipo === "alto" ? "var(--crit)" : x.tipo === "baixo" ? "var(--good)" : x.tipo === "brasil" ? "var(--band-bg)" : "var(--ink-3)" }))} lw={160} rw={60} titulo="Violência por UF" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* ---------------- Funcionalismo ---------------- */
export function Funcionalismo({ p }: P) {
  const sen = p.dados.senado;
  return (
    <Secao id="funcionalismo" k="Quantos são" titulo="Funcionalismo" intro="Seis em cada dez servidores trabalham em prefeituras. O número de municipais cresceu 3,8% em um ano, e a fatia sem vínculo permanente subiu para 26,8%.">
      <Kpis>
        <Kpi v="7,6" u="mi" l="Servidores municipais (+280 mil em 2024)" s="IBGE Munic · 2024" />
        <Kpi v="3,1" u="mi" l="Servidores estaduais e distritais (+3%)" s="IBGE Estadic · 2024" />
        <Kpi v="987,5" u="mil" l="Servidores ativos da administração federal, civis e militares" s="MGI · mar/2026" />
        <Kpi v="569.230" l="Civis ativos do Executivo federal (−4.255 em um ano)" s="Painel Estatístico de Pessoal · jun/2026" />
        <Kpi v="R$ 214,4" u="bi" l="Gasto da União com pessoal no 1º semestre de 2026, alta real de 10,6%" s="Tesouro · 1º sem/2026" />
        {sen?.pessoal ? (
          <Kpi v={fmt(sen.pessoal.ativos)} l={`servidores ativos no Senado, ${fmt(sen.pessoal.porVinculo["COMISSIONADO"] ?? 0)} deles comissionados (sem concurso). Mais ${fmt(sen.terceirizados ?? 0)} terceirizados`} s={<AoVivo coletadoEm={p.fontes["senado"]?.coletadoEm} rotulo="API do Senado" />} />
        ) : (
          <Kpi v={<>12 <small>em 100</small></>} l="trabalhadores brasileiros são servidores. Média da OCDE: 21" s="Ipea/OCDE" />
        )}
      </Kpis>
      <Grid2>
        <Caixa titulo="Servidores ativos por esfera" sub="Milhões de pessoas" nota="Pelo registro da RAIS (Ipea), eram cerca de 12 milhões de vínculos públicos em 2023. A PNAD contou 12,65 milhões de pessoas no setor público no 2º tri de 2024, recorde da série." fonte="IBGE Munic e Estadic 2024; MGI/Correio da Manhã mar/2026; Ipea Atlas do Estado">
          <HBarras dados={[{ k: "Municípios", v: 7.6, c: "var(--s3)", lab: "7,6 mi (65%)" }, { k: "Estados e DF", v: 3.1, c: "var(--s2)", lab: "3,1 mi (27%)" }, { k: "União", v: 0.9875, c: "var(--s1)", lab: "0,99 mi (8%)" }]} lw={110} rw={110} titulo="Servidores por esfera" />
        </Caixa>
        <Caixa titulo="Executivo federal: servidores civis ativos" sub="Posição em junho de cada ano" nota="O pico da série, desde 2018, foi de 633.635 servidores no governo Temer." fonte="Painel Estatístico de Pessoal (MGI) via Poder360">
          <Linha pontos={C.executivoFederal.map((x) => ({ x: x.ano, k: String(x.ano), v: x.v, lab: `${fmt(x.v / 1000, 1)} mil`, tip: `${fmt(x.v)} servidores` }))} min={540000} max={590000} ticks={[540000, 560000, 580000]} titulo="Executivo federal" />
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* ---------------- Salários ---------------- */
export function Salarios() {
  const cores = ["var(--s1)", "var(--s2)", "var(--s3)"];
  return (
    <Secao id="salarios" k="Quanto ganham" titulo="Salários no setor público" intro="A média esconde dois Estados diferentes: a base, nas prefeituras, ganha perto do trabalhador privado; o topo, no Judiciário e no nível federal, ganha várias vezes mais.">
      <Grid2>
        <Caixa titulo="Remuneração média por esfera e Poder" sub="R$ por mês, valores brutos sem “penduricalhos”. RAIS 2019, última matriz completa publicada pelo Ipea." nota="Municípios não têm Judiciário próprio. A mediana do Executivo municipal em 2023 era R$ 2.640, e a mediana de todo o setor público, R$ 3.281." fonte="Ipea, Atlas do Estado Brasileiro (RAIS 2019 e 2023)">
          <BarrasAgrupadas grupos={C.salariosRAIS2019.map((g) => ({ k: g.k, valores: g.valores, ...("nota" in g && g.nota ? { nota: g.nota } : {}) }))} series={["Executivo", "Legislativo", "Judiciário"]} cores={cores} max={17000} ticks={[0, 5000, 10000, 15000]}
            fmtValor={(n) => `${fmt(n / 1000, 1).replace(",0", "")}k`} fmtTick={(n) => (n ? `${fmt(n / 1000)} mil` : "0")} titulo="Remuneração por esfera e Poder" />
          <Legenda itens={[{ cor: "var(--s1)", rotulo: "Executivo" }, { cor: "var(--s2)", rotulo: "Legislativo" }, { cor: "var(--s3)", rotulo: "Judiciário" }]} />
        </Caixa>
        <Caixa titulo="Quem ganha acima de R$ 15 mil" sub="% dos vínculos em cada Poder. RAIS 2019." fonte="Ipea, Atlas do Estado Brasileiro">
          <HBarras dados={C.acima15mil.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1)}%`, c: cores[x.p] ?? "var(--s1)" }))} max={60} lw={150} titulo="Acima de R$ 15 mil" />
        </Caixa>
      </Grid2>
      <Caixa titulo="A escada salarial em 2025–2026" sub="R$ por mês. Rendimentos e custos médios mais recentes, do trabalhador comum ao topo do Judiciário." nota="“Custo” inclui salário, benefícios, encargos e indenizações pagos pelo tribunal. “Remuneração” é o valor bruto recebido." fonte="IBGE PNAD; Ipea; Câmara dos Deputados; CNJ Justiça em Números 2026; Folha/Jornal de Brasília">
        <HBarras dados={C.escadaSalarial.map((x) => ({ k: x.k, v: x.v, lab: `R$ ${fmt(x.v)}`, c: x.tipo === 3 ? "var(--crit)" : x.tipo === -1 ? "var(--ink-3)" : cores[x.tipo] ?? "var(--s1)", tip: <><b>{x.k}</b><br />R$ {fmt(x.v)}/mês<br />{x.nota}</> }))} lw={230} rw={96} titulo="Escada salarial" />
      </Caixa>
    </Secao>
  );
}
