# Especificação Completa Atualizada — **Buy or Upgrade my pc**

Documento de referência atualizado para construção, manutenção, deploy e evolução da plataforma **Buy or Upgrade my pc** (*"Evolua seu setup."*), reunindo **funcionalidades e regras de negócio**, **identidade visual (modos claro e noturno)**, **ferramentas/arquitetura técnica** e **publicação no GitHub Pages**.

---

## 1. Visão Geral do Produto

- **Nome da Marca:** Buy or Upgrade my pc
- **Slogan:** *Evolua seu setup.*
- **Conceito Central:** *Tecnologia que evolui com você.*
- **Idioma da Interface:** Português do Brasil (`pt-BR`)
- **Objetivo:** Ajudar usuários iniciantes e entusiastas a montar um PC do zero ou planejar upgrades no setup atual com segurança técnica — validando compatibilidade física, estabilidade elétrica, armazenamento (HD, SSD SATA e SSD NVMe), ausência de gargalos entre CPU e GPU, simulações comparativas e recomendações livres de conflitos.
- **Premissa de Catálogo:** A plataforma foca exclusivamente em **compatibilidade técnica, desempenho relativo e saúde do sistema** — **sem exibição de preços ou valores monetários (`R$`)** em nenhuma tela.
- **Diretriz de Interface:** Todos os botões de ação exibem apenas texto e ícones funcionais diretos (sem ícones de IA/estrelas decorativas).

---

## 2. Ferramentas e Stack Tecnológica

### 2.1 Dependências Principais (Frontend & Build)
| Ferramenta / Pacote | Versão / Função | Finalidade no Projeto |
| :--- | :--- | :--- |
| **React + React DOM** | `^19.0.1` | Interface declarativa baseada em componentes funcionais e hooks (`useState`, `useMemo`, `useEffect`, `useRef`). |
| **TypeScript** | `^7.0.2` | Tipagem estática rigorosa para peças (`CpuPart`, `MotherboardPart`, `GpuPart`, `RamPart`, `StoragePart`, `PsuPart`), regras de compatibilidade, análises e snapshots salvos (`tsc --noEmit`). |
| **Vite** | `^8.3.0` (`@vitejs/plugin-react ^6.1.1`) | Bundler e servidor de desenvolvimento em porta `3000` com `base: './'` para compatibilidade total com subcaminhos do GitHub Pages. |
| **Tailwind CSS v4** | `^4.3.3` (`@tailwindcss/vite`) | Estilização utilitária moderna com `@import "tailwindcss";` e variante `@custom-variant dark (&:where(.dark, .dark *));`. |
| **Motion (`motion/react`)** | `^12.23.24` | Transições entre abas, indicador deslizante do cabeçalho (`layoutId`), carrossel de banners, barras de ganho, polígonos SVG animados, contadores numéricos crescentes e gatilhos por visualização (`whileInView` / `useInView`), encapsulados em `<MotionConfig reducedMotion="user">`. |
| **Lucide React** | `^0.546.0` | Família única de ícones lineares consistentes para hardware (`Cpu`, `CircuitBoard`, `Monitor`, `MemoryStick`, `HardDrive`, `Zap`), alertas, navegação e ações. |
| **Google Fonts** | `Montserrat`, `Inter`, `DM Mono` | Hierarquia tipográfica editorial, de interface e técnica/tabular. |

### 2.2 Scripts e Deploy (Local & GitHub Pages)
- `npm run dev` — Inicia servidor Vite na porta `3000` (`vite --port=3000 --host=0.0.0.0`).
- `npm run build` — Compila o bundle de produção para `dist/` com caminhos relativos (`base: './'`) e copia `src/assets/` para `dist/src/assets/`.
- `npm run lint` — Executa verificação estática de tipos TypeScript (`tsc --noEmit`).
- `npm run preview` — Pré-visualiza a build compilada localmente.
- **GitHub Pages (`.github/workflows/deploy.yml` + `public/.nojekyll`)**:
  - `vite.config.ts` configurado com `base: './'` e `HardwareVisuals.tsx` usando `./src/assets/images/...` para evitar tela em branco em URLs de subpasta (`https://usuario.github.io/repositorio/`).
  - Workflow automático de GitHub Actions que instala dependências, executa `npm run build` e publica a pasta `./dist` no GitHub Pages ao ativar **Settings → Pages → Source: GitHub Actions** (ou ao enviar manualmente o conteúdo compilado de `dist/`).

