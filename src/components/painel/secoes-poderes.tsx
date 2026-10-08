import { useState } from "react";
import type { Painel, Parlamentar } from "@/lib/painel/dados";
import { data, dataHora, fmt, frase, mesCurto, nomeProprio, reais } from "@/lib/painel/formatos";
import * as C from "@/data/curados";
import { HBarras, Legenda, Pilha, VBarras } from "./graficos";
import { AoVivo, Caixa, Ext, Grid2, Kpi, Kpis, Secao } from "./ui";

type P = { p: Painel };

/* ---------------- Judiciário ---------------- */
export function Judiciario() {
  const j = C.judiciario;
  return (
    <Secao id="judiciario" k="CNJ · Justiça em Números 2026 (ano-base 2025)" titulo="Judiciário" intro="O relatório anual do Conselho Nacional de Justiça é o retrato oficial do Poder. Em 2025 o gasto bateu recorde pelo quarto ano seguido, e 90,2% foi para pessoal.">
      <Kpis>
        <Kpi v={`R$ ${fmt(j.total, 1)}`} u="bi" l="Despesa total em 2025, recorde da série iniciada em 2009" s={`${fmt(j.pctPIB, 1)}% do PIB · ${fmt(j.pctGasto, 1)}% do gasto público total`} />
        <Kpi v={`R$ ${fmt(j.pessoal, 1)}`} u="bi" l={`Gasto com pessoal (${fmt(j.pctPessoal, 1)}%), alta de 9% sobre 2024`} s="CNJ 2026" />
        <Kpi alerta v="≈ R$ 10" u="bi" l={`Verbas indenizatórias, que permitem pagar acima do teto (${j.indenizatorias}, conforme o recorte)`} s="CNJ 2026" />
        <Kpi v={fmt(j.magistrados)} l={`magistrados e ${fmt(j.servidores)} servidores`} s="CNJ 2026" />
        <Kpi v={`${j.pctArrecadacao}%`} l={`da despesa volta em arrecadação (R$ ${fmt(j.arrecadacao, 1)} bi em custas, taxas e execuções)`} s="CNJ 2026" />
        <Kpi v={fmt(j.pendentes, 1)} u="mi" l={`processos pendentes. Entraram ${fmt(j.novos, 1)} mi novos em 2025, recorde`} s="CNJ 2026" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Despesa total do Judiciário" sub="R$ bilhões por ano" nota="2022 é aproximado. 2024 aparece com o valor revisado no relatório de 2026 (o de 2025 publicou R$ 146,5 bi)." fonte="CNJ, Justiça em Números 2023 a 2026">
          <VBarras dados={j.serie.map((x, i, a) => ({ k: x.ano, v: x.v, lab: "lab" in x && x.lab ? x.lab : fmt(x.v, 1), c: i === a.length - 1 ? "var(--crit)" : "var(--s3)", tip: <><b>{x.ano}</b><br />R$ {fmt(x.v, 1)} bi{"nota" in x && x.nota ? <><br />{x.nota}</> : null}</> }))} ticks={[0, 50, 100, 150]} max={185} titulo="Despesa do Judiciário" />
        </Caixa>
        <Caixa titulo="Custo da Justiça em % do PIB" sub="O Brasil tem o 2º Judiciário mais caro entre 50 países, atrás só de El Salvador." fonte="CNJ 2026; Tesouro Nacional (comparação internacional, 2025)">
          <HBarras dados={j.pibComparado.map((x) => ({ k: x.k, v: x.v, lab: `${fmt(x.v, 1)}% do PIB`, c: "brasil" in x ? "var(--crit)" : "var(--ink-3)", bold: "brasil" in x }))} lw={150} rw={110} titulo="Judiciário % PIB" />
        </Caixa>
      </Grid2>
      <Grid2>
        <Caixa titulo="Custo médio mensal de um magistrado" sub="R$ por mês, por ramo da Justiça (2024) e tribunais estaduais extremos (2025)" nota="O custo médio dos magistrados estaduais subiu 22,4% de 2024 para 2025. Na Justiça do Trabalho, R$ 1 bi foi pago acima do teto em 2025." fonte="CNJ, Justiça em Números 2025 e 2026; Correio do Estado; Folha">
          <HBarras dados={j.custoMagistrado.map((x) => ({ k: x.k, v: x.v, lab: `R$ ${fmt(x.v / 1000, 1)} mil`, c: "alerta" in x ? "var(--crit)" : "var(--s3)" }))} lw={190} rw={100} titulo="Custo por magistrado" />
        </Caixa>
        <Caixa titulo="Produtividade e estrutura" sub="Brasil × média dos países europeus (Cepej)" nota="Poucos juízes, cada um com volume altíssimo de processos e custo muito alto por cabeça." fonte={<>CNJ, Justiça em Números 2026 · <Ext href={j.url}>painel interativo do CNJ</Ext></>}>
          <div className="tscroll">
            <table className="t">
              <thead><tr><th>Indicador</th><th style={{ textAlign: "right" }}>Brasil</th><th style={{ textAlign: "right" }}>Europa</th></tr></thead>
              <tbody>
                <tr><td>Juízes por 100 mil habitantes</td><td className="n">8,9</td><td className="n">18</td></tr>
                <tr><td>Processos baixados por magistrado/ano</td><td className="n">2.366</td><td className="n">252</td></tr>
                <tr><td>Processos novos em 2025</td><td className="n">40,9 mi</td><td className="n">—</td></tr>
                <tr><td>Processos eletrônicos</td><td className="n">99,7%</td><td className="n">—</td></tr>
                <tr><td>Execução fiscal baixada: tempo médio</td><td className="n">8 a 2 m</td><td className="n">—</td></tr>
                <tr><td>Despesa da Justiça Estadual</td><td className="n">R$ 106,1 bi</td><td className="n">—</td></tr>
                <tr><td>Despesa da Justiça Federal</td><td className="n">R$ 16,9 bi</td><td className="n">—</td></tr>
              </tbody>
            </table>
          </div>
        </Caixa>
      </Grid2>
    </Secao>
  );
}

