/**
 * Dados curados: indicadores que NÃO têm API pública (relatórios anuais, rankings
 * internacionais, estudos). Cada bloco traz fonte e data. Para atualizar, edite os
 * valores aqui e faça commit; o restante do painel se ajusta sozinho.
 *
 * Os indicadores com API (Banco Central, Câmara, Senado, IBGE, Banco Mundial e
 * Portal da Transparência) vêm do branch "dados" (atualizado pelo robô); a cópia embutida fica em src/data/painel.json.
 */

export const ATUALIZADO_EM = "2026-10-08";

/* ---------- Liberdade econômica ---------- */
export const heritage = {
  fonte: "Heritage Foundation, Index of Economic Freedom 2026",
  url: "https://static.heritage.org/index/pdf/2026/2026_indexofeconomicfreedom_brazil.pdf",
  nota: 52.4, posicao: 134, de: 176, americas: 28, deAmericas: 32, mediaMundial: 59.9,
  historico: [
    { ano: 2021, nota: 53.4 }, { ano: 2022, nota: 53.3 }, { ano: 2023, nota: 53.5 },
    { ano: 2024, nota: 53.2, posicao: 124 }, { ano: 2025, nota: 55.1, posicao: 117 }, { ano: 2026, nota: 52.4, posicao: 134 },
  ],
  componentes: [
    { k: "Liberdade monetária", v: 76 }, { k: "Comércio exterior", v: 69 }, { k: "Liberdade empresarial", v: 66 },
    { k: "Liberdade trabalhista", v: 57 }, { k: "Direito de propriedade", v: 49 }, { k: "Liberdade de investimento", v: 40 },
    { k: "Liberdade financeira", v: 40 }, { k: "Integridade do governo", v: 37 }, { k: "Carga tributária", v: 28 },
  ],
  comparacao: [
    { k: "Singapura (1º)", v: 84.4 }, { k: "Portugal (27º)", v: 71.2 }, { k: "Média mundial", v: 59.9 },
    { k: "Argentina (55º)", v: 57.4 }, { k: "Brasil (134º)", v: 52.4, brasil: true }, { k: "Venezuela (174º)", v: 27.3 }, { k: "Cuba (175º)", v: 25.2 },
  ],
};
export const fraser = { posicao: 85, posicaoAnterior: 87, relatorio: 2026, dadosDe: 2024, url: "https://www.fraserinstitute.org/studies/economic-freedom" };

