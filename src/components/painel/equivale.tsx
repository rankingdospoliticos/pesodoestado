import { frase, melhores, UNIDADES, type Unidade } from "@/lib/painel/equivalencias";
import { Icone } from "./icones";

/**
 * Linha "Dá para..." que traduz um valor em reais em coisas do mundo real.
 * Escolhe sozinha as unidades mais palpáveis para o tamanho do valor, ou usa as
 * indicadas em `un`.
 */
export function Equivale({ valor, un, n = 2, prefixo = "Dá para pagar" }: { valor: number; un?: Unidade[]; n?: number; prefixo?: string }) {
  if (!(valor > 0)) return null;
  const us = melhores(valor, n, un);
  const [u1, u2] = us;
  if (!u1) return null;
  const fontes = us.map((u) => UNIDADES[u].fonte).join(" · ");
  return (
    <p className="eq" title={`Custos usados: ${fontes}`}>
      <Icone u={u1} tamanho={18} className="eq-ic" />
      <span>
        {prefixo} <b>{frase(valor, u1)}</b>
        {u2 ? <> ou <b>{frase(valor, u2)}</b></> : null}
        <a href="#traduzindo" className="eq-link" aria-label="Como calculamos">?</a>
      </span>
    </p>
  );
}
