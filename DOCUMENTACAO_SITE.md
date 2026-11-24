# Especificação Completa — **Buy or Upgrade my pc**

Documento de referência para construção, manutenção e evolução da plataforma **Buy or Upgrade my pc** (*"Evolua seu setup."*), reunindo **funcionalidades e regras de negócio**, **identidade visual (modos claro e noturno)** e **ferramentas/arquitetura técnica**.

---

## 1. Visão Geral do Produto

- **Nome da Marca:** Buy or Upgrade my pc
- **Slogan:** *Evolua seu setup.*
- **Conceito Central:** *Tecnologia que evolui com você.*
- **Idioma da Interface:** Português do Brasil (`pt-BR`)
- **Objetivo:** Ajudar usuários iniciantes e entusiastas a montar um PC do zero ou planejar upgrades no setup atual com segurança técnica — validando compatibilidade física, estabilidade elétrica, ausência de gargalos entre CPU e GPU, simulações comparativas e recomendações livres de conflitos.
- **Premissa de Catálogo:** A plataforma foca exclusivamente em **compatibilidade técnica, desempenho relativo e saúde do sistema** — **sem exibição de preços ou valores monetários (`R$`)** em nenhuma tela.

---

## 2. Ferramentas e Stack Tecnológica

### 2.1 Dependências Principais (Frontend & Build)
| Ferramenta / Pacote | Versão / Função | Finalidade no Projeto |
| :--- | :--- | :--- |
| **React + React DOM** | `^19.0.1` | Interface declarativa baseada em componentes funcionais e hooks (`useState`, `useMemo`, `useEffect`, `useRef`). |
| **TypeScript** | `^7.0.2` | Tipagem estática rigorosa para peças, regras de compatibilidade, análises e snapshots salvos (`tsc --noEmit`). |
| **Vite** | `^8.3.0` (`@vitejs/plugin-react ^6.1.1`) | Bundler e servidor de desenvolvimento em porta `3000` com builds otimizados (`vite build`). |
| **Tailwind CSS v4** | `^4.3.3` (`@tailwindcss/vite`) | Estilização utilitária moderna com `@import "tailwindcss";` e variante `@custom-variant dark (&:where(.dark, .dark *));`. |
| **Motion (`motion/react`)** | `^12.23.24` | Transições entre abas, modais, barras de ganho, polígonos SVG animados, contadores numéricos crescentes e gatilhos por visualização (`whileInView` / `useInView`), encapsulados em `<MotionConfig reducedMotion="user">`. |
| **Lucide React** | `^0.546.0` | Família única de ícones lineares consistentes para hardware, alertas, navegação e ações. |
| **Google Fonts** | `Montserrat`, `Inter`, `DM Mono` | Hierarquia tipográfica editorial, de interface e técnica/tabular. |

### 2.2 Scripts e Fluxo de Desenvolvimento
- `npm run dev` — Inicia servidor Vite na porta `3000` (`vite --port=3000 --host=0.0.0.0`).
- `npm run build` — Compila o bundle de produção (`vite build`).
- `npm run lint` — Executa verificação estática de tipos TypeScript (`tsc --noEmit`).
- `npm run preview` — Pré-visualiza a build compilada localmente.

### 2.3 Persistência Local
- **`localStorage`**:
  - Chave `buy-upgrade-diagnostic-v1`: armazena o snapshot completo do diagnóstico (`SavedDiagnosticSnapshot`), contendo os IDs das peças selecionadas, status de compatibilidade, resumo de equilíbrio, problemas detectados e os 3 planos de simulação gerados.
  - Chave `rigspec-theme`: armazena a preferência de tema (`light` ou `dark`), com detecção inicial automática via `prefers-color-scheme`.

---

## 3. Identidade Visual — Direção *Natural Technology*

A estética combina precisão de engenharia com suavidade orgânica, evitando clichés de estética gamer escura com neon ou gradientes pesados.

### 3.1 Logotipo e Símbolo
- **Símbolo (`BrandMark`)**: Duas setas geométricas ascendentes (duplo chevron) com pontas arredondadas, simbolizando evolução contínua, modularidade e ganho de desempenho.
  - Chevron superior em **Verde Floresta** (`#315C45` no claro / `#6AB087` no escuro).
  - Chevron inferior em **Verde Eucalipto** (`#6F9278` no claro / `#86AD90` no escuro).
