import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Página em branco — Ranking dos Políticos" },
      { name: "description", content: "Página em branco do Ranking dos Políticos." },
      { property: "og:title", content: "Página em branco — Ranking dos Políticos" },
      { property: "og:description", content: "Página em branco do Ranking dos Políticos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return <main className="min-h-screen bg-background" />;
}