### 2.3 Persistência Local
- **`localStorage`**:
  - Chave `buy-upgrade-diagnostic-v1`: armazena o snapshot completo do diagnóstico (`SavedDiagnosticSnapshot`), contendo os IDs das 6 peças selecionadas (incluindo `storage` opcional para retrocompatibilidade), status de compatibilidade, resumo de equilíbrio, problemas detectados e os 3 planos de simulação gerados.
  - Chave `rigspec-theme`: armazena a preferência de tema (`light` ou `dark`), com detecção inicial automática via `prefers-color-scheme`.

---

## 3. Identidade Visual — Direção *Natural Technology*

A estética combina precisão de engenharia com suavidade orgânica, evitando estética gamer escura com neon ou gradientes pesados.

### 3.1 Logotipo e Símbolo
- **Símbolo (`BrandMark`)**: Duas setas geométricas ascendentes (duplo chevron) com pontas arredondadas, simbolizando evolução contínua, modularidade e ganho de desempenho, alojadas em um badge arredondado discreto no cabeçalho.
  - Chevron superior em **Verde Floresta** (`#315C45` no claro / `#6AB087` no escuro).
  - Chevron inferior em **Verde Eucalipto** (`#6F9278` no claro / `#86AD90` no escuro).
- **Assinatura**: Símbolo à esquerda + nome **Buy or Upgrade my pc** em `Montserrat` negrito (`font-bold`) + subtítulo discreto *"Evolua seu setup."* em telas maiores.

### 3.2 Paleta de Cores

#### Modo Claro (Padrão)
| Token / Papel | HEX | Aplicação |
| :--- | :--- | :--- |
| **Verde Floresta (Primária)** | `#315C45` | Botões primários, pílula ativa do cabeçalho, destaques de ganho, links principais e palavra *"mais longe."* no Hero. |
| **Verde Eucalipto (Secundária)** | `#6F9278` | Ícones de categoria, barras da build atual, séries secundárias nos gráficos e detalhes sutis. |
| **Verde Névoa (Suporte)** | `#E5EEE6` | Faixas diagonais decorativas, cabeçalhos de tabelas, banners personalizados e cards informativos. |
| **Off-white (Fundo)** | `#F6F7F3` | Fundo geral da página para leitura confortável sem branco estourado. |
| **Superfície (Cards)** | `#FFFFFF` | Cards de peças, painéis de gráficos e modais. |
| **Borda Neutra** | `#DCE4DD` | Divisores de linhas, bordas de cards e eixos de gráficos. |
| **Grafite (Texto Principal)** | `#202521` | Títulos e textos principais de alto contraste. |
| **Texto Secundário / Auxiliar** | `#4E5A50` / `#5C675E` | Descrições, rótulos técnicos e metadados. |

#### Modo Noturno (`html.dark`)
| Papel | HEX | Aplicação |
| :--- | :--- | :--- |
| **Fundo Principal** | `#121613` | Fundo base da aplicação no modo escuro. |
| **Superfície / Cards** | `#191F1B` / `#151A16` | Cards, cabeçalhos elevados e painéis internos. |
| **Superfície Verde Suave** | `#1E2821` / `#1A241D` | Cabeçalhos de tabelas e banners no modo escuro. |
| **Borda** | `#2A352D` | Contornos discretos em superfícies escuras. |
| **Acentos Verdes** | `#3B6E52`, `#5B9B76`, `#6AB087`, `#86AD90`, `#A3C7AD` | Botões primários, barras futuras e texto de destaque com contraste adequado. |
| **Texto Claro / Secundário** | `#EEF2EE` / `#A9B6AC` / `#98A69B` | Tipografia legível sobre superfícies escuras. |