- **Assinatura**: Símbolo à esquerda + nome **Buy or Upgrade my pc** em `Montserrat` negrito (`font-bold`) + subtítulo discreto *"Evolua seu setup."* em telas maiores.

### 3.2 Paleta de Cores

#### Modo Claro (Padrão)
| Token / Papel | HEX | Aplicação |
| :--- | :--- | :--- |
| **Verde Floresta (Primária)** | `#315C45` | Botões primários, navegação ativa, destaques de ganho, links principais e palavra *"mais longe."* no Hero. |
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
- **Dados Técnicos (`DM Mono`, pesos 400–500 + `.tabular-nums`)**: Frequências (`MT/s`, `GHz`), consumo (`W`), VRAM, índices de desempenho e porcentagens (`+XX%`) alinhados numericamente.

### 3.4 Ativos Visuais e Fotografia de Estúdio
Todas as janelas principais e os 5 slots de categoria utilizam fotografia de estúdio em fundo neutro armazenada em `/src/assets/images/` e centralizada no mapeamento de imagens:
- **Hero Principal**: `hero_natural_pc_1795479540446.jpg`
- **Banner do Comparativo / Bancada**: `banner_upgrade_bench_1795479539990.jpg`
- **Placa-mãe**: `part_motherboard_1795479540895.jpg`
- **Processador (CPU)**: `part_cpu_1795479541032.jpg`
- **Placa de Vídeo (GPU)**: `part_gpu_1795479541657.jpg`
- **Memória RAM**: `part_ram_1795479541850.jpg`
- **Fonte (PSU)**: `part_psu_1795479542208.jpg`

Inclui fallback automático com ícone vetorial caso alguma imagem falhe ao carregar.

---

## 4. Arquitetura da Interface e Fluxos de Navegação

### 4.1 Cabeçalho Global Fixo (`sticky top-0`)
1. **Esquerda**: Logotipo `BrandMark` + nome **Buy or Upgrade my pc** + slogan *Evolua seu setup.*.
2. **Centro**: Navegação principal entre as 3 visões do sistema:
   - **Início** (Configurador + Diagnóstico + Recomendações)
   - **Comparativo** (Comparação *Build Atual × Build Futura*)
   - **Base de Dados** (Catálogo completo de peças com status de compatibilidade)
3. **Direita**:
   - **Campo de busca rápida** (`Buscar componentes...`): ao digitar/submeter, leva o usuário diretamente à **Base de Dados** com o termo filtrado.
   - **Alternador de Tema**: Botão **Modo Noturno** / **Modo Claro**.
   - **Atalho "Limpar Tudo"** (ou menu mobile responsivo com acesso completo às abas e busca).

---

### 4.2 Visão 1: **Início** (Configurador + Diagnóstico + Recomendações)

#### A. Palco Hero + Barra de Telemetria Acoplada
- **Bloco Hero**: Fundo `#F1F5F1` (claro) / `#171E19` (escuro) com faixas geométricas diagonais em verde névoa.
  - Selo superior: *"Plataforma de upgrades"*.
  - Título H1: *"Seu PC ainda pode ir **mais longe.**"* (destaque em verde floresta).
  - Descrição explicando a regra de entrada (informar ao menos Placa-mãe, CPU ou GPU).
  - **CTAs**:
    - Primário (pill verde floresta): **Descobrir meu upgrade →** (rola até os 5 slots).
    - Secundário (sublinhado com ícone Play): **Abrir Base de Dados**.
    - Demonstração técnica (pill vermelha discreta): **Simular Conflito / Gargalo** (carrega build demonstrativa com `Ryzen 5 3400G` + `B550M AORUS` + `RTX 4080 Super` + `16GB DDR4` + `Fonte 500W`, disparando alertas vermelhos reais).
  - Coluna direita com fotografia da estação de trabalho e legenda da marca.
- **Faixa de Telemetria Acoplada (`TelemetryStrip`)** em 4 colunas:
  1. **Status Técnico** (*100% Compatível*, *Requer Atenção*, *Alerta Crítico* ou *Aguardando Peças*).
  2. **Consumo Estimado** (pico em Watts frente à fonte selecionada ou sugestão mínima com folga).
  3. **Equilíbrio CPU × GPU** (*Equilibrado*, *Gargalo de CPU*, *Gargalo de GPU* ou *Incompleto*).
  4. **Plataforma e Peças** (`X / 5 peças` + resumo de socket, DDR e PCIe).

