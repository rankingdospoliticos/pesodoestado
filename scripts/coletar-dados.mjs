#!/usr/bin/env node
/**
 * Coletor de dados do painel "O Peso do Estado".
 *
 * Consulta APIs públicas oficiais e grava um único JSON consumido pelo site.
 * Roda no GitHub Actions (ver .github/workflows/atualizar-dados.yml), mas também
 * pode ser executado à mão:  node scripts/coletar-dados.mjs --saida src/data/painel.json
 *
 * Regras:
 * - Cada fonte é independente. Se uma falhar, o valor anterior do arquivo é mantido
 *   e a fonte fica marcada com status "erro" (o site mostra a data da última coleta boa).
 * - Sem dependências externas: só Node 20+ (fetch, zlib).
 * - Chaves opcionais via variável de ambiente (ex.: PORTAL_TRANSPARENCIA_API_KEY).
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { inflateRawSync } from "node:zlib";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "1"]);
    return acc;
  }, []),
);
const SAIDA = args.saida || "src/data/painel.json";
const SO = args.so ? new Set(args.so.split(",")) : null; // ex.: --so bcb,camara
const AGORA = new Date();
const ANO = AGORA.getUTCFullYear();
const UA = "PesoDoEstado/1.0 (+https://ranking.org.br; coleta de dados públicos)";
/** Alguns serviços (IBGE, Banco Mundial) recusam robôs com identificação própria vindos de nuvem. */
const UA_NAVEGADOR = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 PesoDoEstado/1.0";

/* ---------------- utilidades ---------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function http(url, { tipo = "json", tentativas = 3, headers = {}, timeout = 120_000 } = {}) {
  let ultimoErro;
  for (let t = 1; t <= tentativas; t++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    try {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/json, */*", ...headers }, signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
      const meta = { lastModified: r.headers.get("last-modified") };
      if (tipo === "json") return { corpo: await r.json(), meta };
      if (tipo === "texto") return { corpo: await r.text(), meta };
      return { corpo: new Uint8Array(await r.arrayBuffer()), meta };
    } catch (e) {
      ultimoErro = e;
      if (t < tentativas) await sleep(2000 * t);
    } finally {
      clearTimeout(timer);
    }
  }
  throw ultimoErro;
}

/** Lê o primeiro arquivo de um .zip (usa o diretório central, aceita data descriptor). */
function unzipPrimeiro(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let e = buf.length - 22;
  while (e > 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e <= 0) throw new Error("zip inválido");
  const cd = dv.getUint32(e + 16, true);
  const metodo = dv.getUint16(cd + 10, true);
  const csize = dv.getUint32(cd + 20, true);
  const lho = dv.getUint32(cd + 42, true);
  const inicio = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
  const dados = buf.subarray(inicio, inicio + csize);
  return metodo === 0 ? Buffer.from(dados) : inflateRawSync(dados);
}

/** CSV com ";" e aspas duplas. */
function parseCSV(texto, sep = ";") {
  const linhas = [];
  let campo = "", linha = [], aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else aspas = false; }
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ""; }
    else if (c === "\n") { linha.push(campo); linhas.push(linha); linha = []; campo = ""; }
    else if (c !== "\r") campo += c;
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas;
}

const numBR = (s) => parseFloat(String(s ?? "0").replace(/\./g, "").replace(",", ".")) || 0;
const r2 = (n) => Math.round(n * 100) / 100;
const ordenar = (obj, lim) => Object.entries(obj).map(([k, v]) => ({ nome: k, valor: Math.round(v) })).sort((a, b) => b.valor - a.valor).slice(0, lim ?? 999);
const dataBCB = (d) => { const [dd, mm, aa] = d.split("/"); return `${aa}-${mm}-${dd}`; };
const fmtBCB = (dt) => `${String(dt.getUTCDate()).padStart(2, "0")}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}/${dt.getUTCFullYear()}`;

/* ---------------- fontes ---------------- */