/* ---------------- Congresso e emendas ---------------- */
export function Congresso({ p }: P) {
  const e = C.emendas, live = p.dados.emendas;
  return (
    <Secao id="congresso" k="Legislativo" titulo="Congresso e emendas parlamentares" intro="Desde o orçamento impositivo de 2015, as emendas saíram de menos de R$ 10 bi para R$ 61,4 bi em 2026, ano eleitoral. Elas já passaram de um quinto da verba livre da União.">
      <Kpis>
        <Kpi alerta v={`R$ ${fmt(e.serie[e.serie.length - 1]?.v ?? 0, 1)}`} u="bi" l={`em emendas parlamentares na LOA 2026, R$ ${fmt(e.controleParlamentar, 1)} bi sob controle direto dos parlamentares`} s="LOA 2026" />
        {live ? (
          <Kpi v={reais(live.pago, 1)} l={`já pagos em emendas de ${live.ano} (de ${reais(live.empenhado, 1)} empenhados)`} s={<AoVivo coletadoEm={p.fontes["emendas"]?.coletadoEm} rotulo="Portal da Transparência" />} />
        ) : null}
        <Kpi v={`R$ ${fmt(e.porDeputado, 1)}`} u="mi" l="em emendas individuais por deputado federal" s="LOA 2026" />
        <Kpi v={`R$ ${fmt(e.porSenador, 1)}`} u="mi" l="em emendas individuais por senador" s="LOA 2026" />
        <Kpi v={`R$ ${fmt(e.fundoEleitoral, 1)}`} u="bi" l="Fundo Eleitoral de 2026" s="LOA 2026" />
        <Kpi v={`R$ ${fmt(C.camaraEstrutura.subsidio)}`} l="subsídio mensal de deputado. Com gabinete e cota, cerca de R$ 2,5 mi a R$ 3,5 mi por ano" s="Câmara · 2026" />
      </Kpis>
      <Grid2>
        <Caixa titulo="Emendas parlamentares ao Orçamento" sub="R$ bilhões. 2015, 2020 e 2024: valor autorizado. 2025 e 2026: LOA." nota="Em 2020, as emendas chegaram a 28,8% das despesas livres (discricionárias) da União; em 2024, a cerca de 20%." fonte="CNN Brasil (dados do governo); LOA 2025 e 2026">
          <VBarras dados={e.serie.map((x, i, a) => ({ k: x.ano, v: x.v, lab: fmt(x.v, 1), c: i === a.length - 1 ? "var(--s2)" : "var(--s1)" }))} ticks={[0, 20, 40, 60]} max={70} titulo="Emendas por ano" />
        </Caixa>
        <Caixa titulo="Como se dividem os R$ 61,4 bi de 2026" sub="R$ bilhões por tipo de emenda" fonte="LOA 2026; Congresso em Foco">
          <Pilha partes={[
            { k: "Individuais", v: e.tipos2026.individuais, lab: fmt(e.tipos2026.individuais, 1), c: "var(--s1)", tip: "Câmara R$ 20,5 bi · Senado R$ 5,9 bi" },
            { k: "Bancada estadual", v: e.tipos2026.bancada, lab: fmt(e.tipos2026.bancada, 1), c: "var(--s2)" },
            { k: "Comissão", v: e.tipos2026.comissao, lab: fmt(e.tipos2026.comissao, 1), c: "var(--s3)", tip: "execução não obrigatória" },
            { k: "Indicadas, sob gestão do Executivo", v: e.tipos2026.outras, lab: fmt(e.tipos2026.outras, 1), c: "var(--s4)" },
          ]} titulo="Tipos de emenda" />
          <Legenda itens={[{ cor: "var(--s1)", rotulo: "Individuais (impositivas)" }, { cor: "var(--s2)", rotulo: "Bancada (impositivas)" }, { cor: "var(--s3)", rotulo: "Comissão" }, { cor: "var(--s4)", rotulo: "Indicadas, executadas pelo governo" }]} />
        </Caixa>
      </Grid2>
      {live && live.porTipo.length > 0 && (
        <Caixa titulo={`Execução das emendas de ${live.ano}`} sub="R$ empenhados por tipo de emenda, segundo o Portal da Transparência" fonte={<Ext href={live.url}>Portal da Transparência, API de emendas</Ext>}>
          <HBarras dados={live.porTipo.slice(0, 6).map((t) => ({ k: t.nome, v: t.empenhado, lab: reais(t.empenhado), tip: <><b>{t.nome}</b><br />Empenhado: {reais(t.empenhado)}<br />Pago: {reais(t.pago)}</> }))} lw={220} rw={90} titulo="Execução das emendas" />
        </Caixa>
      )}
      <Caixa titulo="Mais Congresso a caminho" fonte="Congresso em Foco; Diário de Pernambuco; Correio 24 Horas">
        <div className="tscroll">
          <table className="t"><tbody>
            <tr><td>Deputados federais a partir de 2027</td><td className="n">{C.camaraEstrutura.deputados} → {C.camaraEstrutura.deputados2027}</td></tr>
            <tr><td>Custo anual estimado das 18 novas cadeiras</td><td className="n">R$ 64,6 mi a R$ 150 mi</td></tr>
            <tr><td>Novas vagas de deputado estadual decorrentes</td><td className="n">30</td></tr>
            <tr><td>Reajuste de servidores da Câmara e do Senado (impacto em 2026)</td><td className="n">R$ 790,4 mi</td></tr>
            <tr><td>Verba de gabinete por deputado (para pagar até 25 assessores)</td><td className="n">R$ {fmt(C.camaraEstrutura.verbaGabineteMensal)}/mês</td></tr>
            <tr><td>Verba de gabinete de todos os deputados, por ano (estimativa)</td><td className="n">{reais(C.camaraEstrutura.verbaGabineteMensal * C.camaraEstrutura.deputados * 12)}</td></tr>
          </tbody></table>
        </div>
      </Caixa>
    </Secao>
  );
}

