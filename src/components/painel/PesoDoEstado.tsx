import { useEffect, useRef, useState } from "react";
import { usePainelDados, type Painel } from "@/lib/painel/dados";
import { fmt, mesAno, reais } from "@/lib/painel/formatos";
import { judiciario, emendas } from "@/data/curados";
import { TooltipProvider } from "./graficos";
import { LogoRanking } from "./LogoRanking";
import { Parte } from "./ui";
import { Conta, Traduzindo, Orcamento, Fecho, arrecadacao } from "./secoes-abertura";
import { Contas, Burocracia, Liberdade, Estados, serie } from "./secoes-economia";
import { Funcionalismo, Salarios, Industria, ZonaFranca, Logistica, Retorno } from "./secoes-sociedade";
import { Judiciario, Congresso, CamaraSenado, Fontes } from "./secoes-poderes";

const SEG_ANO = 365.25 * 24 * 3600;

/** Capítulos na ordem da narrativa: [id, rótulo curto]. */
const NAV: [string, string][] = [
  ["conta", "1 · A conta"], ["traduzindo", "2 · Em coisas concretas"], ["orcamento", "3 · Para onde vai"], ["contas", "4 · O rombo"],
  ["funcionalismo", "5 · Servidores"], ["salarios", "6 · Salários"], ["judiciario", "7 · Judiciário"], ["congresso", "8 · Congresso"], ["ao-vivo", "9 · Câmara e Senado ao vivo"],
  ["protecionismo", "10 · Subsídios"], ["zfm", "11 · Zona Franca"], ["burocracia", "12 · Burocracia"], ["logistica", "13 · Logística"],
  ["liberdade", "14 · Liberdade econômica"], ["estados", "15 · Estados"], ["retorno", "16 · O que volta"], ["resumo", "Em uma tela"], ["fontes", "Fontes"],
];

/** Contadores que sobem desde que a página foi aberta. Escreve direto no DOM para não re-renderizar a página a cada quadro. */
function Tickers({ p }: { p: Painel }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const jurR = serie(p, "juros12mR");
  const arrec = arrecadacao(p);
  const jurosSeg = p.dados.derivados?.jurosPorSegundo ?? (jurR ? (jurR.ultimo.valor * 1e6) / SEG_ANO : 37486);
  const taxas = [arrec.total / SEG_ANO, jurosSeg, (judiciario.total * 1e9) / SEG_ANO, ((emendas.serie.at(-1)?.v ?? 61.4) * 1e9) / SEG_ANO];

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
  }, [jurosSeg, arrec.total]);

  const itens = [
    { l: "Tributos pagos pelos brasileiros desde que você abriu esta página", r: `base: ${reais(arrec.total, 2)} em 12 meses (estimativa)`, destaque: true },
    { l: "Juros da dívida pública no mesmo intervalo", r: jurR ? `base: ${reais(jurR.ultimo.valor * 1e6, 2)} em 12 meses (BC, ${mesAno(jurR.ultimo.data)})` : "base: juros nominais em 12 meses (Banco Central)" },
    { l: "Gasto do Poder Judiciário", r: `base: R$ ${fmt(judiciario.total, 1)} bi em 2025 (CNJ)` },
    { l: "Emendas parlamentares", r: `base: R$ ${fmt(emendas.serie.at(-1)?.v ?? 61.4, 1)} bi na LOA 2026` },
  ];
  return (
    <div className="tickers" aria-label="Contadores desde que a página foi aberta">
      {itens.map((it, i) => (
        <div className={`ticker${it.destaque ? " principal" : ""}`} key={it.l}>
          <div className="l">{it.l}</div>
          <div className="v" ref={(el) => { refs.current[i] = el; }}>R$ 0</div>
          <div className="r">{it.r}</div>
        </div>
      ))}
    </div>
  );
}