#### B. Grade de Seleção de Hardware (`SlotGrid` — Seção "Categorias")
- 5 cards lado a lado (`Placa-mãe`, `Processador`, `Placa de vídeo`, `Memória RAM`, `Fonte`):
  - Imagem de estúdio (`4:3`) com tag de categoria no canto superior esquerdo.
  - Quando vazio: nome do slot, dica técnica curta e botão **Selecionar Peça →**.
  - Quando preenchido: marca, selo `OK` (verde) ou `Alerta` (vermelho), nome do modelo, linha técnica em `DM Mono`, alerta vermelho inline caso haja conflito ou gargalo, e ações **Trocar peça** / **Remover** (ícone lixeira).
- **Modal de Seleção (`HardwarePickerModal`)**:
  - Busca por nome, marca, socket ou chipset.
  - Toggle **"Somente compatíveis"** vs **"Mostrar todas"**.
  - Destaca peças incompatíveis em vermelho com a justificativa exata (ex.: incompatibilidade de chipset, socket, DDR4 vs DDR5 ou gargalo que seria causado).

#### C. Diagnóstico Técnico e Alertas (`DiagnosticAndRecommendations`)
- **Alertas Críticos Vermelhos**: Caixa destacada exibindo cada erro grave (socket incorreto, chipset incompatível como Ryzen 1000/2000/3000G em B550/A520, memória DDR errada, VRM insuficiente, fonte abaixo do consumo de pico ou gargalo severo CPU×GPU).
- **Resumo Geral e Observações Técnicas**: Lista prioridades de ação e avisos secundários (ex.: margem elétrica apertada, restrição PCIe 3.0 em placa-mãe antiga ou memória RAM abaixo de 16 GB).

#### D. Banner Personalizado e Motor de Sugestões
- **Banner *"Seu PC está pronto para um upgrade?"***:
  - Botão **Analisar meu PC**: salva o snapshot atual no `localStorage`, exibe banner de confirmação com atalho **Abrir Comparativo →** e rola até o conteúdo das recomendações.
  - Alternador de abas interno:
    1. **Sugestões de Montagem (3 Perfis)** — disponível quando faltam peças; requer **ao menos Placa-mãe, CPU ou GPU preenchida** para ser liberada (evitando recomendações genéricas sem âncora).
       - Exibe 3 perfis completos (**Entrada**, **Equilibrado**, **Máximo Desempenho**), mantendo as peças válidas do usuário e preenchendo os slots faltantes com **100% de compatibilidade e zero gargalo**.
       - O perfil com maior ganho percentual estimado recebe borda verde floresta, badge **Maior Ganho** e contador percentual animado.
       - Botões em cada card: **Aplicar Build** e **Comparar** (leva direto à aba *Comparativo* já configurada com aquele perfil).
    2. **Upgrades Compatíveis** — disponível quando há ao menos 1 peça selecionada.
       - **Destaque Dinâmico (`BestUpgradeSpotlight`)**: Card em evidência para o upgrade isolado que entrega o **maior ganho percentual global**, com feixe de luz animado, imagem do componente, contador percentual crescente e barra de ganho.
       - **Grupos por Categoria** (`GPU`, `CPU`, `RAM`, `Placa-mãe`, `Fonte`): ordenados do maior ganho para o menor, exibindo apenas opções **100% compatíveis** que não introduzem gargalos nem ultrapassam os limites de VRM/fonte atuais.

---

### 4.3 Visão 2: **Comparativo** (`BuildComparison`)

Projetada para comparar a **Build Atual** (carregada automaticamente do configurador e do diagnóstico salvo) com uma **Build Futura**:

1. **Cabeçalho do Comparativo + Controles de Simulação**:
   - Mostra o resumo da build atual (`X/5 peças`) carregada do diagnóstico salvo.
   - Botões de simulação alimentados pelo snapshot salvo do diagnóstico:
     - **Simular Entrada**
     - **Simular Equilibrado**
     - **Simular Máximo Desempenho**
   - Botão **Aplicar Build Futura no Setup** (transfere a configuração simulada para a build ativa).
   - Banner visual de bancada de upgrade à direita.