/* ---------- Estados ---------- */
export const UF_GRADE: Record<string, { n: string; r: number; c: number }> = {
  RR: { n: "Roraima", r: 0, c: 1 }, AP: { n: "Amapá", r: 0, c: 3 },
  AM: { n: "Amazonas", r: 1, c: 1 }, PA: { n: "Pará", r: 1, c: 2 }, MA: { n: "Maranhão", r: 1, c: 3 }, CE: { n: "Ceará", r: 1, c: 4 }, RN: { n: "Rio Grande do Norte", r: 1, c: 5 },
  AC: { n: "Acre", r: 2, c: 0 }, RO: { n: "Rondônia", r: 2, c: 1 }, TO: { n: "Tocantins", r: 2, c: 2 }, PI: { n: "Piauí", r: 2, c: 3 }, PE: { n: "Pernambuco", r: 2, c: 4 }, PB: { n: "Paraíba", r: 2, c: 5 },
  MT: { n: "Mato Grosso", r: 3, c: 1 }, GO: { n: "Goiás", r: 3, c: 2 }, BA: { n: "Bahia", r: 3, c: 3 }, SE: { n: "Sergipe", r: 3, c: 4 }, AL: { n: "Alagoas", r: 3, c: 5 },
  MS: { n: "Mato Grosso do Sul", r: 4, c: 1 }, DF: { n: "Distrito Federal", r: 4, c: 2 }, MG: { n: "Minas Gerais", r: 4, c: 3 }, ES: { n: "Espírito Santo", r: 4, c: 4 },
  SP: { n: "São Paulo", r: 5, c: 2 }, RJ: { n: "Rio de Janeiro", r: 5, c: 3 },
  PR: { n: "Paraná", r: 6, c: 2 }, SC: { n: "Santa Catarina", r: 7, c: 2 }, RS: { n: "Rio Grande do Sul", r: 8, c: 2 },
};
/** Índice Mackenzie de Liberdade Econômica Estadual 2025 (dados de 2023). DF não avaliado. */
export const imlee: Record<string, number> = { SP: 6.26, GO: 6.12, ES: 6.09, RJ: 6.05, PB: 5.66, AP: 5.55, MG: 5.44, PA: 5.44, PR: 5.35, MA: 5.3, RS: 5.27, SC: 5.25, BA: 5.15, RN: 5.05, PI: 5.01, MS: 5.0, CE: 5.0, PE: 4.88, SE: 4.61, AL: 4.56, RO: 4.53, AM: 4.37, MT: 4.35, AC: 4.21, RR: 4.11, TO: 3.96 };
/** Atividades dispensadas de alvará pela norma estadual (ILISP, jul/2026). "lei" = lei sem lista; "sem" = sem lei. */
export const cnaeEstadual: Record<string, number | "lei" | "sem"> = { PR: 975, GO: 960, MG: 945, SE: 936, SP: 927, PI: 908, SC: 896, PE: 846, RS: 770, ES: 620, MS: 612, MA: 572, RJ: 532, AC: 298, AL: 298, MT: 290, DF: 287, PA: 264, RN: "lei", RO: "lei", AP: "lei", RR: "lei", BA: "sem", AM: "sem", CE: "sem", PB: "sem", TO: "sem" };
/** % de municípios com lei de liberdade econômica (ILISP, jul/2026; RS = 261/497). */
export const municipiosLLE: Record<string, number> = { SP: 100, ES: 93.6, SC: 85.1, MG: 71.8, RS: 52.5, MS: 51.9, AL: 27.5, CE: 26.1, AP: 25, MT: 23.2, BA: 20.6, RR: 20, MA: 18.4, RO: 17.3, PE: 16.8, PA: 16, PI: 14.3, AC: 13.6, PB: 12.6, SE: 10.7, GO: 9.8, RN: 7.8, TO: 5.8, AM: 3.2 };
/** Cadeiras de deputado federal por UF (513 no total, legislatura 2023–2027). */
export const cadeirasCamara: Record<string, number> = { SP: 70, MG: 53, RJ: 46, BA: 39, RS: 31, PR: 30, PE: 25, CE: 22, MA: 18, GO: 17, PA: 17, SC: 16, PB: 12, ES: 10, PI: 10, AL: 9, AC: 8, AM: 8, AP: 8, DF: 8, MS: 8, MT: 8, RN: 8, RO: 8, RR: 8, SE: 8, TO: 8 };
export const regiaoUF: Record<string, string> = { AC: "Norte", AM: "Norte", AP: "Norte", PA: "Norte", RO: "Norte", RR: "Norte", TO: "Norte", AL: "Nordeste", BA: "Nordeste", CE: "Nordeste", MA: "Nordeste", PB: "Nordeste", PE: "Nordeste", PI: "Nordeste", RN: "Nordeste", SE: "Nordeste", DF: "Centro-Oeste", GO: "Centro-Oeste", MS: "Centro-Oeste", MT: "Centro-Oeste", ES: "Sudeste", MG: "Sudeste", RJ: "Sudeste", SP: "Sudeste", PR: "Sul", RS: "Sul", SC: "Sul" };
export const lleNacional = { municipios: 2551, total: 5570, pct: 45.8, data: "2026-10-07", url: "https://liberdadeparatrabalhar.com.br/" };

/* ---------- Contas e impostos ---------- */
export const primario2025 = { tesouroBC: 255.5, rgps: -317.2, total: -61.7, paraMeta: -13, excluido: 48.7 };
export const loa2026 = [
  { k: "Refinanciamento da dívida", v: 1820, lab: "R$ 1,82 tri" }, { k: "Previdência", v: 1146, lab: "R$ 1,15 tri" },
  { k: "Desenvolvimento Social", v: 302.8, lab: "R$ 302,8 bi" }, { k: "Saúde", v: 271.3, lab: "R$ 271,3 bi" },
  { k: "Educação", v: 233.7, lab: "R$ 233,7 bi" }, { k: "Bolsa Família", v: 158.6, lab: "R$ 158,6 bi" },
  { k: "Investimentos", v: 79.8, lab: "R$ 79,8 bi" }, { k: "Emendas parlamentares", v: 61.4, lab: "R$ 61,4 bi", destaque: true },
  { k: "Fundo Eleitoral", v: 4.9, lab: "R$ 4,9 bi", destaque: true },
];
export const carga = { total: 32.4, anterior: 32.22, uniao: 21.6, estados: 8.38, municipios: 2.43, renda: 9.16, icms: 6.74, iss: 1.21, ano: 2025 };
export const ibpt = { dias: 150, pctRenda: 41.1, pctFaixaMedia: 43.01, diasFaixaMedia: 157, dias1986: 82 };
export const gastosTributarios = { total: 620.8, pctPIB: 4.53, anterior: 543.6, itens: [
  { k: "Comércio e serviços", v: 137.9 }, { k: "Simples Nacional", v: 120.1 }, { k: "Agricultura", v: 101.3 },
  { k: "Assistência social", v: 41.1 }, { k: "Ciência e tecnologia", v: 18.7 }, { k: "Saúde", v: 11.4 }, { k: "Educação", v: 10.6 },
] };
export const despesaGovernoGeral = { despesa: 46.9, receita: 39.5, necessidade: 7.4, ano: 2025 };

