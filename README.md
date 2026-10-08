# O Peso do Estado

Painel de dados do **Ranking dos Políticos** sobre o tamanho e o custo do Estado brasileiro: liberdade econômica (país e estados), dívida e déficit, impostos, Brasil × mundo, burocracia, indústria e Zona Franca, logística, retorno dos tributos, funcionalismo, salários, Judiciário, Congresso, emendas e os gastos da Câmara e do Senado.

Destino previsto: **pesodoestado.ranking.org.br**.
Projeto no Lovable: https://lovable.dev/projects/23b9f5f0-562c-4377-92c6-a1e6526c9b9b

---

## Como os dados se atualizam

```
GitHub Actions (a cada 3 h)                    site (navegador)
scripts/coletar-dados.mjs  ──grava──▶  branch "dados"/painel.json  ◀──lê── usePainelDados()
        │                                                                  │
        └── APIs: Banco Central, Câmara, Senado,                           └── se falhar, usa a cópia
            IBGE, Banco Mundial, Portal da Transparência                       embutida src/data/painel.json
```

- O robô roda em `.github/workflows/atualizar-dados.yml` (cron `17 */3 * * *`, também pode ser disparado à mão).
- O resultado vai para o branch **`dados`**, nunca para o `main`. Assim o Lovable não recebe commits automáticos e o site **não precisa ser republicado** para mostrar números novos: o navegador baixa `https://raw.githubusercontent.com/rankingdospoliticos/pesodoestado/dados/painel.json`.
- Cada fonte é independente. Se uma API cair, o robô mantém o último valor bom dela e marca a fonte como "erro". A seção **Fontes** do painel mostra a situação de cada coleta, e o selo "ao vivo" fica laranja se o dado tiver mais de 48 h.

### Fontes automáticas

| Fonte | O que traz | Endpoint |
|---|---|---|
| Banco Central (SGS) | dívida bruta e líquida, primário, nominal, juros (12 m), Selic, IPCA | `api.bcb.gov.br/dados/serie/bcdata.sgs.{código}` |
| Câmara dos Deputados | cota parlamentar do ano (total, por mês, categoria, partido, UF, fornecedor, maiores gastos) | arquivo diário `camara.leg.br/cotas/Ano-{ANO}.csv.zip` (a API v2 de despesas volta vazia) |
| Senado Federal | CEAPS, folha do mês (bruto, abate-teto), servidores por vínculo, terceirizados, imóveis funcionais | `adm.senado.gov.br/adm-dadosabertos/api/v1` |
| IBGE | população estimada (dívida por habitante, custo per capita) | `servicodados.ibge.gov.br/api/v3/agregados/6579` |
| Banco Mundial | abertura comercial e tarifa média de importação | `api.worldbank.org/v2` |
| Portal da Transparência | emendas parlamentares empenhadas e pagas | `api.portaldatransparencia.gov.br` (**precisa de chave**) |

### Dados curados (atualização manual)

A página é uma narrativa em seis partes: **I. A conta** (quanto se paga e o que isso equivale), **II. Para onde vai** (orçamento, déficit, juros), **III. A máquina** (servidores, salários, Judiciário, Congresso, Câmara e Senado ao vivo), **IV. Para poucos** (subsídios, Zona Franca), **V. O peso sobre quem produz** (burocracia, logística, liberdade econômica, estados) e **VI. O que volta**. A ordem está em `PesoDoEstado.tsx`.

Indicadores que saem em relatórios anuais (Heritage, Fraser, Mackenzie, CNJ Justiça em Números, IBPT, PISA, IPC, Anuário de Segurança, LOA etc.) ficam em **`src/data/curados.ts`**, cada um com fonte e data. Para atualizar, edite o número no arquivo, direto no GitHub ou pelo Lovable.

---

## Primeira configuração (TI)

1. **Permissão do robô**: Settings → Actions → General → *Workflow permissions* → marcar **Read and write permissions**.
2. **Chave do Portal da Transparência** (opcional, gratuita): cadastre um e-mail em https://portaldatransparencia.gov.br/api-de-dados/cadastrar-email e salve a chave em Settings → Secrets and variables → Actions → *New repository secret* com o nome `PORTAL_TRANSPARENCIA_API_KEY`. Sem ela, a parte de emendas usa os valores da LOA.
3. **Primeira coleta**: aba Actions → "Atualizar dados do painel" → *Run workflow*. Isso cria o branch `dados`. Depois disso roda sozinho.

### Subdomínio pesodoestado.ranking.org.br

- **Pelo Lovable** (mais simples): Publish → Settings → Domains → *Connect domain* → `pesodoestado.ranking.org.br`, e criar no DNS do ranking.org.br os registros que o Lovable indicar.
- **Hospedagem própria**: é um app TanStack Start (React 19 + Vite). `bun install && bun run build` gera a versão de produção (SSR, pronta para Node ou Cloudflare). Apontar o subdomínio para onde ele for publicado.
- Se preferir servir o JSON de outro lugar (CDN própria, por exemplo), defina `VITE_DADOS_URL` no build.

---

## Desenvolvimento

```sh
bun install        # ou npm i
bun run dev
```

Rodar o coletor localmente (Node 20+, sem dependências):

```sh
node scripts/coletar-dados.mjs                          # grava em src/data/painel.json
node scripts/coletar-dados.mjs --so bcb,senado          # só algumas fontes
node scripts/coletar-dados.mjs --saida /tmp/painel.json
```

De tempos em tempos, vale atualizar a cópia embutida (`src/data/painel.json`) com a versão do branch `dados`, para que o primeiro carregamento já venha recente.

### Onde está cada coisa

| Caminho | Conteúdo |
|---|---|
| `src/routes/index.tsx` | rota da página, título e metadados |
| `src/components/painel/PesoDoEstado.tsx` | cabeçalho, contadores, menu, rodapé e ordem das seções |
| `src/components/painel/secoes-*.tsx` | os capítulos, na ordem da narrativa: abertura (a conta, equivalências, orçamento, fecho), economia, sociedade e Poderes |
| `src/components/painel/MapaBrasil.tsx` | mapa interativo dos estados (contorno em `src/data/mapa-brasil.ts`, CC BY 4.0) |
| `src/components/painel/visuais.tsx` | visuais sob medida: waffle, treemap, bolhas, halteres, termômetro, versus, calendário |
| `src/lib/painel/equivalencias.ts` | custos usados nas comparações (casa popular, creche, UBS, hospital do câncer, piso do professor…), com fonte |
| `src/components/painel/graficos.tsx` | gráficos em SVG (barras, linhas, pilhas) com tooltip |
| `src/components/painel/painel.css` | identidade visual do Ranking (cores, Poppins e Open Sans) |
| `src/lib/painel/dados.ts` | tipos e carregamento dos dados automáticos |
| `src/data/curados.ts` | dados de relatórios, com fonte |
| `scripts/coletar-dados.mjs` | robô de coleta |
| `.github/workflows/atualizar-dados.yml` | agendamento do robô |