2. **Tabela Peça por Peça: Atual vs Futura (posicionada logo abaixo do cabeçalho)**:
   - Selo no cabeçalho com **Ganho geral animado (`+XX%`)**.
   - Lista os 5 slots lado a lado (`Placa-mãe`, `CPU`, `GPU`, `RAM`, `Fonte`) com miniatura, componente atual → componente futuro, **selo animado de ganho (`+XX% ganho`, `Peça adicionada`, `Conflito resolvido` ou `Mantida`)**, contador de índice (`atual → futuro`), **barra dupla progressiva animada** (base atual + extensão de ganho com brilho sutil) e botão **Alterar Futura** para personalização livre de qualquer slot.
3. **Faixa de 4 KPIs Animados**:
   - **Ganho em Processamento (CPU)** (`+XX%`, variação de índice e barra de progresso).
   - **Ganho Gráfico (GPU)** (`+XX%`, variação de índice e barra de progresso).
   - **Memória RAM** (`X → Y GB`, ganho percentual e barra).
   - **Consumo e Status Futuro** (`Sem Gargalos` ou alerta + carga em Watts animada).
4. **Gráficos Comparativos (Lado a Lado)**:
   - **Ganho por Subsistema**: Barras horizontais duplas (`Atual` vs `Futura`) para Processamento, Poder Gráfico, Memória RAM e Plataforma (VRM e PCIe), com deltas percentuais animados.
   - **Perfil Geral do Sistema (Gráfico Radar SVG)**: Polígono de 5 eixos (`CPU`, `GPU`, `Memória`, `Plataforma`, `Energia`) sobrepostos com legenda e leitura interativa ao passar o mouse nos eixos.
5. **Comparativo de Consumo Elétrico vs Capacidade da Fonte**:
   - Barras comparando pico de carga frente à potência da fonte de cada build (meta recomendada < 75% de carga).
6. **Checklist de Mudanças Recomendadas (baseado no Diagnóstico Salvo)**:
   - Gera o plano exato de ações diferenciando:
     - **Corrigir Conflito** (quando o diagnóstico detecta socket/DDR/chipset/VRM/fonte incompatível ou gargalo severo).
     - **Fazer Upgrade** (com porcentagem de ganho por peça).
     - **Adicionar Peça** (para slots originalmente vazios).
   - Faixa inferior resumindo as **peças mantidas** do setup atual.

---

### 4.4 Visão 3: **Base de Dados** (`CatalogExplorer`)

- Banner visual + resumo de contagem total do catálogo.
- 5 cards de filtro visual por categoria com fotografia (`Todas`, `Placas-mãe`, `CPUs`, `GPUs`, `Memórias RAM`, `Fontes`).
- Campo de busca textual sincronizado com a busca do cabeçalho.
- **Tabela Unificada Verde/Vermelha de Compatibilidade**:
  - Exibe todas as peças numa única tabela ordenada (compatíveis primeiro).
  - **Linhas com fundo verde suave**: peças **100% compatíveis** com as peças já selecionadas na build atual.
  - **Linhas com fundo vermelho suave**: peças que causariam **incompatibilidade física ou conflito técnico**, exibindo o motivo exato na coluna de status.
  - Botão de ação direta em cada linha para aplicar a peça imediatamente no configurador.

---

## 5. Regras Técnicas do Motor de Análise (`pcAdvisor`)

### 5.1 Regras de Compatibilidade e Segurança Física
1. **Socket & Chipset**:
   - CPU e Placa-mãe devem ter o mesmo `socket` (`AM4`, `AM5`, `LGA1700`, `LGA1851`).
   - Restrições reais de chipset são bloqueadas como erro crítico (ex.: CPUs Ryzen 1000/2000 e APUs Ryzen 2200G/3200G/3400G possuem `incompatibleChipsets: ['A520', 'B550']`).
2. **Memória RAM (`DDR4` vs `DDR5`)**:
   - A RAM deve corresponder exatamente ao `ramType` da Placa-mãe e respeitar `capacityGB <= maxRamGB`.
   - A RAM deve ser suportada pelo controlador da CPU (`DDR4`, `DDR5` ou `DDR4/DDR5` como em plataformas Intel LGA1700).
3. **Capacidade de VRM da Placa-mãe (`isVrmSafe`)**:
   - CPUs Intel de 20+ núcleos e 125W+ ou CPUs de 170W+ exigem `vrmTier >= 80`.
   - CPUs de 105W+ exigem `vrmTier >= 55`.
