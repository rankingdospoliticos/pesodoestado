/**
 * Equivalências do mundo real: "esse dinheiro daria para..."
 *
 * Cada unidade tem custo, fonte e data. Os valores são deliberadamente
 * conservadores (teto do programa, custo médio publicado), então a quantidade
 * calculada tende a ser a MENOR possível. Para atualizar, troque o custo e a fonte.
 */
export type Unidade = "casa" | "creche" | "ubs" | "icesp" | "professor" | "bolsa" | "onibus" | "salario" | "cesta";

export type DefUnidade = {
  custo: number; // R$ por unidade
  singular: string;
  plural: string;
  curto: string; // rótulo curto para cartões
  fonte: string;
  url: string;
};

export const UNIDADES: Record<Unidade, DefUnidade> = {
  casa: {
    custo: 170_000,
    singular: "casa popular",
    plural: "casas populares",
    curto: "casas populares",
    fonte: "Minha Casa, Minha Vida: teto por moradia do MCMV-FAR 2025 (R$ 170 mil), Portaria MCid 488/2025",
    url: "https://www.gov.br/cidades/pt-br/assuntos/minha-casa-minha-vida-selecoes/mcmv-far-1",
  },
  creche: {
    custo: 3_500_000,
    singular: "creche ou escola nova",
    plural: "creches ou escolas novas",
    curto: "creches e escolas",
    fonte: "Novo PAC Seleções 2025: R$ 1,77 bi para 505 creches e escolas (≈ R$ 3,5 mi cada)",
    url: "https://www.oliberal.com/belem/para-tera-40-novas-creches-e-mais-de-80-novos-onibus-escolares-por-meio-do-novo-pac-1.1003480",
  },
  ubs: {
    custo: 2_330_000,
    singular: "posto de saúde (UBS) novo",
    plural: "postos de saúde (UBS) novos",
    curto: "postos de saúde",
    fonte: "Novo PAC Saúde: R$ 4,2 bi para 1.800 UBS (≈ R$ 2,33 mi cada)",
    url: "https://www.poder360.com.br/saude/1a-etapa-do-novo-pac-saude-vai-construir-1-800-unidades-basicas/",
  },
  icesp: {
    custo: 802_738_000,
    singular: "ano de funcionamento do Icesp (hospital do câncer de SP)",
    plural: "anos de funcionamento do Icesp (hospital do câncer de SP)",
    curto: "anos de um hospital do câncer",
    fonte: "ICESP, despesas operacionais de 2024: R$ 802,7 mi (balanço, DOESP 24/04/2025)",
    url: "https://ffm.br/ffm/conteudo/impressos/1805-DOESP_24.04.2025_PGS_9,10e11_ICESP.pdf",
  },
  professor: {
    custo: 5130.63 * (13 + 1 / 3),
    singular: "professor pago pelo piso durante um ano",
    plural: "professores pagos pelo piso durante um ano",
    curto: "professores por um ano",
    fonte: "Piso do magistério 2026: R$ 5.130,63, com 13º e 1/3 de férias, sem encargos",
    url: "https://www.gov.br/servidor/pt-br/canais_atendimento/central-sipec/comunicas-1/fevereiro-2026/comunicado-566366-folha-de-pagamento-atualizacao-piso-magisterio-2026.pdf",
  },
  bolsa: {
    custo: 690.01 * 12,
    singular: "família no Bolsa Família por um ano",
    plural: "famílias no Bolsa Família por um ano",
    curto: "famílias no Bolsa Família (1 ano)",
    fonte: "Benefício médio do Bolsa Família: R$ 690,01 por mês (MDS, fev/2026)",
    url: "https://www.poder360.com.br/poder-governo/bolsa-familia-volta-a-crescer-em-2026-depois-de-queda-em-2025/",
  },
  onibus: {
    custo: 500_000,
    singular: "ônibus escolar",
    plural: "ônibus escolares",
    curto: "ônibus escolares",
    fonte: "Novo PAC 2025: R$ 500 mi para 1.000 ônibus escolares",
    url: "https://www.oliberal.com/belem/para-tera-40-novas-creches-e-mais-de-80-novos-onibus-escolares-por-meio-do-novo-pac-1.1003480",
  },
  salario: {
    custo: 1621,
    singular: "salário mínimo",
    plural: "salários mínimos",
    curto: "salários mínimos",
    fonte: "Salário mínimo de 2026: R$ 1.621 (Decreto 12.797/2025)",
    url: "https://www2.camara.leg.br/legin/fed/decret/2025/decreto-12797-23-dezembro-2025-798569-publicacaooriginal-177587-pe.html",
  },
  cesta: {
    custo: 965.47,
    singular: "cesta básica",
    plural: "cestas básicas",
    curto: "cestas básicas",
    fonte: "Cesta básica em São Paulo: R$ 965,47 (Dieese, jun/2026)",
    url: "https://monitordomercado.com.br/economia-2/414607-quanto-custa-alimentar-1-adulto-em-2026-so-a-cesta-basica-passa-de-r-960-em-sao-paulo/",
  },
};

/** Ordem de preferência: o que o leitor visualiza mais fácil vem primeiro. */
export const ORDEM: Unidade[] = ["casa", "icesp", "creche", "ubs", "professor", "bolsa", "onibus", "salario", "cesta"];

export const quantos = (valor: number, u: Unidade) => valor / UNIDADES[u].custo;

/** Formata uma quantidade de forma legível: 3,4 · 812 · 18.240 · 6,95 milhões. */
export function qtd(n: number): string {
  const a = Math.abs(n);
  const f = (x: number, d: number) => x.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
  if (a >= 1e9) return `${f(n / 1e9, a >= 1e10 ? 1 : 2)} bilhões`;
  if (a >= 1e6) return `${f(n / 1e6, a >= 1e7 ? 1 : 2)} ${a >= 2e6 ? "milhões" : "milhão"}`;
  if (a >= 10) return f(Math.round(n), 0);
  return f(n, 1).replace(",0", "");
}

/**
 * Escolhe as unidades mais "palpáveis" para um valor: a primeira da ordem de
 * preferência cuja quantidade fique entre 10 e 1 bilhão.
 */
export function melhores(valor: number, n = 2, preferidas: Unidade[] = ORDEM): Unidade[] {
  const ok = preferidas.filter((u) => {
    const q = quantos(valor, u);
    return q >= 10 && q <= 1e9;
  });
  return (ok.length ? ok : preferidas.slice(-1)).slice(0, n);
}

export const frase = (valor: number, u: Unidade) => {
  const q = quantos(valor, u);
  const d = UNIDADES[u];
  return `${qtd(q)} ${q >= 0.95 && q < 1.05 ? d.singular : d.plural}`;
};
