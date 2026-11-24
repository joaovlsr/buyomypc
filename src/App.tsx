import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Database,
  Moon,
  PlayCircle,
  SlidersHorizontal,
  Sun,
  TrendingUp,
} from 'lucide-react';
import {
  CPU_DATABASE,
  GPU_DATABASE,
  MOTHERBOARD_DATABASE,
  PSU_DATABASE,
  RAM_DATABASE,
  STORAGE_DATABASE,
} from './data/hardwareDatabase';
import {
  AnyHardwarePart,
  BuildGoal,
  HardwareCategory,
  SavedDiagnosticSnapshot,
  SelectedBuild,
  SimulationTierPlan,
} from './types/hardware';
import {
  analyzeBuild,
  createDiagnosticSnapshot,
  hydrateBuildFromIds,
} from './utils/pcAdvisor';
import { BrandMark } from './components/BrandMark';
import { BuildComparison } from './components/BuildComparison';
import { CatalogExplorer } from './components/CatalogExplorer';
import { DiagnosticAndRecommendations } from './components/DiagnosticAndRecommendations';
import { HardwarePickerModal } from './components/HardwarePickerModal';
import {
  HeroImageCarousel,
  HomeExplorationBanners,
} from './components/HeroShowcaseBanners';
import { SlotGrid } from './components/SlotGrid';
import { TelemetryStrip } from './components/TelemetryStrip';

const INITIAL_BUILD: SelectedBuild = {
  cpu: null,
  motherboard: MOTHERBOARD_DATABASE.find((m) => m.id === 'mb-b450m-steel') ?? null,
  gpu: null,
  ram: null,
  storage: null,
  psu: null,
};

const EMPTY_BUILD: SelectedBuild = {
  cpu: null,
  motherboard: null,
  gpu: null,
  ram: null,
  storage: null,
  psu: null,
};

const DIAGNOSTIC_STORAGE_KEY = 'buy-upgrade-diagnostic-v1';

function loadInitialBuildFromStorage(): SelectedBuild {
  if (typeof window === 'undefined') return INITIAL_BUILD;
  try {
    const raw = window.localStorage.getItem(DIAGNOSTIC_STORAGE_KEY);
    if (!raw) return INITIAL_BUILD;
    const parsed = JSON.parse(raw) as Partial<SavedDiagnosticSnapshot>;
    if (parsed && parsed.buildIds) {
      return hydrateBuildFromIds(parsed.buildIds);
    }
  } catch {
    // Fallback cleanly if storage is unavailable or corrupted
  }
  return INITIAL_BUILD;
}

type ActiveView = 'configurator' | 'comparison' | 'database';

interface PickerTarget {
  mode: 'current' | 'future';
  category: HardwareCategory;
}

