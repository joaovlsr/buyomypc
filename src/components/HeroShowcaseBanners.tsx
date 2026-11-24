import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Database,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { BANNER_IMAGES, HardwareImage } from './HardwareVisuals';

interface HeroSlide {
  id: string;
  image: { src: string; alt: string };
  tag: string;
  caption: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'workstation',
    image: BANNER_IMAGES.heroWorkstation,
    tag: 'Buy or Upgrade my pc',
    caption: 'Compatibilidade garantida sem gargalos.',
  },
  {
    id: 'testing',
    image: BANNER_IMAGES.hardwareTesting,
    tag: 'Teste de combinações',
    caption: 'Experimente diferentes CPUs, GPUs e memórias em tempo real.',
  },
  {
    id: 'compare',
    image: BANNER_IMAGES.comparisonSetup,
    tag: 'Comparativo visual',
    caption: 'Veja em gráficos o ganho real antes do próximo upgrade.',
  },
  {
    id: 'catalog',
    image: BANNER_IMAGES.catalogStudio,
    tag: 'Catálogo verificado',
    caption: 'Descubra na hora o que combina em verde e o que evita erros.',
  },
];

export function HeroImageCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isPaused]);

  const currentSlide = HERO_SLIDES[activeIndex];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-[14px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-[#E5EEE6] dark:bg-[#1E2821] aspect-[16/11] shadow-sm group"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <HardwareImage
            src={currentSlide.image.src}
            alt={currentSlide.image.alt}
            loading="eager"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#121613]/85 via-[#121613]/15 to-transparent pointer-events-none"
      />

      {/* Top Controls */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#121613]/60 backdrop-blur-xs text-[#E5EEE6] border border-white/15">
          {activeIndex + 1} / {HERO_SLIDES.length}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Imagem anterior"
            className="w-7 h-7 rounded-full bg-[#121613]/60 hover:bg-[#315C45] text-white inline-flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Próxima imagem"
            className="w-7 h-7 rounded-full bg-[#121613]/60 hover:bg-[#315C45] text-white inline-flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Bottom Caption & Dots */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-white z-10 space-y-2.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`caption-${currentSlide.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#C6DBC9]">
              {currentSlide.tag}
            </p>
            <p className="text-sm font-semibold leading-snug mt-0.5">
              {currentSlide.caption}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-1.5" role="tablist" aria-label="Selecionar destaque visual">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={idx === activeIndex}
              aria-label={`Ver destaque ${idx + 1}: ${slide.tag}`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/45 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface HomeExplorationBannersProps {
  onScrollToSlots: () => void;
  onSimulateBottleneck: () => void;
  onOpenComparison: () => void;
  onOpenDatabase: () => void;
}

interface ExplorationSlide {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  image: { src: string; alt: string };
  actionKey: 'slots' | 'bottleneck' | 'comparison' | 'database';
}

const EXPLORATION_SLIDES: ExplorationSlide[] = [
  {
    id: 'test-parts',
    label: 'Testar Peças',
    eyebrow: 'Experimente sem medo de errar',
    title: 'Misture diferentes peças e veja a compatibilidade na hora.',
    description:
      'Troque processadores, placas-mãe, GPUs, memórias RAM e fontes nos 5 cards abaixo. A plataforma verifica socket, DDR, chipset, VRM e fonte a cada clique.',
    ctaLabel: 'Testar peças agora',
    image: BANNER_IMAGES.hardwareTesting,
    actionKey: 'slots',
  },
  {
    id: 'compare-gains',
    label: 'Comparar Ganhos',
    eyebrow: 'Simule antes de decidir',
    title: 'Compare sua build atual com futuros upgrades em gráficos reais.',
    description:
      'Gere seu diagnóstico e explore a aba Comparativo para simular perfis Entrada, Equilibrado ou Máximo Desempenho com ganhos percentuais peça por peça.',
    ctaLabel: 'Explorar o Comparativo',
    image: BANNER_IMAGES.comparisonSetup,
    actionKey: 'comparison',
  },
  {
    id: 'detect-bottleneck',
    label: 'Testar Gargalos',
    eyebrow: 'Diagnóstico inteligente',
    title: 'Descubra se uma placa de vídeo mais forte vai gerar gargalo.',
    description:
      'Carregue um cenário de conflito com um clique ou teste combinações extremas para ver como os alertas vermelhos protegem sua montagem.',
    ctaLabel: 'Simular Conflito / Gargalo',
    image: BANNER_IMAGES.upgradeBench,
    actionKey: 'bottleneck',
  },
  {
    id: 'explore-database',
    label: 'Base de Dados',
    eyebrow: 'Catálogo completo em verde e vermelho',
    title: 'Navegue por todas as peças com filtro automático do seu setup.',
    description:
      'Na Base de Dados, cada componente aparece destacado em verde se funcionar no seu PC atual ou em vermelho explicando qualquer conflito técnico.',
    ctaLabel: 'Abrir Base de Dados',
    image: BANNER_IMAGES.catalogStudio,
    actionKey: 'database',
  },
];

export function HomeExplorationBanners({
  onScrollToSlots,
  onSimulateBottleneck,
  onOpenComparison,
  onOpenDatabase,
}: HomeExplorationBannersProps) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion || paused) return;
    const timer = window.setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % EXPLORATION_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, paused]);

  const activeSlide = EXPLORATION_SLIDES[slideIdx];

  const triggerAction = (key: ExplorationSlide['actionKey']) => {
    switch (key) {
      case 'slots':
        onScrollToSlots();
        break;
      case 'bottleneck':
        onSimulateBottleneck();
        break;
      case 'comparison':
        onOpenComparison();
        break;
      case 'database':
        onOpenDatabase();
        break;
    }
  };

  const quickFeatureBanners = [
    {
      id: 'quick-test',
      icon: SlidersHorizontal,
      badge: 'Configurador Interativo',
      title: 'Teste combinações livres',
      phrase: 'Experimente trocar apenas a GPU ou simular outra plataforma para descobrir novas opções compatíveis.',
      cta: 'Escolher peças abaixo',
      image: BANNER_IMAGES.hardwareTesting,
      onClick: onScrollToSlots,
    },
    {
      id: 'quick-compare',
      icon: BarChart3,
      badge: 'Comparativo Dinâmico',
      title: 'Veja o salto de desempenho',
      phrase: 'Acompanhe peça por peça o ganho estimado antes de investir e personalize qualquer componente futuro.',
      cta: 'Abrir Comparativo',
      image: BANNER_IMAGES.comparisonSetup,
      onClick: onOpenComparison,
    },
    {
      id: 'quick-db',
      icon: Database,
      badge: 'Catálogo Verde & Vermelho',
      title: 'Explore dezenas de peças',
      phrase: 'Filtre por categoria e veja instantaneamente o que encaixa perfeitamente no seu computador.',
      cta: 'Explorar Base de Dados',
      image: BANNER_IMAGES.catalogStudio,
      onClick: onOpenDatabase,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Main Transitioning Exploration Carousel Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="rounded-[16px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#191F1B] shadow-xs"
      >
        {/* Top Feature Tabs */}
        <div className="px-4 sm:px-6 py-3 bg-[#E5EEE6]/60 dark:bg-[#1E2821] border-b border-[#DCE4DD] dark:border-[#2A352D] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap" role="tablist" aria-label="Guias interativos de exploração">
            {EXPLORATION_SLIDES.map((slide, idx) => {
              const isSelected = idx === slideIdx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSlideIdx(idx)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#315C45] text-white dark:bg-[#3B6E52]'
                      : 'text-[#4E5A50] dark:text-[#A9B6AC] hover:bg-white/80 dark:hover:bg-[#151A16]'
                  }`}
                >
                  {slide.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                setSlideIdx((prev) => (prev - 1 + EXPLORATION_SLIDES.length) % EXPLORATION_SLIDES.length)
              }
              aria-label="Banner anterior"
              className="w-7 h-7 rounded-full border border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#151A16] text-[#315C45] dark:text-[#86AD90] hover:bg-[#E5EEE6] dark:hover:bg-[#243228] inline-flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setSlideIdx((prev) => (prev + 1) % EXPLORATION_SLIDES.length)}
              aria-label="Próximo banner"
              className="w-7 h-7 rounded-full border border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#151A16] text-[#315C45] dark:text-[#86AD90] hover:bg-[#E5EEE6] dark:hover:bg-[#243228] inline-flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Transitioning Slide Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`copy-${activeSlide.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3"
              >
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C45] dark:text-[#86AD90]">
                  <span className="w-3.5 h-0.5 bg-[#315C45] dark:bg-[#86AD90] rounded-full inline-block" />
                  <span>{activeSlide.eyebrow}</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE] leading-snug">
                  {activeSlide.title}
                </h3>
                <p className="text-sm text-[#4E5A50] dark:text-[#A9B6AC] leading-relaxed max-w-2xl">
                  {activeSlide.description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <button
                type="button"
                onClick={() => triggerAction(activeSlide.actionKey)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap min-h-[40px] ${
                  activeSlide.actionKey === 'bottleneck'
                    ? 'bg-red-700 hover:bg-red-800 text-white dark:bg-red-700 dark:hover:bg-red-600'
                    : 'bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] text-white'
                }`}
              >
                {activeSlide.actionKey === 'bottleneck' && (
                  <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>{activeSlide.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {EXPLORATION_SLIDES.map((s, idx) => (
                  <button
                    key={`dot-${s.id}`}
                    type="button"
                    aria-label={`Ir para banner ${s.label}`}
                    onClick={() => setSlideIdx(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === slideIdx
                        ? 'w-6 bg-[#315C45] dark:bg-[#6AB087]'
                        : 'w-2 bg-[#DCE4DD] dark:bg-[#2A352D] hover:bg-[#6F9278]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[210px] sm:min-h-[240px] overflow-hidden bg-[#E5EEE6] dark:bg-[#151A16] border-t lg:border-t-0 lg:border-l border-[#DCE4DD] dark:border-[#2A352D]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${activeSlide.id}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <HardwareImage
                  src={activeSlide.image.src}
                  alt={activeSlide.image.alt}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#121613]/65 via-transparent to-transparent pointer-events-none"
            />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-xs z-10">
              <span className="font-medium text-[#E5EEE6]">{activeSlide.label}</span>
              <span className="font-mono text-[11px] text-white/80">
                0{slideIdx + 1} / 0{EXPLORATION_SLIDES.length}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3 Secondary Visual Feature Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickFeatureBanners.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={item.onClick}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2 }}
              className="group text-left rounded-[14px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#191F1B] hover:border-[#315C45] dark:hover:border-[#6F9278] transition-colors flex flex-col justify-between"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E5EEE6] dark:bg-[#151A16] border-b border-[#DCE4DD] dark:border-[#2A352D]">
                <HardwareImage
                  src={item.image.src}
                  alt={item.image.alt}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#121613]/70 via-transparent to-transparent"
                />
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 dark:bg-[#151A16]/90 text-[#315C45] dark:text-[#A3C7AD] backdrop-blur-xs border border-[#DCE4DD] dark:border-[#2A352D]">
                  <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>{item.badge}</span>
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#202521] dark:text-[#EEF2EE] group-hover:text-[#315C45] dark:group-hover:text-[#86AD90] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] leading-relaxed">
                    {item.phrase}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C45] dark:text-[#86AD90]">
                  <span>{item.cta}</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