/* ---------------- Câmara e Senado ao vivo ---------------- */
function TabelaParlamentares({ lista, link, casa }: { lista: Parlamentar[]; link: (x: Parlamentar) => string; casa: string }) {
  const [n, setN] = useState(10);
  return (
    <>
      <div className="tscroll">
        <table className="t">
          <thead><tr><th className="rank-n">#</th><th>{casa}</th><th>Partido/UF</th><th style={{ textAlign: "right" }}>Gasto no ano</th></tr></thead>
          <tbody>
            {lista.slice(0, n).map((x, i) => (
              <tr key={x.id}>
                <td className="rank-n">{i + 1}</td>
                <td><Ext href={link(x)}>{nomeProprio(x.nome)}</Ext></td>
                <td>{[x.partido, x.uf].filter(Boolean).join("-") || "—"}</td>
                <td className="n">{reais(x.valor, 0).replace(" mil", " mil")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {lista.length > n && (
        <div className="toggle"><button type="button" onClick={() => setN(lista.length)}>Ver os {lista.length} maiores</button></div>
      )}
    </>
  );
}

export function CamaraSenado({ p }: P) {
  const c = p.dados.camara, s = p.dados.senado;
  if (!c && !s) return null;
  const mesesC = (c?.porMes ?? []).map((m) => ({ k: mesCurto(m.mes), v: m.valor / 1e6, lab: fmt(m.valor / 1e6, 1), c: "var(--s1)", tip: <><b>{mesCurto(m.mes)}/{c?.ano}</b><br />{reais(m.valor)}</> }));
  const mesesS = (s?.ceaps.porMes ?? []).map((m) => ({ k: mesCurto(m.mes), v: m.valor / 1e6, lab: fmt(m.valor / 1e6, 1), c: "var(--s3)", tip: <><b>{mesCurto(m.mes)}/{s?.ceaps.ano}</b><br />{reais(m.valor)}</> }));
  return (
    <Secao id="ao-vivo" k="Atualizado automaticamente" titulo="Gastos da Câmara e do Senado"
      intro={<>Cota parlamentar (passagens, combustível, divulgação, escritório e outros reembolsos), folha e pessoal, direto das bases de dados abertos das duas Casas. Lançamentos dos meses recentes ainda estão chegando. <AoVivo coletadoEm={p.fontes["camara"]?.coletadoEm} rotulo="Última coleta" /></>}>
      <Kpis>
        {c && <Kpi v={reais(c.total)} l={`em cota parlamentar dos deputados em ${c.ano}, ${fmt(c.lancamentos)} notas lançadas até ${data(c.ultimaDataDocumento)}`} s="Câmara · dados abertos (arquivo diário)" />}
        {c && <Kpi v={reais(c.mediaPorDeputado, 0)} l={`em média por deputado no ano (${fmt(c.deputadosComGasto)} parlamentares com gasto, incluindo suplentes)`} s="Câmara · cálculo automático" />}
        {s && <Kpi v={reais(s.ceaps.total)} l={`em cota parlamentar dos senadores (CEAPS) em ${s.ceaps.ano}, até ${data(s.ceaps.ultimaDataDocumento)}`} s="Senado · API de dados abertos" />}
        {s && <Kpi v={reais(s.ceaps.mediaPorSenador, 0)} l="em média por senador no ano" s="Senado · cálculo automático" />}
        {s?.folha && <Kpi alerta v={reais(s.folha.bruto)} l={`de folha bruta do Senado em ${mesCurto(s.folha.mes)}/${s.folha.ano} (${fmt(s.folha.registros)} contracheques de servidores ativos, aposentados e pensionistas)`} s="Senado · API de remunerações" />}
        {s?.folha && <Kpi v={fmt(s.folha.contrachequesComAbateTeto)} l={`contracheques do Senado passaram do teto no mês e tiveram ${reais(s.folha.abateTeto)} cortados pelo abate-teto`} s="Senado · API de remunerações" />}
      </Kpis>
      <Grid2>
        {c && (
          <Caixa titulo={`Câmara: cota parlamentar por mês em ${c.ano}`} sub="R$ milhões, pela data da nota fiscal" nota="Os deputados têm até 90 dias para apresentar as notas, então os últimos meses ainda vão crescer." fonte={<Ext href={c.url}>Câmara dos Deputados, dados abertos da cota parlamentar</Ext>}>
            <VBarras dados={mesesC} ticks={[0, 5, 10, 15, 20, 25]} max={Math.max(26, ...mesesC.map((m) => m.v * 1.1))} d={1} titulo="Cota da Câmara por mês" />
          </Caixa>
        )}
        {s && (
          <Caixa titulo={`Senado: cota parlamentar por mês em ${s.ceaps.ano}`} sub="R$ milhões" fonte={<Ext href={s.url}>Senado Federal, dados abertos (CEAPS)</Ext>}>
            <VBarras dados={mesesS} ticks={[0, 1, 2, 3, 4]} max={Math.max(4.2, ...mesesS.map((m) => m.v * 1.1))} d={1} titulo="Cota do Senado por mês" />
          </Caixa>
        )}
      </Grid2>
      <Grid2>
        {c && (
          <Caixa titulo="Câmara: no que a cota é gasta" sub={`R$ milhões em ${c.ano}`} fonte="Câmara dos Deputados">
            <HBarras dados={c.porCategoria.slice(0, 8).map((x) => ({ k: frase(x.nome).slice(0, 34) + (x.nome.length > 34 ? "…" : ""), v: x.valor / 1e6, lab: fmt(x.valor / 1e6, 1), tip: <><b>{frase(x.nome)}</b><br />{reais(x.valor)}</> }))} lw={250} rw={60} titulo="Categorias da Câmara" />
          </Caixa>
        )}
        {s && (
          <Caixa titulo="Senado: no que a cota é gasta" sub={`R$ milhões em ${s.ceaps.ano}`} fonte="Senado Federal">
            <HBarras dados={s.ceaps.porTipo.filter((x) => x.valor > 1000).slice(0, 7).map((x) => ({ k: x.nome.split(",")[0]!.slice(0, 34), v: x.valor / 1e6, lab: fmt(x.valor / 1e6, 1), c: "var(--s3)", tip: <><b>{x.nome}</b><br />{reais(x.valor)}</> }))} lw={250} rw={60} titulo="Categorias do Senado" />
          </Caixa>
        )}
      </Grid2>
      <Grid2>
        {c && (
          <Caixa titulo="Deputados que mais gastaram a cota" sub={`Total no ano de ${c.ano}`} nota="O teto mensal da cota varia por estado (é maior para quem mora longe de Brasília)." fonte="Câmara dos Deputados">
            <TabelaParlamentares lista={c.maioresGastos} casa="Deputado" link={(x) => `https://www.camara.leg.br/deputados/${x.id}`} />
          </Caixa>
        )}
        {s && (
          <Caixa titulo="Senadores que mais gastaram a cota" sub={`Total no ano de ${s.ceaps.ano}`} fonte="Senado Federal">
            <TabelaParlamentares lista={s.ceaps.maioresGastos} casa="Senador" link={(x) => `https://www25.senado.leg.br/web/senadores/senador/-/perfil/${x.id}`} />
          </Caixa>
        )}
      </Grid2>
      <Grid2>
        {c && (
          <Caixa titulo="Câmara: gasto da cota por partido" sub={`R$ milhões em ${c.ano}`} fonte="Câmara dos Deputados">
            <HBarras dados={c.porPartido.slice(0, 12).map((x) => ({ k: x.nome, v: x.valor / 1e6, lab: fmt(x.valor / 1e6, 1) }))} lw={120} rw={60} titulo="Câmara por partido" />
          </Caixa>
        )}
        {c && (
          <Caixa titulo="Câmara: maiores fornecedores" sub={`R$ recebidos via cota em ${c.ano}`} nota="O mesmo fornecedor pode aparecer com grafias diferentes; os valores não foram unificados." fonte="Câmara dos Deputados">
            <HBarras dados={c.porFornecedor.slice(0, 8).map((x) => ({ k: x.nome.slice(0, 30) + (x.nome.length > 30 ? "…" : ""), v: x.valor / 1e6, lab: reais(x.valor), tip: <><b>{x.nome}</b><br />{reais(x.valor)}</> }))} lw={230} rw={90} titulo="Fornecedores da Câmara" />
          </Caixa>
        )}
      </Grid2>
      {s?.pessoal && (
        <Caixa titulo="Senado: quem trabalha lá" sub="Servidores ativos por tipo de vínculo, mais terceirizados" fonte={<Ext href={s.url}>Senado Federal, API de servidores e contratações</Ext>}>
          <HBarras dados={[
            ...Object.entries(s.pessoal.porVinculo).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ k: k === "COMISSIONADO" ? "Comissionados (sem concurso)" : k === "EFETIVO" ? "Efetivos (concursados)" : frase(k), v, lab: fmt(v), c: k === "COMISSIONADO" ? "var(--s2)" : "var(--s1)" })),
            ...(s.terceirizados ? [{ k: "Terceirizados", v: s.terceirizados, lab: fmt(s.terceirizados), c: "var(--ink-3)" }] : []),
          ]} lw={210} rw={70} titulo="Pessoal do Senado" />
          {s.moradia && <p className="note">{s.moradia.imovelFuncional} de {s.moradia.senadores} senadores ocupam imóvel funcional; {s.moradia.auxilioMoradia} recebem auxílio-moradia.</p>}
        </Caixa>
      )}
    </Secao>
  );
}

/* ---------------- Fontes ---------------- */
const STATUS: Record<string, [string, string]> = { ok: ["ok", "Atualizado"], erro: ["erro", "Falhou na última tentativa"], "sem-chave": ["sem", "Aguardando chave de API"], "nao-coletado": ["sem", "Não coletado"] };

export function Fontes({ p, origem }: P & { origem: string }) {
  return (
    <Secao id="fontes" k="Para conferir" titulo="Fontes e notas" intro="Cada dado traz a data da última divulgação. Os dados de APIs são coletados a cada 3 horas por um robô no GitHub; os demais vêm de relatórios anuais e são revisados manualmente.">
      <Caixa titulo="Situação das coletas automáticas" sub={`Arquivo de dados gerado em ${dataHora(p.geradoEm)} · ${origem === "remoto" ? "versão mais recente carregada do repositório" : "versão embutida no site"}`}>
        <div className="fontes-status">
          {Object.entries(p.fontes).map(([k, f]) => {
            const [cls, txt] = STATUS[f.status] ?? ["sem", f.status];
            return (
              <div key={k} className="fonte">
                <b>{f.nome}</b>
                <span className={cls}>{txt}</span>
                <span>{f.coletadoEm ? `Última coleta boa: ${dataHora(f.coletadoEm)}` : "Ainda sem coleta"}</span>
              </div>
            );
          })}
        </div>
      </Caixa>
      <ol className="sources">
        <li><Ext href="https://dadosabertos.bcb.gov.br/">Banco Central, SGS (dívida, déficit, juros, Selic, IPCA) — API</Ext></li>
        <li><Ext href="https://dadosabertos.camara.leg.br/swagger/api.html">Câmara dos Deputados, dados abertos da cota parlamentar — arquivo diário</Ext></li>
        <li><Ext href="https://adm.senado.gov.br/adm-dadosabertos/swagger-ui/index.html">Senado Federal, dados abertos administrativos — API</Ext></li>
        <li><Ext href="https://servicodados.ibge.gov.br/api/docs/agregados">IBGE, população estimada — API</Ext></li>
        <li><Ext href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392">Banco Mundial, indicadores — API</Ext></li>
        <li><Ext href="https://api.portaldatransparencia.gov.br/">Portal da Transparência, emendas — API (requer chave)</Ext></li>
        <li><Ext href={C.heritage.url}>Heritage Foundation, Index of Economic Freedom 2026</Ext></li>
        <li><Ext href={C.fraser.url}>Fraser Institute, Economic Freedom of the World 2026</Ext></li>
        <li><Ext href="https://www.mackenzie.br/fileadmin/ARQUIVOS/Public/6-pos-graduacao/upm-higienopolis/mestrado-doutorado/economia_mercados/2025/Indice_2025_-_VF.pdf">Mackenzie, Índice de Liberdade Econômica Estadual 2025</Ext></li>
        <li><Ext href={C.lleNacional.url}>Liberdade para Trabalhar / ILISP, adesão à Lei de Liberdade Econômica</Ext></li>
        <li><Ext href={C.judiciario.url}>CNJ, Justiça em Números 2026</Ext></li>
        <li><Ext href="https://www.reformatributaria.com/economia-reforma-tributaria-impactos/carga-tributaria-bate-recorde-em-2025-e-atinge-324-do-pib/">Tesouro Nacional, carga tributária 2025</Ext></li>
        <li><Ext href="https://www.contabeis.com.br/noticias/77195/brasileiro-trabalhou-150-dias-para-pagar-impostos-em-2026/">IBPT, dias trabalhados para pagar tributos</Ext></li>
        <li><Ext href="https://eesp.fgv.br/sites/default/files/files-eesp/relatorio_gastos_tributarios_e_zona_franca_de_manaus_v_18_de_junho2025.pdf">FGV/Márcio Holland, custo fiscal da Zona Franca de Manaus</Ext></li>
        <li><Ext href="https://ontl.infrasa.gov.br/wp-content/uploads/2025/12/PANORAMA-DO-SISTEMA-FERROVIARIO-BRASILEIRO-14.12.25_.pdf">Infra S.A., Panorama do Sistema Ferroviário Brasileiro</Ext></li>
        <li><Ext href="https://www.poder360.com.br/poder-infra/qualidade-das-rodovias-melhora-em-2025-mas-62-seguem-problematicas/">Pesquisa CNT de Rodovias 2025</Ext></li>
        <li><Ext href="https://www.poder360.com.br/poder-internacional/brasil-fica-em-107o-em-ranking-de-percepcao-de-corrupcao/">Transparência Internacional, IPC 2025</Ext></li>
        <li><Ext href="https://static.poder360.com.br/uploads/2026/09/Resultados_Pisa_2025_Final.pdf">OCDE/Inep, PISA 2025</Ext></li>
        <li><Ext href="https://www.congressoemfoco.com.br/noticia/120720/mortes-violentas-chegam-ao-menor-patamar-em-14-anos-veja-mapa">FBSP, Anuário Brasileiro de Segurança Pública 2026</Ext></li>
        <li><Ext href="https://www.congressoemfoco.com.br/noticia/115071/congresso-aprova-orcamento-de-2026-com-superavit-de-r-34-5-bilhoes">LOA 2026 e emendas</Ext></li>
        <li><Ext href="https://apublica.org/?p=39469">Agência Pública, checagem sobre ações trabalhistas</Ext></li>
      </ol>
    </Secao>
  );
}