function applyPartToBuild(prev: SelectedBuild, part: AnyHardwarePart): SelectedBuild {
  switch (part.category) {
    case HardwareCategory.CPU:
      return { ...prev, cpu: part };
    case HardwareCategory.MOTHERBOARD:
      return { ...prev, motherboard: part };
    case HardwareCategory.GPU:
      return { ...prev, gpu: part };
    case HardwareCategory.RAM:
      return { ...prev, ram: part };
    case HardwareCategory.STORAGE:
      return { ...prev, storage: part };
    case HardwareCategory.PSU:
      return { ...prev, psu: part };
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('configurator');
  const [build, setBuild] = useState<SelectedBuild>(() => loadInitialBuildFromStorage());
  const analysis = useMemo(() => analyzeBuild(build), [build]);
  const [savedDiagnostic, setSavedDiagnostic] = useState<SavedDiagnosticSnapshot>(() =>
    createDiagnosticSnapshot(build, analysis)
  );
  const [selectedSimulationGoal, setSelectedSimulationGoal] = useState<BuildGoal | 'custom'>(
    BuildGoal.BALANCED
  );
  const [futureBuild, setFutureBuild] = useState<SelectedBuild>(() => {
    const balancedPlan = savedDiagnostic.simulationPlans.find(
      (p) => p.goal === BuildGoal.BALANCED
    );
    return balancedPlan?.futureBuild ?? savedDiagnostic.simulationPlans[0]?.futureBuild ?? build;
  });
  const [isFutureCustomized, setIsFutureCustomized] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeConfigSection, setActiveConfigSection] = useState<
    'configurador' | 'diagnostico' | 'recomendacoes'
  >('configurador');
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const manualNavLockUntilRef = useRef<number>(0);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = window.localStorage.getItem('rigspec-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (activeView !== 'configurator') return;

    let rafId: number | null = null;

    const updateActiveSection = () => {
      rafId = null;
      if (Date.now() < manualNavLockUntilRef.current) return;

      const diagEl = document.getElementById('diagnostico');
      const recEl = document.getElementById('recomendacoes');
      if (!diagEl && !recEl) return;

      const scrollBottom = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (docHeight - scrollBottom <= 60 && recEl) {
        setActiveConfigSection('recomendacoes');
        return;
      }

      const threshold = Math.max(160, Math.min(300, window.innerHeight * 0.35));

      if (recEl && recEl.getBoundingClientRect().top <= threshold) {
        setActiveConfigSection('recomendacoes');
      } else if (diagEl && diagEl.getBoundingClientRect().top <= threshold) {
        setActiveConfigSection('diagnostico');
      } else {
        setActiveConfigSection('configurador');
      }
    };

    const onScroll = () => {
      if (rafId === null) {
        rafId = window.requestAnimationFrame(updateActiveSection);
      }
    };

    const mountTimer = window.setTimeout(updateActiveSection, 240);
    updateActiveSection();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.clearTimeout(mountTimer);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [activeView]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem('rigspec-theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures in restricted contexts
    }
  }, [isDark]);

  // Automatically save updated diagnostic snapshot whenever build or analysis updates
  useEffect(() => {
    const snapshot = createDiagnosticSnapshot(build, analysis);
    setSavedDiagnostic(snapshot);
    try {
      window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage quota/privacy mode errors
    }

    if (!isFutureCustomized) {
      const balancedPlan = snapshot.simulationPlans.find(
        (p) => p.goal === BuildGoal.BALANCED
      );
      const fallbackPlan = balancedPlan ?? snapshot.simulationPlans[0];
      if (fallbackPlan) {
        setFutureBuild(fallbackPlan.futureBuild);
        setSelectedSimulationGoal(fallbackPlan.goal);
      } else {
        setFutureBuild(build);
      }
    }
  }, [build, analysis, isFutureCustomized]);

  const handleSaveDiagnosticSnapshot = () => {
    const snapshot = createDiagnosticSnapshot(build, analysis);
    setSavedDiagnostic(snapshot);
    try {
      window.localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectPart = (part: AnyHardwarePart) => {
    if (pickerTarget?.mode === 'future') {
      setIsFutureCustomized(true);
      setSelectedSimulationGoal('custom');
      setFutureBuild((prev) => applyPartToBuild(prev, part));
      return;
    }
    setIsFutureCustomized(false);
    setBuild((prev) => applyPartToBuild(prev, part));
  };

  const handleClearSlot = (category: HardwareCategory) => {
    setIsFutureCustomized(false);
    setBuild((prev) => {
      switch (category) {
        case HardwareCategory.CPU:
          return { ...prev, cpu: null };
        case HardwareCategory.MOTHERBOARD:
          return { ...prev, motherboard: null };
        case HardwareCategory.GPU:
          return { ...prev, gpu: null };
        case HardwareCategory.RAM:
          return { ...prev, ram: null };
        case HardwareCategory.STORAGE:
          return { ...prev, storage: null };
        case HardwareCategory.PSU:
          return { ...prev, psu: null };
      }
    });
  };

  const handleApplyTierBuild = (suggestedBuild: SelectedBuild) => {
    setIsFutureCustomized(false);
    setBuild(suggestedBuild);
  };

  const handleCompareTierBuild = (suggestedBuild: SelectedBuild, goal?: BuildGoal) => {
    handleSaveDiagnosticSnapshot();
    setFutureBuild(suggestedBuild);
    setSelectedSimulationGoal(goal ?? 'custom');
    setIsFutureCustomized(true);
    setActiveView('comparison');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSimulationPlan = (plan: SimulationTierPlan) => {
    setFutureBuild(plan.futureBuild);
    setSelectedSimulationGoal(plan.goal);
    setIsFutureCustomized(true);
  };

  const handleAdoptFutureBuild = () => {
    setBuild(futureBuild);
    setIsFutureCustomized(false);
    setSelectedSimulationGoal(BuildGoal.BALANCED);
    setActiveView('configurator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchView = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateConfiguratorSection = (
    sectionId: 'configurador' | 'diagnostico' | 'recomendacoes'
  ) => {
    const switchingTab = activeView !== 'configurator';
    manualNavLockUntilRef.current = Date.now() + 750;
    setActiveView('configurator');
    setActiveConfigSection(sectionId);
    window.setTimeout(
      () => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      },
      switchingTab ? 220 : 40
    );
  };

  const loadPreset = (preset: 'empty' | 'bottleneck-demo') => {
    setActiveView('configurator');
    setIsFutureCustomized(false);
    if (preset === 'empty') {
      setBuild(EMPTY_BUILD);
      return;
    }
    if (preset === 'bottleneck-demo') {
      setBuild({
        cpu: CPU_DATABASE.find((c) => c.id === 'cpu-r5-3400g') ?? null,
        motherboard: MOTHERBOARD_DATABASE.find((m) => m.id === 'mb-b550m-aorus') ?? null,
        gpu: GPU_DATABASE.find((g) => g.id === 'gpu-rtx-4080-super') ?? null,
        ram: RAM_DATABASE.find((r) => r.id === 'ram-ddr4-16-3200') ?? null,
        storage: STORAGE_DATABASE.find((s) => s.id === 'sto-hdd-barracuda-1tb') ?? null,
        psu: PSU_DATABASE.find((p) => p.id === 'psu-500-bronze') ?? null,
      });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F6F7F3] dark:bg-[#121613] text-[#202521] dark:text-[#EEF2EE] transition-colors">
        {/* Top Navigation Bar — Modern frosted floating effect with sliding active pill */}
        <header
          className={`sticky top-0 z-30 transition-all duration-300 ${
            isScrolled
              ? 'bg-white/85 dark:bg-[#121613]/88 backdrop-blur-xl border-b border-[#315C45]/20 dark:border-[#6F9278]/25 shadow-[0_10px_30px_-14px_rgba(32,37,33,0.16)] dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.55)]'
              : 'bg-white/72 dark:bg-[#121613]/72 backdrop-blur-md border-b border-[#DCE4DD]/85 dark:border-[#2A352D]/85'
          }`}
        >
          <div
            className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-[height] duration-300 ${
              isScrolled ? 'h-16' : 'h-[70px]'
            }`}
          >
            {/* Brand Logo + Subtle Modern Container */}
            <button
              type="button"
              onClick={() => navigateConfiguratorSection('configurador')}
              className="group inline-flex items-center gap-3 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] rounded-[12px] py-1 pr-2"
            >
              <span className="w-9 h-9 rounded-[11px] bg-[#E5EEE6]/90 dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] group-hover:border-[#315C45]/45 dark:group-hover:border-[#86AD90]/50 group-hover:bg-[#E5EEE6] dark:group-hover:bg-[#233227] inline-flex items-center justify-center transition-all duration-200 shadow-2xs group-hover:-translate-y-0.5">
                <BrandMark className="w-6 h-6 transition-transform duration-200 group-hover:scale-105" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-base sm:text-[17px] font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE] font-display group-hover:text-[#315C45] dark:group-hover:text-[#A3C7AD] transition-colors">
                  Buy or Upgrade my pc
                </span>
                <span className="hidden xl:block text-[10px] font-medium tracking-wide text-[#5C675E] dark:text-[#98A69B] mt-0.5">
                  Evolua seu setup.
                </span>
              </span>
            </button>

            {/* Segmented Pill Navigation with Spring Sliding Active & Hover Indicator */}
            <nav
              aria-label="Navegação principal"
              onMouseLeave={() => setHoveredNav(null)}
              className="hidden lg:flex items-center gap-0.5 p-1 rounded-full bg-[#F6F7F3]/95 dark:bg-[#181E1A]/95 border border-[#DCE4DD] dark:border-[#2A352D] shadow-2xs"
            >
              {[
                {
                  id: 'configurador',
                  label: 'Início',
                  isActive: activeView === 'configurator' && activeConfigSection === 'configurador',
                  onClick: () => navigateConfiguratorSection('configurador'),
                },
                {
                  id: 'diagnostico',
                  label: 'Diagnóstico',
                  isActive: activeView === 'configurator' && activeConfigSection === 'diagnostico',
                  onClick: () => navigateConfiguratorSection('diagnostico'),
                },
                {
                  id: 'recomendacoes',
                  label: 'Recomendações',
                  isActive: activeView === 'configurator' && activeConfigSection === 'recomendacoes',
                  onClick: () => navigateConfiguratorSection('recomendacoes'),
                },
                {
                  id: 'comparison',
                  label: 'Comparativo',
                  isActive: activeView === 'comparison',
                  onClick: () => switchView('comparison'),
                },
                {
                  id: 'database',
                  label: 'Base de Dados',
                  isActive: activeView === 'database',
                  onClick: () => switchView('database'),
                },
              ].map((item) => {
                const isHovered = hoveredNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setHoveredNav(item.id)}
                    onClick={item.onClick}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs xl:text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] ${
                      item.isActive
                        ? 'text-white font-semibold'
                        : 'text-[#4E5A50] dark:text-[#A9B6AC] hover:text-[#202521] dark:hover:text-[#EEF2EE]'
                    }`}
                  >
                    {isHovered && !item.isActive && (
                      <motion.span
                        layoutId="header-nav-hover"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        className="absolute inset-0 rounded-full bg-[#E5EEE6]/85 dark:bg-[#232F27]"
                        aria-hidden="true"
                      />
                    )}
                    {item.isActive && (
                      <motion.span
                        layoutId="header-nav-active"
                        transition={{ type: 'spring', stiffness: 420, damping: 33 }}
                        className="absolute inset-0 rounded-full bg-[#315C45] dark:bg-[#3B6E52] shadow-xs"
                        aria-hidden="true"
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => loadPreset('empty')}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] rounded-full shadow-2xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 min-h-[38px]"
              >
                Limpar Montagem
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Workspace Utility Strip (Mobile Switcher + Mockup Search Pill + Compare + Dark Mode) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCE4DD] dark:border-[#2A352D]">
            <div className="flex lg:hidden items-center gap-1 p-1 bg-[#E5EEE6] dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] rounded-full">
              <button
                type="button"
                onClick={() => switchView('configurator')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeView === 'configurator'
                    ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                    : 'text-[#315C45] dark:text-[#A3C7AD]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Setup</span>
              </button>
              <button
                type="button"
                onClick={() => switchView('comparison')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeView === 'comparison'
                    ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                    : 'text-[#315C45] dark:text-[#A3C7AD]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Comparativo</span>
              </button>
              <button
                type="button"
                onClick={() => switchView('database')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
                  activeView === 'database'
                    ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                    : 'text-[#315C45] dark:text-[#A3C7AD]'
                }`}
              >
                <Database className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Base</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {activeView === 'configurator' && (
                <button
                  type="button"
                  onClick={() => switchView('comparison')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#315C45] dark:text-[#A3C7AD] bg-white dark:bg-[#191F1B] border border-[#315C45]/45 dark:border-[#6F9278]/50 rounded-full hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821] hover:border-[#315C45] transition-colors whitespace-nowrap shrink-0"
                >
                  <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Comparar Build Atual × Futura</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo noturno'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#202521] dark:text-[#EEF2EE] bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-full hover:bg-[#E5EEE6]/60 dark:hover:bg-[#1E2821] transition-colors whitespace-nowrap shrink-0"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#315C45]" aria-hidden="true" />
                    <span>Modo Noturno</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeView === 'database' ? (
              <motion.div
                key="view-database"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <CatalogExplorer
                  build={build}
                  onApplyPart={(part) => setBuild((prev) => applyPartToBuild(prev, part))}
                  onBackToConfigurator={() => switchView('configurator')}
                />
              </motion.div>
            ) : activeView === 'comparison' ? (
              <motion.div
                key="view-comparison"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <BuildComparison
                  currentBuild={build}
                  currentAnalysis={analysis}
                  savedDiagnostic={savedDiagnostic}
                  futureBuild={futureBuild}
                  activeSimulationGoal={selectedSimulationGoal}
                  onSelectSimulationPlan={handleSelectSimulationPlan}
                  onOpenFuturePicker={(category) =>
                    setPickerTarget({ mode: 'future', category })
                  }
                  onAdoptFutureBuild={handleAdoptFutureBuild}
                  onBackToConfigurator={() => switchView('configurator')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="view-configurator"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                {/* Hero Section & Configurator (Mockup-aligned diagonal sage stage + attached 4-col bar) */}
                <section id="configurador" className="scroll-mt-24 space-y-10">
                  <div className="rounded-[18px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-[#F1F5F1] dark:bg-[#171E19] shadow-xs">
                    <div className="relative overflow-hidden p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      {/* Diagonal Natural Technology Geometric Ribbons */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-24 right-12 w-80 h-[440px] rotate-[24deg] bg-[#E5EEE6] dark:bg-[#1E2921] rounded-[32px]"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-24 -right-10 w-64 h-80 rotate-[24deg] bg-[#D6E4D8]/70 dark:bg-[#253328]/70 rounded-[32px]"
                      />

                      <div className="lg:col-span-7 relative z-10 space-y-5">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#E5EEE6] dark:bg-[#1E2821] text-[#315C45] dark:text-[#A3C7AD] border border-[#DCE4DD] dark:border-[#2A352D]">
                          <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Plataforma de upgrades</span>
                        </span>

                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE] leading-[1.08] text-balance">
                          Seu PC ainda pode ir{' '}
                          <span className="text-[#315C45] dark:text-[#6AB087]">mais longe.</span>
                        </h1>

                        <p className="text-sm sm:text-base text-[#4E5A50] dark:text-[#A9B6AC] leading-relaxed max-w-xl">
                          Informe ao menos sua Placa-mãe, CPU ou GPU a partir da base verificada para receber recomendações inteligentes de 3 configurações completas compatíveis e sem gargalos.
                        </p>

                        {/* Mockup Pill Primary CTA + Secondary Actions */}
                        <div className="pt-1 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              document
                                .getElementById('slots-configurador')
                                ?.scrollIntoView({ behavior: 'smooth' })
                            }
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] rounded-full transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                          >
                            <span>Descobrir meu upgrade</span>
                            <ArrowRight className="w-4 h-4" aria-hidden="true" />
                          </button>

                          <button
                            type="button"
                            onClick={() => switchView('database')}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-[#202521] dark:text-[#EEF2EE] hover:text-[#315C45] dark:hover:text-[#A3C7AD] rounded-full transition-colors whitespace-nowrap shrink-0 min-h-[42px]"
                          >
                            <PlayCircle className="w-4 h-4 text-[#315C45] dark:text-[#86AD90]" aria-hidden="true" />
                            <span className="underline underline-offset-4 decoration-[#DCE4DD] dark:decoration-[#2A352D]">
                              Abrir Base de Dados
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => loadPreset('bottleneck-demo')}
                            className="px-3.5 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50/90 dark:bg-red-950/40 border border-red-200 dark:border-red-800/70 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                          >
                            Simular Conflito / Gargalo
                          </button>
                        </div>
                      </div>

                      {/* Right: Transitioning Natural Technology Workstation Showcase */}
                      <div className="lg:col-span-5 relative z-10">
                        <HeroImageCarousel />
                      </div>
                    </div>

                    {/* 4-Column Engineering Strip docked seamlessly at Hero bottom */}
                    <div className="border-t border-[#DCE4DD] dark:border-[#2A352D] bg-white/90 dark:bg-[#191F1B]">
                      <TelemetryStrip analysis={analysis} build={build} seamless />
                    </div>
                  </div>

                  {/* Interactive Multi-Banner Exploration Showcase */}
                  <HomeExplorationBanners
                    onScrollToSlots={() =>
                      document
                        .getElementById('slots-configurador')
                        ?.scrollIntoView({ behavior: 'smooth' })
                    }
                    onSimulateBottleneck={() => loadPreset('bottleneck-demo')}
                    onOpenComparison={() => switchView('comparison')}
                    onOpenDatabase={() => switchView('database')}
                  />

                  {/* Mockup Categorias Section Header + 5-Card Hardware Builder */}
                  <div id="slots-configurador" className="scroll-mt-24 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#315C45] dark:text-[#86AD90]">
                          <span className="w-4 h-0.5 bg-[#315C45] dark:bg-[#86AD90] rounded-full inline-block" />
                          <span>Categorias</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE]">
                          Encontre o upgrade ideal para você.
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={() => switchView('database')}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#315C45] dark:text-[#A3C7AD] hover:text-[#264836] dark:hover:text-white transition-colors self-start sm:self-auto"
                      >
                        <span className="underline underline-offset-4">Ver todas as categorias</span>
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <SlotGrid
                      build={build}
                      analysis={analysis}
                      onOpenPicker={(category) =>
                        setPickerTarget({ mode: 'current', category })
                      }
                      onClearSlot={handleClearSlot}
                    />
                  </div>
                </section>

                {/* Diagnostics & 3-Tier Complete Suggestions */}
                <DiagnosticAndRecommendations
                  build={build}
                  analysis={analysis}
                  onApplyPart={(part) => {
                    setIsFutureCustomized(false);
                    setBuild((prev) => applyPartToBuild(prev, part));
                  }}
                  onApplyTierBuild={handleApplyTierBuild}
                  onCompareTierBuild={handleCompareTierBuild}
                  onSaveDiagnostic={handleSaveDiagnosticSnapshot}
                  onOpenComparison={() => switchView('comparison')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#191F1B] mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5C675E] dark:text-[#98A69B]">
            <span className="inline-flex items-center gap-2 font-medium text-[#202521] dark:text-[#EEF2EE]">
              <BrandMark className="w-5 h-5 shrink-0" />
              <span>Buy or Upgrade my pc · Evolua seu setup.</span>
            </span>
            <span>Especificações de compatibilidade, sockets, chipsets e consumo elétrico de referência</span>
          </div>
        </footer>

        {/* Searchable Hardware Selection Modal (Current Build or Future Build) */}
        <HardwarePickerModal
          category={pickerTarget?.category ?? null}
          build={pickerTarget?.mode === 'future' ? futureBuild : build}
          titlePrefix={pickerTarget?.mode === 'future' ? 'Build Futura:' : 'Selecionar'}
          onSelect={handleSelectPart}
          onClose={() => setPickerTarget(null)}
        />
      </div>
    </MotionConfig>
  );
}