/* ---------- Brasil × mundo ---------- */
export const horasImpostos = [
  { k: "Brasil", v: 1501, brasil: true }, { k: "BRICS (média)", v: 437.2 }, { k: "América Latina e Caribe", v: 325.3 }, { k: "OCDE alta renda", v: 155.7 },
];
export const cargaOCDE = [
  { k: "OCDE (média)", v: 34.0 }, { k: "Brasil", v: 33.7, brasil: true }, { k: "América Latina e Caribe", v: 21.7 }, { k: "Guiana (menor da região)", v: 9.2 },
];

/* ---------- Indústria, ZFM, logística ---------- */
export const subsidiosUniao = [
  { ano: "2015", v: 644 }, { ano: "2020", v: 458.2 }, { ano: "2021", v: 565.2 }, { ano: "2022", v: 672.3 }, { ano: "2023", v: 697.3 }, { ano: "2024", v: 678.4 },
];
export const zfm = { renunciaTotal: 32.7, renunciaPoloAlta: 9.9, renunciaPoloBaixa: 5.9, empregos: 131401, faturamento: 227.67, pctSalarios: 5 };
export const ferrovias = {
  densidade: [{ k: "Estados Unidos", v: 29.74 }, { k: "China", v: 14.73 }, { k: "Canadá", v: 7.8 }, { k: "Rússia", v: 5.03 }, { k: "Austrália", v: 4.34 }, { k: "Brasil", v: 3.62, brasil: true }],
  participacao: [{ k: "Rússia", v: 81 }, { k: "Austrália", v: 56 }, { k: "Japão", v: 40 }, { k: "Canadá", v: 34.1 }, { k: "Estados Unidos", v: 29.8 }, { k: "Brasil", v: 15.5, brasil: true }],
  extensao: [{ k: "Estados Unidos", v: 293.6 }, { k: "China", v: 131 }, { k: "Rússia", v: 87.2 }, { k: "Canadá", v: 77.9 }, { k: "Índia", v: 68.5 }, { k: "Argentina", v: 36.9 }, { k: "Alemanha", v: 33.6 }, { k: "Brasil", v: 30.8, brasil: true }, { k: "França", v: 29.6 }],
};
export const rodoviasDensidade = [{ k: "China", v: 447.0 }, { k: "Estados Unidos", v: 437.8 }, { k: "Índia", v: 94.6 }, { k: "Austrália", v: 55.2 }, { k: "Rússia", v: 54.3 }, { k: "Brasil", v: 25.1, brasil: true }];

/* ---------- O que volta ---------- */
export const pisa2025 = [{ k: "Matemática", brasil: 377, ocde: 469 }, { k: "Leitura", brasil: 408, ocde: 466 }, { k: "Ciências", brasil: 409, ocde: 486 }];
export const violenciaUF = [
  { k: "Amapá", v: 42.5, tipo: "alto" }, { k: "Bahia", v: 36.8, tipo: "alto" }, { k: "Ceará", v: 34.7, tipo: "alto" }, { k: "Brasil", v: 19.1, tipo: "brasil" },
  { k: "Distrito Federal", v: 9.6, tipo: "baixo" }, { k: "São Paulo", v: 7.8, tipo: "baixo" }, { k: "Santa Catarina", v: 7.6, tipo: "baixo" }, { k: "Média mundial (2021)", v: 5.8, tipo: "ref" },
];