/** Menu de capítulos que acompanha a leitura. */
function Navegacao() {
  const [ativo, setAtivo] = useState<string>("");
  const [prog, setProg] = useState(0);
  const navRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const secoes = NAV.map(([id]) => document.getElementById(id)).filter((x): x is HTMLElement => Boolean(x));
    const io = new IntersectionObserver(
      (ents) => {
        const vis = ents.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setAtivo(vis[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    secoes.forEach((s) => io.observe(s));
    const rolar = () => {
      const h = document.documentElement;
      setProg(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)));
    };
    window.addEventListener("scroll", rolar, { passive: true });
    rolar();
    return () => { io.disconnect(); window.removeEventListener("scroll", rolar); };
  }, []);
  useEffect(() => {
    const el = navRef.current?.querySelector<HTMLAnchorElement>(`a[href="#${ativo}"]`);
    const caixa = navRef.current;
    if (el && caixa) caixa.scrollTo({ left: el.offsetLeft - caixa.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [ativo]);
  return (
    <nav className="chips" aria-label="Capítulos">
      <div className="wrap" ref={navRef}>
        {NAV.map(([id, rotulo]) => <a key={id} href={`#${id}`} aria-current={ativo === id ? "true" : undefined}>{rotulo}</a>)}
      </div>
      <i className="progresso" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
    </nav>
  );
}

export function PesoDoEstado() {
  const { painel: p, origem } = usePainelDados();
  const atualizado = new Date(p.geradoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(".", "");

  return (
    <div className="painel">
      <TooltipProvider>
        <header className="band">
          <div className="wrap">
            <div className="eyebrow">
              <a href="https://ranking.org.br/" target="_blank" rel="noopener noreferrer" aria-label="Ranking dos Políticos"><LogoRanking /></a>
              <span>Painel de dados · O Peso do Estado</span>
            </div>
            <h1>Quanto <b>pesa</b> o <em>Estado brasileiro</em></h1>
            <p className="lede">
              A história em seis partes: quanto você paga, para onde vai o dinheiro, quanto custa a máquina, a quem o Estado favorece,
              o que ele cobra de quem produz e o que devolve. Banco Central, IBGE, Câmara, Senado e Banco Mundial são lidos automaticamente das APIs oficiais.
            </p>
            <div className="stamp">Dados automáticos coletados em {atualizado} · cada número traz sua data-base</div>
            <Tickers p={p} />
          </div>
        </header>

        <Navegacao />

        <main>
          <div className="wrap">
            <Parte n="I" titulo="A conta" texto="Antes de qualquer gasto, a pergunta que importa: quanto sai do bolso de quem trabalha e produz?" />
            <Conta p={p} />
            <Traduzindo p={p} />

            <Parte n="II" titulo="Para onde vai" texto="Arrecadação recorde, e mesmo assim o dinheiro não basta." />
            <Orcamento p={p} />
            <Contas p={p} />

            <Parte n="III" titulo="A máquina" texto="Quem trabalha para o Estado, quanto ganha, e quanto custam os Poderes que decidem o orçamento." />
            <Funcionalismo p={p} />
            <Salarios />
            <Judiciario p={p} />
            <Congresso p={p} />
            <CamaraSenado p={p} />

            <Parte n="IV" titulo="Para poucos" texto="Além de gastar, o Estado abre mão de receita e protege setores escolhidos. Quem paga é o resto." />
            <Industria p={p} />
            <ZonaFranca />

            <Parte n="V" titulo="O peso sobre quem produz" texto="O custo do Estado não é só o imposto: é o tempo, as regras e a infraestrutura que falta." />
            <Burocracia />
            <Logistica />
            <Liberdade />
            <Estados p={p} />

            <Parte n="VI" titulo="O que volta" texto="Depois de pagar a conta, o que o contribuinte recebe de volta?" />
            <Retorno />
            <Fecho p={p} />
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
      </TooltipProvider>
    </div>
  );
}
