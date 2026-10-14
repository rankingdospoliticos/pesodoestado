import { createFileRoute } from "@tanstack/react-router";
// CSS do painel embutido no HTML (?inline): evita uma requisição que bloqueia a primeira pintura.
import painelCss from "../components/painel/painel.css?inline";
import { PesoDoEstado } from "../components/painel/PesoDoEstado";

const FONTES =
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400..700&family=Poppins:wght@400;500;600;700&display=swap";
// Fontes carregadas sem bloquear a renderização: o texto aparece na fonte do sistema e troca quando chegam (display=swap).
const CARREGA_FONTES = `(function(){try{var l=document.createElement('link');l.rel='stylesheet';l.href='${FONTES}';document.head.appendChild(l)}catch(e){}})();`;

const TITULO = "O Peso do Estado — Ranking dos Políticos";
const DESCRICAO =
  "Painel com dados oficiais atualizados automaticamente: dívida e déficit, impostos, funcionalismo, salários, Judiciário, Congresso, emendas e os gastos da Câmara e do Senado.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { name: "twitter:card", content: "summary" },
      { name: "theme-color", content: "#021E2F" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
    styles: [{ children: painelCss }],
    scripts: [{ children: CARREGA_FONTES }],
  }),
  component: PesoDoEstado,
});