#### Estados Semânticos (Compatibilidade e Alertas)
- **Compatível / Aprovado**: Fundo verde névoa ou `emerald`/`#E5EEE6` suave com texto `#315C45` (ou `#86AD90` / `emerald-400` no escuro).
- **Atenção Técnica (Warning)**: Tons `amber-50` / `amber-700` (claro) e `amber-950/20` / `amber-300` (escuro).
- **Alerta Crítico / Incompatível / Gargalo (Error)**: Fundo vermelho claro `red-50` / `red-100` (ou `red-950/35` no escuro), borda `red-300` (`red-800/70` no escuro) e texto `red-700`/`red-900` (`red-300`/`red-400` no escuro).

> **Regra de Design:** Nunca usar bordas laterais espessas (`border-l-4`), tons azuis padrão (`blue-*`), animações contínuas de pulsar (`animate-pulse`) ou cores neon.

### 3.3 Tipografia
- **Títulos e Chamadas (`Montserrat`, pesos 600–700)**: H1 (36–48 px), H2 (24–30 px), H3 (18–20 px).
- **Corpo e UI (`Inter`, pesos 400–700)**: Textos base (14–16 px), rótulos e botões (12–14 px).
- **Dados Técnicos (`DM Mono`, pesos 400–500 + `.tabular-nums`)**: Frequências (`MT/s`, `GHz`), velocidades (`MB/s`), capacidades (`GB`/`TB`), consumo (`W`), VRAM, índices de desempenho e porcentagens (`+XX%`).

### 3.4 Ativos Visuais e Fotografia de Estúdio (`./src/assets/images/`)
- **Banners e Carrossel do Início**:
  - `hero_natural_pc_1795479540446.jpg` — Estação de trabalho minimalista em tons naturais.
  - `banner_hardware_testing_1795485951534.jpg` — Bancada de testes de peças.
  - `banner_comparison_setup_1795485952354.jpg` — Setup comparativo com monitor ultrawide.
  - `banner_catalog_studio_1795485952511.jpg` — Vitrine de componentes em estúdio.
  - `banner_upgrade_bench_1795479539990.jpg` — Bancada completa de upgrade (usada também no Comparativo e na Base de Dados).
- **Miniaturas das 6 Categorias (`4:3`)**:
  - **Placa-mãe**: `part_motherboard_1795479540895.jpg`
  - **Processador (CPU)**: `part_cpu_1795479541032.jpg`
  - **Placa de Vídeo (GPU)**: `part_gpu_1795479541657.jpg`
  - **Memória RAM**: `part_ram_1795479541850.jpg`
  - **Armazenamento (HD / SSD / NVMe)**: `part_storage_1795487250015.jpg`
  - **Fonte (PSU)**: `part_psu_1795479542208.jpg`

---

## 4. Arquitetura da Interface e Fluxos de Navegação

### 4.1 Cabeçalho Global Fixo e Moderno (`sticky top-0`)
1. **Efeito Frosted & Scroll-Compact**: Fundo translúcido com `backdrop-blur`, elevação sutil e redução suave de altura (`70px → 64px`) ao rolar a página.
2. **Esquerda**: Badge com `BrandMark` + nome **Buy or Upgrade my pc** + subtítulo *Evolua seu setup.*.
3. **Centro (Navegação em Pílula com `layoutId` + Scroll-Spy)**:
   - Contém **Início**, **Diagnóstico**, **Recomendações**, **Comparativo** e **Base de Dados**.
   - Indicador ativo deslizante com física *spring* (`layoutId="header-nav-active"`) e destaque suave no hover (`layoutId="header-nav-hover"`).
   - **Acompanhamento automático da rolagem (Scroll-Spy)**: conforme o usuário rola a página inicial entre **Início** (`#configurador`), **Diagnóstico** (`#diagnostico`) e **Recomendações** (`#recomendacoes`), a pílula ativa no cabeçalho acompanha automaticamente a seção visível (com detecção de fim de página e trava temporária durante cliques diretos).
4. **Direita**: Botão pill **Limpar Montagem** (sem campo de busca no topo).
5. **Faixa Utilitária do Workspace**: Alternador mobile (`Setup`, `Comparativo`, `Base`), botão **Comparar Build Atual × Futura** e botão **Modo Noturno / Modo Claro**.

---

### 4.2 Visão 1: **Início** (Configurador + Diagnóstico + Recomendações)