4. **Orçamento Elétrico (`calculatePowerBudget`)**:
   - Considera picos reais de turbo (`getEffectiveCpuPeakWatts`: ex. Intel 24C = 253W, 20C = 225W, AMD 170W = 210W) + `gpu.tdpWatts` + `75W` base do sistema.
   - Fonte recomendada = `max(gpu.recommendedPsuWatts, ceil(pico * 1.35 / 50) * 50)` (garantindo ~35% de folga elétrica).
   - Fonte abaixo do pico estimado gera **erro crítico vermelho**; fonte entre o pico e o recomendado gera **aviso técnico**.
5. **Equilíbrio CPU × GPU (`evaluatePairBalance`)**:
   - `diff = cpu.tierScore - gpu.tierScore`.
   - Se `diff < -12` → **Gargalo de CPU** (alerta crítico vermelho).
   - Se `diff > 20` → **Gargalo de GPU** (alerta crítico vermelho).
   - Caso contrário → **Equilibrado**.
6. **Geração de Sugestões e Planos de Simulação**:
   - Tanto as **3 sugestões de montagem** quanto os **planos de simulação no Comparativo** validam cada combinação candidata com `isCandidateBuildProblemFree` (zero erros críticos e zero avisos graves), reparando automaticamente conflitos existentes quando o usuário simula melhorias a partir de uma build problemática.

---

## 6. Sistema de Animações Sob Visualização (`Motion`)

Para garantir fluidez e foco visual sem sobrecarregar o carregamento inicial:
- **Gatilho por Scroll / Viewport (`whileInView` e `useInView`)**:
  - Todas as barras de ganho de desempenho, gráficos de barras por subsistema, gráfico Radar SVG, barras de consumo elétrico, cards de KPI, cards de mudança recomendada, cards dos 3 perfis, grupos de upgrade e destaque **Maior Ganho** utilizam `viewport={{ once: true, amount: 0.15..0.25 }}`.
  - Os contadores numéricos crescentes (`AnimatedPercentCounter` e `AnimatedMetricNumber`) iniciam a contagem de `0%` (ou valor inicial) até o valor final apenas quando o usuário rola até visualizar aquele campo na tela.
- **Transições Imediatas de Interação**:
  - Alternância entre abas (`AnimatePresence`), abertura de modais e feedback de troca de slot respondem instantaneamente ao clique do usuário.
- **Acessibilidade de Movimento**:
  - Toda a árvore é envolvida por `<MotionConfig reducedMotion="user">`, e os contadores consultam `useReducedMotion()` para exibir o valor final imediatamente quando o usuário prefere movimento reduzido.

---

## 7. Checklist de Implementação do Site

- [ ] Configurar projeto **Vite + React 19 + TypeScript + Tailwind CSS v4** na porta `3000`.
- [ ] Carregar fontes `Montserrat`, `Inter` e `DM Mono` e configurar tokens de cor claro/escuro no CSS global.
- [ ] Construir catálogo tipado de hardware (`CPU`, `GPU`, `Motherboard`, `RAM`, `PSU`) sem preços.
- [ ] Implementar motor técnico (`pcAdvisor`) com validação de socket, chipset, DDR, VRM, fonte e gargalo CPU×GPU.
- [ ] Montar cabeçalho global com `BrandMark` duplo chevron, navegação entre 3 abas, busca rápida e toggle **Modo Noturno**.
- [ ] Implementar **Início** com Hero diagonal sage, `TelemetryStrip` acoplada, `SlotGrid` visual de 5 categorias e `DiagnosticAndRecommendations` com alertas vermelhos, âncora mínima e destaque de maior ganho.
- [ ] Salvar build e diagnóstico em `localStorage` ao analisar/editar e pré-carregar na aba **Comparativo**.
- [ ] Implementar aba **Comparativo** com **Peça por Peça** logo abaixo do cabeçalho, botões de simulação ligados ao diagnóstico salvo, gráficos de barra/radar e checklist de mudanças recomendadas.
- [ ] Implementar aba **Base de Dados** com tabela unificada verde (compatível) e vermelha (incompatível).
- [ ] Garantir animações acionadas por visualização (`whileInView` / `useInView`) respeitando `reducedMotion`.
- [ ] Validar `tsc --noEmit` (`npm run lint`) e `vite build` (`npm run build`).