/** Banco Central — SGS. Códigos conferidos contra a nota de estatísticas fiscais de ago/2026. */
const SERIES_BCB = {
  dividaBrutaPIB: { cod: 13762, nome: "Dívida bruta do governo geral", unidade: "% do PIB", historico: true },
  dividaBrutaR: { cod: 13761, nome: "Dívida bruta do governo geral", unidade: "R$ milhões" },
  dividaLiquidaPIB: { cod: 4513, nome: "Dívida líquida do setor público", unidade: "% do PIB", historico: true },
  primario12mPIB: { cod: 5793, nome: "Déficit primário do setor público, 12 meses (NFSP)", unidade: "% do PIB", historico: true },
  primario12mR: { cod: 5078, nome: "Déficit primário do setor público, 12 meses (NFSP)", unidade: "R$ milhões" },
  nominal12mPIB: { cod: 5727, nome: "Déficit nominal do setor público, 12 meses", unidade: "% do PIB", historico: true },
  nominal12mR: { cod: 5012, nome: "Déficit nominal do setor público, 12 meses", unidade: "R$ milhões" },
  juros12mPIB: { cod: 5760, nome: "Juros nominais do setor público, 12 meses", unidade: "% do PIB", historico: true },
  juros12mR: { cod: 5045, nome: "Juros nominais do setor público, 12 meses", unidade: "R$ milhões" },
  pib12mR: { cod: 4382, nome: "PIB acumulado em 12 meses", unidade: "R$ milhões" },
  selic: { cod: 432, nome: "Meta da taxa Selic", unidade: "% ao ano" },
  ipca12m: { cod: 13522, nome: "IPCA acumulado em 12 meses", unidade: "%" },
};