#### A. Palco Hero com Carrossel + Telemetria Acoplada
- **Bloco Hero**: Fundo `#F1F5F1` (claro) / `#171E19` (escuro) com faixas geométricas diagonais em verde névoa.
  - Selo superior: *"Plataforma de upgrades"*.
  - Título H1: *"Seu PC ainda pode ir **mais longe.**"*.
  - **CTAs**: **Descobrir meu upgrade →**, **Abrir Base de Dados** e **Simular Conflito / Gargalo** (carrega `Ryzen 5 3400G` + `B550M AORUS` + `RTX 4080 Super` + `16GB DDR4` + `HD Seagate 1TB` + `Fonte 500W`).
  - **Carrossel Hero (`HeroImageCarousel`)**: Transição automática com controles manuais, barra de progresso e frases incentivando explorar peças e testar cenários.
- **Banners de Exploração (`HomeExplorationBanners`)**: Grid de banners interativos com imagens em transição, convites para testar combinações, simular gargalos, comparar upgrades e explorar o catálogo.
- **Faixa de Telemetria Acoplada (`TelemetryStrip`)** em 4 colunas:
  1. **Status Técnico** (*100% Compatível*, *Requer Atenção*, *Alerta Crítico* ou *Aguardando Peças*).
  2. **Consumo Estimado** (Watts de pico vs fonte atual/sugerida).
  3. **Equilíbrio CPU × GPU** (*Equilibrado*, *Gargalo de CPU*, *Gargalo de GPU* ou *Incompleto*).
  4. **Plataforma e Peças** (`X / 6 peças` + resumo de socket e DDR).

