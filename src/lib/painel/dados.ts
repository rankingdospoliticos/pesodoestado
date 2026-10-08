import { useEffect, useState } from "react";
import snapshot from "@/data/painel.json";

/**
 * Dados do painel.
 *
 * O robô do GitHub Actions (scripts/coletar-dados.mjs) grava um JSON no branch
 * "dados" do repositório. O site carrega esse arquivo direto do GitHub, então os
 * números se atualizam sem precisar publicar o site de novo.
 *
 * Ordem de tentativa:
 *  1. VITE_DADOS_URL (se definido no ambiente de build)
 *  2. branch "dados" no GitHub (raw.githubusercontent.com)
 * Enquanto carrega (e se tudo falhar), usa a cópia embutida no build
 * (src/data/painel.json), que o site já entrega pronta no HTML.
 */

export type Ponto = { data: string; valor: number };
export type SerieBCB = { cod: number; nome: string; unidade: string; ultimo: Ponto; historico?: Ponto[]; url: string };
export type ItemValor = { nome: string; valor: number };
export type Parlamentar = { id: number; nome: string; partido: string; uf: string; valor: number };
export type MesValor = { mes: number; valor: number };

export type DadosCamara = {
  ano: number; total: number; lancamentos: number; deputadosComGasto: number; mediaPorDeputado: number;
  ultimaDataDocumento: string; arquivoAtualizadoEm?: string | null; porMes: MesValor[]; porCategoria: ItemValor[];
  porPartido: ItemValor[]; porUF: ItemValor[]; porFornecedor: ItemValor[]; maioresGastos: Parlamentar[]; url: string;
};
export type DadosSenado = {
  url: string;
  ceaps: { ano: number; total: number; lancamentos: number; senadoresComGasto: number; mediaPorSenador: number; ultimaDataDocumento: string; porMes: MesValor[]; porTipo: ItemValor[]; porPartido: ItemValor[]; maioresGastos: Parlamentar[] };
  folha?: { ano: number; mes: number; registros: number; bruto: number; liquido: number; abateTeto: number; contrachequesComAbateTeto: number };
  pessoal?: { ativos: number; porVinculo: Record<string, number> };
  terceirizados?: number;
  moradia?: { imovelFuncional: number; auxilioMoradia: number; senadores: number };
};
export type ValorPais = { pais: string; nome: string; ano: number; valor: number };
export type DadosEmendas = { ano: number; emendas: number; empenhado: number; pago: number; porTipo: { nome: string; empenhado: number; pago: number }[]; url: string };
export type StatusFonte = { nome: string; status: "ok" | "erro" | "sem-chave" | "nao-coletado"; coletadoEm?: string; tentadoEm?: string; erro?: string; observacao?: string };

export type Painel = {
  geradoEm: string;
  fontes: Record<string, StatusFonte>;
  dados: {
    bcb?: Record<string, SerieBCB>;
    camara?: DadosCamara;
    senado?: DadosSenado;
    ibge?: { populacao: number; ano: number; url: string };
    bancoMundial?: { abertura?: { valores: ValorPais[]; url: string }; tarifaMedia?: { valores: ValorPais[]; url: string } };
    emendas?: DadosEmendas;
    derivados?: { dividaPorHabitante?: number; jurosPorSegundo?: number };
  };
};

export const DADOS_EMBUTIDOS = snapshot as unknown as Painel;

const REPO_RAW = "https://raw.githubusercontent.com/rankingdospoliticos/pesodoestado/dados/painel.json";

function urlsDeDados(): string[] {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  const custom = env?.["VITE_DADOS_URL"];
  const lista = [custom, REPO_RAW].filter((u): u is string => Boolean(u));
  return Array.from(new Set(lista));
}

async function buscar(url: string): Promise<Painel> {
  const bust = Math.floor(Date.now() / 600_000); // muda a cada 10 min (evita cache velho)
  const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${bust}`, { cache: "no-cache" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as Painel;
  if (!j?.dados) throw new Error("formato inválido");
  return j;
}

export type EstadoDados = { painel: Painel; origem: "embutido" | "remoto"; url?: string };

/** Carrega a versão mais recente dos dados; começa com a cópia embutida. */
export function usePainelDados(): EstadoDados {
  const [estado, setEstado] = useState<EstadoDados>({ painel: DADOS_EMBUTIDOS, origem: "embutido" });
  useEffect(() => {
    let vivo = true;
    (async () => {
      for (const url of urlsDeDados()) {
        try {
          const p = await buscar(url);
          // Só troca se o arquivo remoto for mais novo que o embutido.
          if (vivo && p.geradoEm >= DADOS_EMBUTIDOS.geradoEm) setEstado({ painel: p, origem: "remoto", url });
          return;
        } catch {
          /* tenta a próxima */
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}