async function fonteBCB() {
  const inicio = new Date(Date.UTC(ANO - 4, 0, 1));
  const hoje = AGORA.toISOString().slice(0, 10);
  const series = {};
  for (const [chave, s] of Object.entries(SERIES_BCB)) {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${s.cod}/dados?formato=json&dataInicial=${fmtBCB(inicio)}`;
    const { corpo } = await http(url);
    const pontos = corpo.map((p) => ({ data: dataBCB(p.data), valor: parseFloat(p.valor) })).filter((p) => p.data <= hoje && Number.isFinite(p.valor));
    if (!pontos.length) throw new Error(`série ${s.cod} vazia`);
    const ultimo = pontos[pontos.length - 1];
    series[chave] = {
      ...s,
      ultimo,
      ...(s.historico ? { historico: pontos.filter((p) => p.data.endsWith("-01")).slice(-48) } : {}),
      url: `https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarValores&optSelecionaSerie=${s.cod}`,
    };
    await sleep(300);
  }
  return series;
}

/** Câmara dos Deputados — Cota para o Exercício da Atividade Parlamentar (arquivo diário). */
async function fonteCamara() {
  const url = `https://www.camara.leg.br/cotas/Ano-${ANO}.csv.zip`;
  const { corpo, meta } = await http(url, { tipo: "binario", timeout: 300_000 });
  const texto = unzipPrimeiro(corpo).toString("utf8").replace(/^\uFEFF/, ""); // o arquivo vem com BOM, que estragava o nome da 1ª coluna
  const linhas = parseCSV(texto);
  const cab = linhas.shift().map((h) => h.replace(/^\uFEFF/, "").trim());
  const ix = Object.fromEntries(cab.map((h, i) => [h, i]));
  if (ix.txNomeParlamentar == null) throw new Error(`coluna txNomeParlamentar não encontrada no CSV (cabeçalho: ${cab.slice(0, 5).join(", ")}…)`);
  let total = 0, lancamentos = 0, ultimaData = "";
  const porMes = {}, porCategoria = {}, porPartido = {}, porUF = {}, porDeputado = {}, porFornecedor = {};
  for (const l of linhas) {
    if (l.length < cab.length) continue;
    const v = parseFloat(l[ix.vlrLiquido]) || 0;
    total += v; lancamentos++;
    const mes = l[ix.numMes];
    porMes[mes] = (porMes[mes] || 0) + v;
    const cat = (l[ix.txtDescricao] || "").replace(/\.$/, "").trim();
    porCategoria[cat] = (porCategoria[cat] || 0) + v;
    const forn = (l[ix.txtFornecedor] || "").trim();
    if (forn) porFornecedor[forn] = (porFornecedor[forn] || 0) + v;
    const d = (l[ix.datEmissao] || "").slice(0, 10);
    if (d > ultimaData && d <= AGORA.toISOString().slice(0, 10)) ultimaData = d;
    const id = l[ix.ideCadastro];
    if (id) {
      const p = l[ix.sgPartido], uf = l[ix.sgUF];
      porPartido[p] = (porPartido[p] || 0) + v;
      porUF[uf] = (porUF[uf] || 0) + v;
      const dep = (porDeputado[id] ||= { id: Number(id), nome: l[ix.txNomeParlamentar], partido: p, uf, valor: 0 });
      dep.valor += v;
    }
  }
  const deputados = Object.values(porDeputado);
  return {
    ano: ANO,
    total: Math.round(total),
    lancamentos,
    deputadosComGasto: deputados.length,
    mediaPorDeputado: Math.round(total / Math.max(1, deputados.length)),
    ultimaDataDocumento: ultimaData,
    arquivoAtualizadoEm: meta.lastModified,
    porMes: Object.entries(porMes).map(([m, v]) => ({ mes: Number(m), valor: Math.round(v) })).sort((a, b) => a.mes - b.mes),
    porCategoria: ordenar(porCategoria, 12),
    porPartido: ordenar(porPartido, 15),
    porUF: ordenar(porUF),
    porFornecedor: ordenar(porFornecedor, 10),
    maioresGastos: deputados.sort((a, b) => b.valor - a.valor).slice(0, 20).map((d) => ({ ...d, valor: Math.round(d.valor) })),
    url: "https://www.camara.leg.br/transparencia/gastos-parlamentares",
  };
}

/** Senado Federal — API de dados abertos administrativos (CEAPS, folha, quadro de pessoal). */
async function fonteSenado() {
  const base = "https://adm.senado.gov.br/adm-dadosabertos/api/v1";
  const out = { url: "https://www12.senado.leg.br/transparencia" };

  // Lista de senadores (partido e UF)
  let mapa = {};
  try {
    const { corpo } = await http(`${base}/senadores`);
    for (const s of corpo.data || corpo) mapa[(s.nomeParlamentar || "").toUpperCase()] = { partido: s.partido, uf: s.uf };
  } catch { /* segue sem partido */ }

  // CEAPS do ano
  const { corpo: ceaps } = await http(`${base}/senadores/despesas_ceaps/${ANO}`, { timeout: 300_000 });
  let total = 0, ultimaData = "";
  const porMes = {}, porTipo = {}, porSenador = {}, porPartido = {};
  for (const d of ceaps) {
    const v = Number(d.valorReembolsado) || 0;
    total += v;
    porMes[d.mes] = (porMes[d.mes] || 0) + v;
    const t = (d.tipoDespesa || "Não informado").trim().replace(/[.,]\s*$/, "");
    porTipo[t] = (porTipo[t] || 0) + v;
    const nome = d.nomeSenador;
    const info = mapa[(nome || "").toUpperCase()] || {};
    const s = (porSenador[d.codSenador] ||= { id: d.codSenador, nome, partido: info.partido || "", uf: info.uf || "", valor: 0 });
    s.valor += v;
    if (info.partido) porPartido[info.partido] = (porPartido[info.partido] || 0) + v;
    if (d.data && d.data > ultimaData && d.data <= AGORA.toISOString().slice(0, 10)) ultimaData = d.data;
  }
  const senadores = Object.values(porSenador);
  out.ceaps = {
    ano: ANO,
    total: Math.round(total),
    lancamentos: ceaps.length,
    senadoresComGasto: senadores.length,
    mediaPorSenador: Math.round(total / Math.max(1, senadores.length)),
    ultimaDataDocumento: ultimaData,
    porMes: Object.entries(porMes).map(([m, v]) => ({ mes: Number(m), valor: Math.round(v) })).sort((a, b) => a.mes - b.mes),
    porTipo: ordenar(porTipo, 10),
    porPartido: ordenar(porPartido, 15),
    maioresGastos: senadores.sort((a, b) => b.valor - a.valor).slice(0, 20).map((s) => ({ ...s, valor: Math.round(s.valor) })),
  };

  // Folha de pagamento: último mês disponível (tenta até 4 meses para trás)
  for (let k = 1; k <= 4; k++) {
    const dt = new Date(Date.UTC(ANO, AGORA.getUTCMonth() - k, 1));
    const a = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1;
    try {
      const { corpo } = await http(`${base}/servidores/remuneracoes/${a}/${m}`, { timeout: 300_000, tentativas: 1 });
      const arr = corpo.data || corpo;
      if (!Array.isArray(arr) || !arr.length) continue;
      let bruto = 0, liquido = 0, abateTeto = 0, nAbate = 0;
      for (const x of arr) {
        bruto += numBR(x.remuneracao_basica) + numBR(x.vantagens_pessoais) + numBR(x.funcao_comissionada) + numBR(x.gratificacao_natalina) + numBR(x.horas_extras) + numBR(x.outras_eventuais) + numBR(x.abono_permanencia);
        liquido += numBR(x.remuneracao_liquida);
        const t = numBR(x.reversao_teto_constitucional);
        if (t !== 0) { abateTeto += Math.abs(t); nAbate++; }
      }
      out.folha = { ano: a, mes: m, registros: arr.length, bruto: Math.round(bruto), liquido: Math.round(liquido), abateTeto: Math.round(abateTeto), contrachequesComAbateTeto: nAbate };
      break;
    } catch { /* tenta mês anterior */ }
  }

  // Quadro de pessoal ativo
  try {
    const { corpo } = await http(`${base}/servidores/servidores/ativos`, { timeout: 300_000 });
    const arr = corpo.data || corpo;
    const porVinculo = {};
    for (const s of arr) porVinculo[s.vinculo || "OUTROS"] = (porVinculo[s.vinculo || "OUTROS"] || 0) + 1;
    out.pessoal = { ativos: arr.length, porVinculo };
  } catch { /* opcional */ }

  // Terceirizados
  try {
    const { corpo } = await http(`${base}/contratacoes/terceirizados`, { timeout: 300_000 });
    const arr = corpo.data || corpo;
    out.terceirizados = arr.filter((x) => !x.situacao || /^ativo/i.test(String(x.situacao).trim())).length;
  } catch { /* opcional */ }

  // Imóveis funcionais e auxílio-moradia
  try {
    const { corpo } = await http(`${base}/senadores/auxilio-moradia-imoveis-funcionais`);
    const arr = corpo.data || corpo;
    out.moradia = { imovelFuncional: arr.filter((x) => x.imovelFuncional === "S").length, auxilioMoradia: arr.filter((x) => x.auxilioMoradia === "S").length, senadores: arr.length };
  } catch { /* opcional */ }

  return out;
}

/** IBGE — população estimada (para valores por habitante). */
async function fonteIBGE() {
  const { corpo } = await http("https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-1/variaveis/9324?localidades=N1%5Ball%5D", { headers: { "user-agent": UA_NAVEGADOR, accept: "application/json" } });
  const serie = corpo[0].resultados[0].series[0].serie;
  const [ano, valor] = Object.entries(serie)[0];
  return { populacao: Number(valor), ano: Number(ano), url: "https://sidra.ibge.gov.br/tabela/6579" };
}

/** Banco Mundial — abertura comercial e tarifa média de importação. */
async function fonteBancoMundial() {
  const paises = "BRA;WLD;ARG;CHL;MEX;CHN;IND;ZAF;USA;EUU;JPN";
  const ind = {
    abertura: "NE.TRD.GNFS.ZS",
    tarifaMedia: "TM.TAX.MRCH.SM.AR.ZS",
  };
  const out = {};
  for (const [chave, cod] of Object.entries(ind)) {
    const { corpo } = await http(`https://api.worldbank.org/v2/country/${paises}/indicator/${cod}?format=json&mrnev=1&per_page=100`, { headers: { "user-agent": UA_NAVEGADOR, accept: "application/json" } });
    out[chave] = {
      indicador: cod,
      url: `https://data.worldbank.org/indicator/${cod}`,
      valores: (corpo[1] || []).filter((x) => x.value != null).map((x) => ({ pais: x.countryiso3code, nome: x.country.value, ano: Number(x.date), valor: r2(x.value) })),
    };
  }
  return out;
}

/** Portal da Transparência — emendas parlamentares do ano (exige chave gratuita). */
async function fonteEmendas() {
  const chave = process.env.PORTAL_TRANSPARENCIA_API_KEY;
  if (!chave) return { status: "sem-chave" };
  const maxPaginas = Number(process.env.EMENDAS_MAX_PAGINAS || 2500);
  let empenhado = 0, pago = 0, n = 0;
  const porTipo = {};
  for (let p = 1; p <= maxPaginas; p++) {
    const { corpo } = await http(`https://api.portaldatransparencia.gov.br/api-de-dados/emendas?ano=${ANO}&pagina=${p}`, { headers: { "chave-api-dados": chave } });
    if (!Array.isArray(corpo) || !corpo.length) break;
    for (const e of corpo) {
      const emp = numBR(e.valorEmpenhado), pg = numBR(e.valorPago);
      empenhado += emp; pago += pg; n++;
      const t = e.tipoEmenda || "Outras";
      porTipo[t] ||= { empenhado: 0, pago: 0 };
      porTipo[t].empenhado += emp; porTipo[t].pago += pg;
    }
    await sleep(800); // limite da API: 90 req/min
  }
  return {
    ano: ANO, emendas: n, empenhado: Math.round(empenhado), pago: Math.round(pago),
    porTipo: Object.entries(porTipo).map(([nome, v]) => ({ nome, empenhado: Math.round(v.empenhado), pago: Math.round(v.pago) })).sort((a, b) => b.empenhado - a.empenhado),
    url: "https://portaldatransparencia.gov.br/emendas",
  };
}

/* ---------------- orquestração ---------------- */
const FONTES = {
  bcb: { nome: "Banco Central (SGS)", fn: fonteBCB },
  camara: { nome: "Câmara dos Deputados (cota parlamentar)", fn: fonteCamara },
  senado: { nome: "Senado Federal (dados abertos administrativos)", fn: fonteSenado },
  ibge: { nome: "IBGE (população)", fn: fonteIBGE },
  bancoMundial: { nome: "Banco Mundial", fn: fonteBancoMundial },
  emendas: { nome: "Portal da Transparência (emendas)", fn: fonteEmendas },
};

async function main() {
  let anterior = {};
  try { anterior = JSON.parse(await readFile(SAIDA, "utf8")); } catch { /* primeira execução */ }
  const resultado = { geradoEm: AGORA.toISOString(), fontes: {}, dados: { ...(anterior.dados || {}) } };

  for (const [chave, f] of Object.entries(FONTES)) {
    if (SO && !SO.has(chave)) { resultado.fontes[chave] = anterior.fontes?.[chave] || { nome: f.nome, status: "nao-coletado" }; continue; }
    const t0 = Date.now();
    try {
      const dados = await f.fn();
      if (dados?.status === "sem-chave") {
        resultado.fontes[chave] = { nome: f.nome, status: "sem-chave", verificadoEm: AGORA.toISOString() };
        continue;
      }
      resultado.dados[chave] = dados;
      resultado.fontes[chave] = { nome: f.nome, status: "ok", coletadoEm: new Date().toISOString(), duracaoMs: Date.now() - t0 };
      console.log(`✔ ${f.nome} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (e) {
      const prev = anterior.fontes?.[chave];
      resultado.fontes[chave] = { nome: f.nome, status: "erro", erro: String(e?.message || e).slice(0, 300), tentadoEm: AGORA.toISOString(), ...(prev?.coletadoEm ? { coletadoEm: prev.coletadoEm } : {}) };
      console.error(`✖ ${f.nome}: ${e?.message || e}`);
    }
  }

  // Indicadores derivados
  const d = resultado.dados;
  const pop = d.ibge?.populacao;
  if (pop && d.bcb?.dividaBrutaR) d.derivados = { ...(d.derivados || {}), dividaPorHabitante: Math.round((d.bcb.dividaBrutaR.ultimo.valor * 1e6) / pop) };
  if (d.bcb?.juros12mR) d.derivados = { ...(d.derivados || {}), jurosPorSegundo: Math.round((d.bcb.juros12mR.ultimo.valor * 1e6) / (365 * 24 * 3600)) };

  await mkdir(dirname(SAIDA), { recursive: true });
  await writeFile(SAIDA, JSON.stringify(resultado, null, 1));
  const falhas = Object.values(resultado.fontes).filter((f) => f.status === "erro").length;
  console.log(`Gravado ${SAIDA} — ${Object.keys(FONTES).length - falhas} fontes ok, ${falhas} com erro.`);
  // Só falha o job se TODAS as fontes falharem (evita publicar arquivo vazio).
  if (falhas === Object.keys(FONTES).length) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