#### B. Grade de Seleção de Hardware (`SlotGrid` — 6 Categorias)
- 6 cards lado a lado em desktop (`Placa-mãe`, `Processador`, `Placa de vídeo`, `Memória RAM`, **Armazenamento**, `Fonte`):
  - O slot **Armazenamento** exibe o tipo (`HD`, `SSD SATA`, `SSD NVMe`), capacidade (`GB`/`TB`) e taxa de leitura (`MB/s`).
  - **Modal de Seleção (`HardwarePickerModal`)**:
    - Lista unificada verde (compatível) / vermelha (incompatível).
    - Quando aberto na categoria **Armazenamento**, exibe pílulas de filtro rápido por tipo: **Todos os Tipos**, **SSDs NVMe (M.2)**, **SSDs SATA (2.5")** e **HDs (Disco Rígido)**.

#### C. Diagnóstico Técnico e Alertas (`DiagnosticAndRecommendations`)
- **Alertas Críticos Vermelhos**: Socket incorreto, chipset incompatível (ex.: Ryzen 3400G em B550/A520), DDR incompatível, VRM insuficiente, fonte subdimensionada ou gargalo CPU×GPU.
- **Observações Técnicas (Warning)**: Memória single-channel, capacidade de RAM baixa para GPUs fortes, ausência de ATX 3.0, placa-mãe PCIe 3.0, **HD mecânico como disco principal** e **NVMe PCIe 5.0 limitado por placa-mãe PCIe 3.0/4.0**.

#### D. Motor de Sugestões (`tiers` e `upgrade`)
- **Sugestões de Montagem (3 Perfis)** — requer ao menos Placa-mãe, CPU ou GPU selecionada:
  - Preenche todas as **6 peças** faltantes (incluindo SSD NVMe adequado ao tier) para **Entrada**, **Equilibrado** e **Máximo Desempenho**.
- **Upgrades Compatíveis** — destaque **Upgrade com Maior Ganho** (`BestUpgradeSpotlight`) + grupos por categoria incluindo **Armazenamento** (ex.: migração de HD mecânico → SSD SATA → SSD NVMe PCIe 4.0/5.0).

---

### 4.3 Visão 2: **Comparativo** (`BuildComparison`)

1. **Cabeçalho do Comparativo**: Mostra `X/6 peças` da build atual e botões **Simular Entrada**, **Simular Equilibrado**, **Simular Máximo Desempenho** e **Aplicar Build Futura no Setup**.
2. **Tabela Peça por Peça: Atual vs Futura (posicionada logo abaixo do cabeçalho)**:
   - Selo de **Ganho geral animado (`+XX%`)**.
   - Lista os **6 slots** (`Placa-mãe`, `CPU`, `GPU`, `RAM`, `Armaz.`, `Fonte`) com miniatura, componente atual → futuro, selo animado de ganho, contador numérico, barra dupla progressiva animada e botão **Alterar Futura**.
3. **Faixa de 4 KPIs Animados**: CPU, GPU, Memória RAM e Consumo/Status Futuro.
4. **Gráficos Comparativos**:
   - **Ganho por Subsistema**: Processamento (CPU), Poder Gráfico (GPU), Memória RAM, **Armazenamento (HD / SSD / NVMe)** e Plataforma (VRM e PCIe).
   - **Perfil Geral do Sistema (Radar SVG de 6 eixos)**: `CPU`, `GPU`, `Memória`, `Armaz.`, `Plataforma`, `Energia`.
5. **Consumo Elétrico vs Fonte** + **Checklist de Mudanças Recomendadas** (incluindo substituições/adições de armazenamento).

---

### 4.4 Visão 3: **Base de Dados** (`CatalogExplorer`)

- **6 cards visuais de categoria** (`Placas-mãe`, `Processadores`, `Placas de Vídeo`, `Memória RAM`, **Armazenamento**, `Fontes`) + abas de filtro (`Todas`, `Placas-mãe`, `CPUs`, `GPUs`, `Memórias`, **Armazenamento**, `Fontes`).
- Ao clicar na aba ou no card **Armazenamento**, exibe sub-filtros dedicados: **Todos (HD + SSD + NVMe)**, **SSDs NVMe (M.2)**, **SSDs SATA (2.5")** e **HDs (Mecânico 3.5")**.
- Tabela unificada verde (compatível) / vermelha (incompatível) com aplicação direta no configurador.

---

## 5. Regras Técnicas do Motor de Análise (`pcAdvisor`)

1. **Socket & Chipset**: Validação estrita de socket e `incompatibleChipsets`.
2. **Memória RAM (`DDR4` vs `DDR5`)**: Correspondência entre CPU, Placa-mãe e capacidade máxima.
3. **Capacidade de VRM (`isVrmSafe`)**: Verificação por consumo/núcleos da CPU frente ao `vrmTier`.
4. **Orçamento Elétrico (`calculatePowerBudget`)**: Pico real de CPU + TDP da GPU + 75W base com margem de segurança de 35%.
5. **Equilíbrio CPU × GPU (`evaluatePairBalance`)**: Detecção de gargalo de CPU (`diff < -12`) e gargalo de GPU (`diff > 20`).
6. **Armazenamento (`HD` / `SSD SATA` / `SSD NVMe`)**:
   - Classificação por `tierScore` (HDs: 18–24; SSDs SATA: 40–56; SSDs NVMe PCIe 4.0/5.0: 64–99).
   - Alerta técnico quando o usuário seleciona HD mecânico ou SSD NVMe acima da geração PCIe da placa-mãe.
   - Perfis automáticos sempre selecionam NVMe compatível com a geração PCIe da placa-mãe quando o slot está vazio.

---

## 6. Checklist Atualizado de Validação e Deploy

- [x] Projeto configurado em **Vite + React 19 + TypeScript + Tailwind CSS v4** com `base: './'` para funcionar em subcaminhos do GitHub Pages.
- [x] **6 categorias completas**: Placa-mãe, CPU, GPU, Memória RAM, **Armazenamento (HDs, SSDs SATA e NVMe M.2)** e Fonte.
- [x] Cabeçalho moderno translúcido com **Scroll-Spy** acompanhando `Início`, `Diagnóstico` e `Recomendações`.
- [x] Carrossel e banners de exploração com múltiplas imagens de estúdio em transição.
- [x] Botões limpos sem ícones de IA.
- [x] Aba **Comparativo** com **Peça por Peça** no topo, animações acionadas por visualização (`whileInView` / `useInView`) e gráfico radar de 6 eixos.
- [x] Persistência em `localStorage` para diagnóstico e tema claro/noturno.
- [x] Workflow `.github/workflows/deploy.yml` e `public/.nojekyll` prontos para publicação sem tela em branco no GitHub Pages.