/* ---------- Funcionalismo e salários ---------- */
export const executivoFederal = [
  { ano: 2022, v: 569217 }, { ano: 2023, v: 556134 }, { ano: 2024, v: 572990 }, { ano: 2025, v: 573485 }, { ano: 2026, v: 569230 },
];
export const salariosRAIS2019 = [
  { k: "Federal", valores: [9400, 9300, 15300] as (number | null)[] },
  { k: "Estadual", valores: [4800, 7700, 10200] as (number | null)[] },
  { k: "Municipal", valores: [2640, null, null] as (number | null)[], nota: "mediana 2023" },
];
export const acima15mil = [
  { k: "Judiciário federal", v: 48.77, p: 2 }, { k: "Legislativo federal", v: 21.35, p: 1 }, { k: "Executivo federal", v: 18.59, p: 0 },
  { k: "Judiciário estadual", v: 16.45, p: 2 }, { k: "Legislativo estadual", v: 15.75, p: 1 }, { k: "Executivo estadual", v: 3.36, p: 0 },
];
export const escadaSalarial = [
  { k: "Mediana do Executivo municipal", v: 2640, tipo: 2, nota: "Remuneração mediana, Ipea 2023" },
  { k: "Mediana de todo o setor público", v: 3281, tipo: -1, nota: "Remuneração mediana, Ipea 2023" },
  { k: "Trabalhador brasileiro (média)", v: 3484, tipo: -1, nota: "Rendimento médio habitual, PNAD Contínua 2025" },
  { k: "Inicial em concursos federais", v: 7654, tipo: 0, nota: "Salário inicial médio, Censo dos Concursos 2024" },
  { k: "Servidor de tribunal estadual (custo)", v: 21639, tipo: 2, nota: "Custo médio mensal, CNJ 2026 (ano 2025)" },
  { k: "Deputado federal (subsídio)", v: 46366, tipo: 1, nota: "Subsídio bruto 2026, sem verbas de gabinete" },
  { k: "Juiz estadual (remuneração)", v: 74000, tipo: 2, nota: "Média mensal recebida em 2025" },
  { k: "Juiz da Justiça Militar estadual", v: 98000, tipo: 2, nota: "Média mensal recebida em 2025" },
  { k: "Magistrado do TJ-RJ (custo)", v: 209583, tipo: 3, nota: "Maior custo médio mensal entre os TJs, 2025" },
];

/* ---------- Judiciário (CNJ, Justiça em Números 2026) ---------- */
export const judiciario = {
  total: 164.6, pctPIB: 1.3, pctGasto: 2.7, pessoal: 148.5, pctPessoal: 90.2, indenizatorias: "R$ 9,8 bi a R$ 10,8 bi",
  magistrados: 19094, servidores: 281252, arrecadacao: 68.2, pctArrecadacao: 41, pendentes: 75.5, novos: 40.9,
  serie: [{ ano: "2022", v: 115, lab: "≈115" }, { ano: "2023", v: 132.8 }, { ano: "2024", v: 152.8, nota: "revisado no JN 2026 (JN 2025: R$ 146,5 bi)" }, { ano: "2025", v: 164.6 }],
  pibComparado: [{ k: "Brasil", v: 1.3, brasil: true }, { k: "Países emergentes", v: 0.5 }, { k: "Países desenvolvidos", v: 0.3 }, { k: "Média internacional", v: 0.3 }],
  custoMagistrado: [
    { k: "TJ-RJ (2025)", v: 209583, alerta: true }, { k: "TJ-MS (2025)", v: 154153 }, { k: "Tribunais superiores (2024)", v: 101600 },
    { k: "Justiça Estadual (2024)", v: 92800 }, { k: "Justiça do Trabalho (2024)", v: 68700 }, { k: "TJ-GO, o menor (2025)", v: 60008 },
  ],
  url: "https://www.cnj.jus.br/pesquisas-judiciarias/justica-em-numeros/",
};

/* ---------- Congresso ---------- */
export const emendas = {
  serie: [{ ano: "2015", v: 9.6 }, { ano: "2020", v: 36.1 }, { ano: "2024", v: 49.1 }, { ano: "2025", v: 50.4 }, { ano: "2026", v: 61.4 }],
  tipos2026: { individuais: 26.6, bancada: 11.2, comissao: 12.1, outras: 11.5 },
  porDeputado: 39.9, porSenador: 72.8, fundoEleitoral: 4.9, controleParlamentar: 49.9,
};
export const camaraEstrutura = {
  verbaGabineteMensal: 151000, // por deputado, fev/2026
  subsidio: 46366.19,
  deputados: 513,
  deputados2027: 531,
} as const;
