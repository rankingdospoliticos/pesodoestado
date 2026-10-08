import { useEffect, useRef } from "react";
import { usePainelDados, type Painel } from "@/lib/painel/dados";
import { fmt, mesAno, reais } from "@/lib/painel/formatos";
import { judiciario, emendas } from "@/data/curados";
import { TooltipProvider } from "./graficos";
import { LogoRanking } from "./LogoRanking";
import { Resumo, Liberdade, Estados, Contas, Impostos, Mundo, Burocracia, serie } from "./secoes-economia";
import { Industria, ZonaFranca, Logistica, Retorno, Funcionalismo, Salarios } from "./secoes-sociedade";
import { Judiciario, Congresso, CamaraSenado, Fontes } from "./secoes-poderes";

const SEG_ANO = 365.25 * 24 * 3600;

const NAV: [string, string][] = [
  ["resumo", "Resumo"], ["ao-vivo", "Câmara e Senado ao vivo"], ["liberdade", "Liberdade econômica"], ["estados", "Estados e LLE"],
  ["contas", "Contas públicas"], ["impostos", "Impostos"], ["mundo", "Brasil × mundo"], ["burocracia", "Burocracia"],
  ["protecionismo", "Indústria"], ["zfm", "Zona Franca"], ["logistica", "Logística"], ["retorno", "O que volta"],
  ["funcionalismo", "Funcionalismo"], ["salarios", "Salários"], ["judiciario", "Judiciário"], ["congresso", "Congresso e emendas"], ["fontes", "Fontes"],
];

/** Contadores que sobem desde que a página foi aberta. Escreve direto no DOM para não re-renderizar a página a cada quadro. */
function Tickers({ p }: { p: Painel }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const jurR = serie(p, "juros12mR");
  const jurosSeg = p.dados.derivados?.jurosPorSegundo ?? (jurR ? (jurR.ultimo.valor * 1e6) / SEG_ANO : 37486);
  const taxas = [jurosSeg, (judiciario.total * 1e9) / SEG_ANO, (emendas.serie.at(-1)!.v * 1e9) / SEG_ANO];

  useEffect(() => {
    const t0 = performance.now();
    const pinta = () => {
      const s = (performance.now() - t0) / 1000;
      taxas.forEach((t, i) => {
        const el = refs.current[i];
        if (el) el.textContent = `R$ ${fmt(Math.floor(t * s))}`;
      });
    };
    const reduzido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) {
      const id = window.setInterval(pinta, 1000);
      return () => window.clearInterval(id);
    }
    let raf = 0;
    const loop = () => { pinta(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jurosSeg]);

  const baseJuros = jurR ? `base: ${reais(jurR.ultimo.valor * 1e6, 2)} em 12 meses (BC, ${mesAno(jurR.ultimo.data)})` : "base: juros nominais em 12 meses (Banco Central)";
  const itens = [
    { l: "Juros da dívida pública acumulados desde que você abriu esta página", r: baseJuros },
    { l: "Gasto do Poder Judiciário no mesmo intervalo", r: `base: R$ ${fmt(judiciario.total, 1)} bi em 2025 (CNJ)` },
    { l: "Emendas parlamentares previstas no mesmo intervalo", r: `base: R$ ${fmt(emendas.serie.at(-1)!.v, 1)} bi na LOA 2026` },
  ];
  return (
    <div className="tickers" aria-label="Contadores desde que a página foi aberta">
      {itens.map((it, i) => (
        <div className="ticker" key={it.l}>
          <div className="l">{it.l}</div>
          <div className="v" ref={(el) => { refs.current[i] = el; }}>R$ 0</div>
          <div className="r">{it.r}</div>
        </div>
      ))}
    </div>
  );
}

export function PesoDoEstado() {
  const { painel: p, origem } = usePainelDados();
  const atualizado = new Date(p.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", "");

  return (
    <TooltipProvider>
      <div className="painel">
        <header className="band">
          <div className="wrap">
            <div className="eyebrow">
              <a href="https://ranking.org.br/" target="_blank" rel="noopener noreferrer" aria-label="Ranking dos Políticos"><LogoRanking /></a>
              <span>Painel de dados · O Peso do Estado</span>
            </div>
            <h1>Quanto <b>pesa</b> o <em>Estado brasileiro</em></h1>
            <p className="lede">
              Liberdade econômica no país e nos estados, contas públicas, impostos, comparações internacionais, burocracia, o que volta em serviços,
              funcionalismo, salários, Judiciário, Congresso e emendas parlamentares. Os números do Banco Central, IBGE, Câmara, Senado e Banco Mundial
              são coletados automaticamente das APIs oficiais.
            </p>
            <div className="stamp">Dados automáticos coletados em {atualizado} · cada número traz sua data-base</div>
            <Tickers p={p} />
          </div>
        </header>

        <nav className="chips" aria-label="Seções">
          <div className="wrap">
            {NAV.map(([id, rotulo]) => <a key={id} href={`#${id}`}>{rotulo}</a>)}
          </div>
        </nav>

        <main>
          <div className="wrap">
            <Resumo p={p} />
            <CamaraSenado p={p} />
            <Liberdade />
            <Estados />
            <Contas p={p} />
            <Impostos />
            <Mundo p={p} />
            <Burocracia />
            <Industria p={p} />
            <ZonaFranca />
            <Logistica />
            <Retorno />
            <Funcionalismo p={p} />
            <Salarios />
            <Judiciario />
            <Congresso p={p} />
            <Fontes p={p} origem={origem} />
          </div>
        </main>

        <footer>
          <div className="wrap">
            <a href="https://ranking.org.br/" target="_blank" rel="noopener noreferrer" aria-label="Ranking dos Políticos"><LogoRanking /></a>
            <span>
              Painel do Ranking dos Políticos a partir de fontes públicas. Valores nominais, sem correção pela inflação, salvo indicação.{" "}
              <a href="https://ranking.org.br/" target="_blank" rel="noopener noreferrer">ranking.org.br</a>
            </span>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
