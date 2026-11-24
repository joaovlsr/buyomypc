import { useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  BuildAnalysis,
  BuildGoal,
  ChangeActionType,
  HardwareCategory,
  PlannedChangeItem,
  SavedDiagnosticSnapshot,
  SelectedBuild,
  SimulationTierPlan,
} from '../types/hardware';
import {
  analyzeBuild,
  buildPlannedChanges,
  calculatePowerBudget,
  formatStorageCapacity,
} from '../utils/pcAdvisor';
import { CATEGORY_SHORT_LABELS, HardwareIcon } from './HardwareIcon';
import {
  BANNER_IMAGES,
  HARDWARE_CATEGORY_IMAGES,
  HardwareImage,
} from './HardwareVisuals';

interface BuildComparisonProps {
  currentBuild: SelectedBuild;
  currentAnalysis: BuildAnalysis;
  savedDiagnostic: SavedDiagnosticSnapshot;
  futureBuild: SelectedBuild;
  activeSimulationGoal: BuildGoal | 'custom';
  onSelectSimulationPlan: (plan: SimulationTierPlan) => void;
  onOpenFuturePicker: (category: HardwareCategory) => void;
  onAdoptFutureBuild: () => void;
  onBackToConfigurator: () => void;
}

interface MetricBar {
  id: string;
  label: string;
  currentValue: number;
  futureValue: number;
  currentLabel: string;
  futureLabel: string;
}

function getGpuEffectiveScore(build: SelectedBuild): number {
  if (build.gpu) return build.gpu.tierScore;
  if (build.cpu?.integratedGpu) return 11;
  return 0;
}

function getPlatformScore(build: SelectedBuild): number {
  if (!build.motherboard && !build.cpu) return 0;
  const vrm = build.motherboard?.vrmTier ?? 50;
  const pcie = build.motherboard?.pcieGen ?? build.cpu?.pcieGen ?? 3;
  const pcieBonus = pcie === 5 ? 20 : pcie === 4 ? 12 : 4;
  return Math.min(100, Math.round(vrm * 0.8 + pcieBonus));
}

function getPsuHeadroomScore(build: SelectedBuild): number {
  if (!build.psu) return 0;
  const { estimatedLoadWatts, recommendedPsuWatts } = calculatePowerBudget(build.cpu, build.gpu);
  if (estimatedLoadWatts === 0) return Math.min(100, Math.round(build.psu.wattage / 10));
  if (build.psu.wattage < estimatedLoadWatts) return 15;
  if (build.psu.wattage < recommendedPsuWatts) return 45;
  const ratio = build.psu.wattage / Math.max(1, recommendedPsuWatts);
  return Math.min(100, Math.round(68 + (ratio - 1) * 60 + (build.psu.atx3 ? 10 : 0)));
}

function formatDeltaPercent(current: number, future: number): string {
  if (current === 0 && future === 0) return '0%';
  if (current === 0 && future > 0) return 'Novo';
  const pct = Math.round(((future - current) / current) * 100);
  if (pct > 0) return `+${pct}%`;
  return `${pct}%`;
}

function getDeltaPercentValue(current: number, future: number): number | null {
  if (current === 0 && future > 0) return null;
  if (current === 0 && future === 0) return 0;
  return Math.round(((future - current) / current) * 100);
}

function AnimatedMetricNumber({
  from = 0,
  to,
  prefix = '',
  suffix = '',
  duration = 0.75,
  className = '',
}: {
  from?: number;
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => (prefersReducedMotion ? to : from));

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(to);
      return;
    }
    if (!isInView) {
      setDisplay(from);
      return;
    }

    setDisplay(from);
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [from, to, duration, prefersReducedMotion, isInView]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

function RadarComparisonChart({
  axes,
}: {
  axes: { label: string; current: number; future: number }[];
}) {
  const [hoveredAxis, setHoveredAxis] = useState<number | null>(null);
  const size = 320;
  const center = size / 2;
  const radius = 104;
  const levels = [25, 50, 75, 100];

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = (Math.max(4, Math.min(100, value)) / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const toPolygonPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const pt = getPoint(i, v);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  const currentPoly = toPolygonPoints(axes.map((a) => a.current));
  const futurePoly = toPolygonPoints(axes.map((a) => a.future));

  return (
    <div className="flex flex-col items-center justify-between h-full gap-4">
      <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Gráfico radar comparando Build Atual e Build Futura"
        >
          {/* Concentric polygons */}
          {levels.map((lvl) => (
            <polygon
              key={lvl}
              points={toPolygonPoints(axes.map(() => lvl))}
              fill="none"
              className="stroke-[#DCE4DD] dark:stroke-[#2A352D]"
              strokeWidth={1}
            />
          ))}

          {/* Axis spokes & labels */}
          {axes.map((axis, i) => {
            const outer = getPoint(i, 100);
            const labelPos = getPoint(i, 126);
            return (
              <g
                key={axis.label}
                onMouseEnter={() => setHoveredAxis(i)}
                onMouseLeave={() => setHoveredAxis(null)}
                className="cursor-pointer"
              >
                <line
                  x1={center}
                  y1={center}
                  x2={outer.x}
                  y2={outer.y}
                  className="stroke-[#DCE4DD] dark:stroke-[#2A352D]"
                  strokeWidth={1}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    hoveredAxis === i
                      ? 'fill-[#315C45] dark:fill-[#86AD90] font-semibold'
                      : 'fill-[#4E5A50] dark:fill-[#A9B6AC]'
                  }`}
                >
                  {axis.label}
                </text>
              </g>
            );
          })}

          {/* Current Build Polygon */}
          <motion.polygon
            points={currentPoly}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fill-[#6F9278]/15 stroke-[#6F9278] dark:fill-[#86AD90]/15 dark:stroke-[#86AD90]"
            strokeWidth={2}
            strokeDasharray="4 3"
          />

          {/* Future Build Polygon */}
          <motion.polygon
            points={futurePoly}
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${center}px ${center}px` }}
            className="fill-[#315C45]/20 stroke-[#315C45] dark:fill-[#5B9B76]/25 dark:stroke-[#6AB087]"
            strokeWidth={2.25}
          />

          {/* Data vertices */}
          {axes.map((axis, i) => {
            const cPt = getPoint(i, axis.current);
            const fPt = getPoint(i, axis.future);
            return (
              <g key={`pts-${axis.label}`}>
                <circle
                  cx={cPt.x}
                  cy={cPt.y}
                  r={3.5}
                  className="fill-[#6F9278] dark:fill-[#86AD90]"
                />
                <circle
                  cx={fPt.x}
                  cy={fPt.y}
                  r={4}
                  className="fill-[#315C45] dark:fill-[#6AB087] stroke-white dark:stroke-[#191F1B]"
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Axis Readout + Legend */}
      <div className="w-full space-y-2.5 pt-2 border-t border-[#DCE4DD] dark:border-[#2A352D]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[#4E5A50] dark:text-[#A9B6AC]">
              <span className="w-3 h-0.5 bg-[#6F9278] dark:bg-[#86AD90] inline-block" />
              Build Atual
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#315C45] dark:text-[#86AD90] font-semibold">
              <span className="w-3 h-0.5 bg-[#315C45] dark:bg-[#6AB087] inline-block" />
              Build Futura
            </span>
          </div>
          {hoveredAxis !== null && (
            <span className="font-mono tabular-nums text-[#202521] dark:text-[#EEF2EE]">
              {axes[hoveredAxis].label}: {axes[hoveredAxis].current} → {axes[hoveredAxis].future}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const ACTION_STYLES: Record<
  ChangeActionType,
  { badge: string; label: string; border: string }
> = {
  replace_conflict: {
    badge: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/70',
    label: 'Corrigir Conflito',
    border: 'border-red-200/80 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20',
  },
  upgrade: {
    badge: 'bg-[#315C45] text-white dark:bg-[#3B6E52]',
    label: 'Fazer Upgrade',
    border: 'border-[#315C45]/30 dark:border-[#6F9278]/40 bg-[#E5EEE6]/45 dark:bg-[#1E2B22]/60',
  },
  add: {
    badge: 'bg-[#E5EEE6] dark:bg-[#233629] text-[#315C45] dark:text-[#A3C7AD] border border-[#315C45]/30',
    label: 'Adicionar Peça',
    border: 'border-[#DCE4DD] dark:border-[#2A352D] bg-[#F6F7F3]/80 dark:bg-[#151A16]/70',
  },
  keep: {
    badge: 'bg-[#F6F7F3] dark:bg-[#222A24] text-[#5C675E] dark:text-[#98A69B] border border-[#DCE4DD] dark:border-[#2A352D]',
    label: 'Manter Atual',
    border: 'border-[#DCE4DD] dark:border-[#2A352D] bg-white dark:bg-[#191F1B]',
  },
};

export function BuildComparison({
  currentBuild,
  currentAnalysis,
  savedDiagnostic,
  futureBuild,
  activeSimulationGoal,
  onSelectSimulationPlan,
  onOpenFuturePicker,
  onAdoptFutureBuild,
  onBackToConfigurator,
}: BuildComparisonProps) {
  const futureAnalysis = useMemo(() => analyzeBuild(futureBuild), [futureBuild]);

  const cpuCurr = currentBuild.cpu?.tierScore ?? 0;
  const cpuFut = futureBuild.cpu?.tierScore ?? 0;
  const gpuCurr = getGpuEffectiveScore(currentBuild);
  const gpuFut = getGpuEffectiveScore(futureBuild);
  const ramCurr = currentBuild.ram?.tierScore ?? 0;
  const ramFut = futureBuild.ram?.tierScore ?? 0;
  const stoCurr = currentBuild.storage?.tierScore ?? 0;
  const stoFut = futureBuild.storage?.tierScore ?? 0;
  const platCurr = getPlatformScore(currentBuild);
  const platFut = getPlatformScore(futureBuild);
  const psuCurr = getPsuHeadroomScore(currentBuild);
  const psuFut = getPsuHeadroomScore(futureBuild);

  const metricBars: MetricBar[] = [
    {
      id: 'cpu',
      label: 'Processamento (CPU)',
      currentValue: cpuCurr,
      futureValue: cpuFut,
      currentLabel: currentBuild.cpu
        ? `${currentBuild.cpu.cores}C/${currentBuild.cpu.threads}T · Índice ${cpuCurr}`
        : 'Sem CPU',
      futureLabel: futureBuild.cpu
        ? `${futureBuild.cpu.cores}C/${futureBuild.cpu.threads}T · Índice ${cpuFut}`
        : 'Sem CPU',
    },
    {
      id: 'gpu',
      label: 'Poder Gráfico (GPU)',
      currentValue: gpuCurr,
      futureValue: gpuFut,
      currentLabel: currentBuild.gpu
        ? `${currentBuild.gpu.vramGB}GB VRAM · Índice ${gpuCurr}`
        : currentBuild.cpu?.integratedGpu
          ? `Integrado (${currentBuild.cpu.integratedGpu}) · Índice ${gpuCurr}`
          : 'Sem GPU',
      futureLabel: futureBuild.gpu
        ? `${futureBuild.gpu.vramGB}GB VRAM · Índice ${gpuFut}`
        : futureBuild.cpu?.integratedGpu
          ? `Integrado (${futureBuild.cpu.integratedGpu}) · Índice ${gpuFut}`
          : 'Sem GPU',
    },
    {
      id: 'ram',
      label: 'Memória RAM',
      currentValue: ramCurr,
      futureValue: ramFut,
      currentLabel: currentBuild.ram
        ? `${currentBuild.ram.capacityGB}GB ${currentBuild.ram.type} ${currentBuild.ram.speedMTs}MT/s`
        : 'Sem RAM',
      futureLabel: futureBuild.ram
        ? `${futureBuild.ram.capacityGB}GB ${futureBuild.ram.type} ${futureBuild.ram.speedMTs}MT/s`
        : 'Sem RAM',
    },
    {
      id: 'storage',
      label: 'Armazenamento (HD / SSD / NVMe)',
      currentValue: stoCurr,
      futureValue: stoFut,
      currentLabel: currentBuild.storage
        ? `${currentBuild.storage.storageType} ${formatStorageCapacity(currentBuild.storage.capacityGB)} · ${currentBuild.storage.readMBs} MB/s`
        : 'Sem Armazenamento',
      futureLabel: futureBuild.storage
        ? `${futureBuild.storage.storageType} ${formatStorageCapacity(futureBuild.storage.capacityGB)} · ${futureBuild.storage.readMBs} MB/s`
        : 'Sem Armazenamento',
    },
    {
      id: 'platform',
      label: 'Plataforma (VRM e PCIe)',
      currentValue: platCurr,
      futureValue: platFut,
      currentLabel: currentBuild.motherboard
        ? `${currentBuild.motherboard.chipset} · PCIe ${currentBuild.motherboard.pcieGen}.0`
        : 'Sem Placa-mãe',
      futureLabel: futureBuild.motherboard
        ? `${futureBuild.motherboard.chipset} · PCIe ${futureBuild.motherboard.pcieGen}.0`
        : 'Sem Placa-mãe',
    },
  ];

  const radarAxes = [
    { label: 'CPU', current: cpuCurr, future: cpuFut },
    { label: 'GPU', current: gpuCurr, future: gpuFut },
    { label: 'Memória', current: ramCurr, future: ramFut },
    { label: 'Armaz.', current: stoCurr, future: stoFut },
    { label: 'Plataforma', current: platCurr, future: platFut },
    { label: 'Energia', current: psuCurr, future: psuFut },
  ];

  const currComposite =
    cpuCurr === 0 && gpuCurr === 0
      ? 0
      : Math.round(cpuCurr * 0.4 + gpuCurr * 0.44 + ramCurr * 0.1 + stoCurr * 0.06);
  const futComposite =
    cpuFut === 0 && gpuFut === 0
      ? 0
      : Math.round(cpuFut * 0.4 + gpuFut * 0.44 + ramFut * 0.1 + stoFut * 0.06);
  const overallGainPct = getDeltaPercentValue(currComposite, futComposite);

  const futureHasError = futureAnalysis.compatibilityStatus === 'error';
  const simulationPlans = savedDiagnostic.simulationPlans;

  const activePlan = useMemo(
    () => simulationPlans.find((p) => p.goal === activeSimulationGoal) ?? null,
    [simulationPlans, activeSimulationGoal]
  );

  const plannedChanges: PlannedChangeItem[] = useMemo(() => {
    if (activePlan) return activePlan.changes;
    return buildPlannedChanges(currentBuild, currentAnalysis, futureBuild);
  }, [activePlan, currentBuild, currentAnalysis, futureBuild]);

  const changeByCategory = useMemo(
    () => new Map(plannedChanges.map((item) => [item.category, item])),
    [plannedChanges]
  );

  const comparisonSlots: {
    category: HardwareCategory;
    currName: string;
    futName: string;
    changed: boolean;
    currScore: number;
    futScore: number;
    gainPct: number | null;
    action?: ChangeActionType;
  }[] = [
    {
      category: HardwareCategory.MOTHERBOARD,
      currName: currentBuild.motherboard?.name ?? 'Não selecionada',
      futName: futureBuild.motherboard?.name ?? 'Não selecionada',
      changed: currentBuild.motherboard?.id !== futureBuild.motherboard?.id,
      currScore: platCurr,
      futScore: platFut,
      gainPct: getDeltaPercentValue(platCurr, platFut),
      action: changeByCategory.get(HardwareCategory.MOTHERBOARD)?.action,
    },
    {
      category: HardwareCategory.CPU,
      currName: currentBuild.cpu?.name ?? 'Não selecionado',
      futName: futureBuild.cpu?.name ?? 'Não selecionado',
      changed: currentBuild.cpu?.id !== futureBuild.cpu?.id,
      currScore: cpuCurr,
      futScore: cpuFut,
      gainPct: getDeltaPercentValue(cpuCurr, cpuFut),
      action: changeByCategory.get(HardwareCategory.CPU)?.action,
    },
    {
      category: HardwareCategory.GPU,
      currName:
        currentBuild.gpu?.name ??
        (currentBuild.cpu?.integratedGpu
          ? `Vídeo integrado (${currentBuild.cpu.integratedGpu})`
          : 'Não selecionada'),
      futName:
        futureBuild.gpu?.name ??
        (futureBuild.cpu?.integratedGpu
          ? `Vídeo integrado (${futureBuild.cpu.integratedGpu})`
          : 'Não selecionada'),
      changed: currentBuild.gpu?.id !== futureBuild.gpu?.id,
      currScore: gpuCurr,
      futScore: gpuFut,
      gainPct: getDeltaPercentValue(gpuCurr, gpuFut),
      action: changeByCategory.get(HardwareCategory.GPU)?.action,
    },
    {
      category: HardwareCategory.RAM,
      currName: currentBuild.ram?.name ?? 'Não selecionada',
      futName: futureBuild.ram?.name ?? 'Não selecionada',
      changed: currentBuild.ram?.id !== futureBuild.ram?.id,
      currScore: ramCurr,
      futScore: ramFut,
      gainPct: getDeltaPercentValue(ramCurr, ramFut),
      action: changeByCategory.get(HardwareCategory.RAM)?.action,
    },
    {
      category: HardwareCategory.STORAGE,
      currName: currentBuild.storage?.name ?? 'Não selecionado',
      futName: futureBuild.storage?.name ?? 'Não selecionado',
      changed: currentBuild.storage?.id !== futureBuild.storage?.id,
      currScore: stoCurr,
      futScore: stoFut,
      gainPct: getDeltaPercentValue(stoCurr, stoFut),
      action: changeByCategory.get(HardwareCategory.STORAGE)?.action,
    },
    {
      category: HardwareCategory.PSU,
      currName: currentBuild.psu?.name ?? 'Não selecionada',
      futName: futureBuild.psu?.name ?? 'Não selecionada',
      changed: currentBuild.psu?.id !== futureBuild.psu?.id,
      currScore: psuCurr,
      futScore: psuFut,
      gainPct: getDeltaPercentValue(psuCurr, psuFut),
      action: changeByCategory.get(HardwareCategory.PSU)?.action,
    },
  ];

  const actionableChanges = plannedChanges.filter((c) => c.action !== 'keep');
  const keptParts = plannedChanges.filter((c) => c.action === 'keep');

  return (
    <section aria-label="Comparativo Build Atual e Build Futura" className="space-y-8">
      {/* Window Header Banner */}
      <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <button
              type="button"
              onClick={onBackToConfigurator}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C45] dark:text-[#86AD90] hover:text-[#264836] dark:hover:text-[#A3C7AD] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Voltar ao Configurador</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE]">
              Comparativo: Build Atual × Build Futura
            </h1>
            <p className="text-sm text-[#4E5A50] dark:text-[#A9B6AC] max-w-2xl">
              Sua build atual do configurador ({currentAnalysis.selectedCount}/6 peças) e o diagnóstico salvo já estão carregados abaixo. Selecione um perfil para simular as mudanças exatas recomendadas.
            </p>
          </div>

          {/* Preset future targets based on saved diagnostic + Adopt button */}
          <div className="flex flex-wrap items-center gap-2">
            {simulationPlans.map((plan) => {
              const isActive = activeSimulationGoal === plan.goal;
              return (
                <button
                  key={plan.goal}
                  type="button"
                  onClick={() => onSelectSimulationPlan(plan)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-full transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
                    isActive
                      ? 'bg-[#315C45] text-white dark:bg-[#3B6E52] shadow-xs ring-2 ring-[#315C45]/25'
                      : 'text-[#315C45] dark:text-[#A3C7AD] bg-[#F6F7F3] dark:bg-[#1E2821] border border-[#315C45]/40 dark:border-[#6F9278]/50 hover:bg-[#E5EEE6] dark:hover:bg-[#243228] hover:border-[#315C45]'
                  }`}
                >
                  Simular {plan.title}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onAdoptFutureBuild}
              className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-[#202521] hover:bg-[#313832] dark:bg-[#2A352D] dark:hover:bg-[#36443A] rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <span>Aplicar Build Futura no Setup</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 relative rounded-[10px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-[#E5EEE6] dark:bg-[#1E2821] aspect-[16/9] lg:aspect-auto lg:min-h-[180px]">
          <HardwareImage
            src={BANNER_IMAGES.upgradeBench.src}
            alt={BANNER_IMAGES.upgradeBench.alt}
            loading="eager"
            className="w-full h-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#121613]/80 via-[#121613]/15 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#C6DBC9]">
              Planejamento de Upgrade
            </p>
            <p className="text-xs sm:text-sm font-semibold leading-snug mt-0.5">
              Compare ganhos reais antes de atualizar
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Component Diff Table — Placed immediately below Comparativo header */}
      <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] overflow-hidden">
        <div className="px-6 py-4 bg-[#E5EEE6]/70 dark:bg-[#1E2821] border-b border-[#DCE4DD] dark:border-[#2A352D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#202521] dark:text-[#EEF2EE]">
              Peça por Peça: Atual vs Futura
            </h2>
            <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC]">
              Personalize qualquer componente da Build Futura para simular o impacto nos indicadores e gráficos abaixo
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {overallGainPct !== null && overallGainPct > 0 ? (
              <motion.div
                key={`overall-gain-${overallGainPct}-${futComposite}`}
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#315C45] text-white dark:bg-[#3B6E52] text-xs font-semibold shadow-xs"
              >
                <motion.span
                  initial={{ y: 3, opacity: 0.5 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center"
                >
                  <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                </motion.span>
                <span>Ganho geral:</span>
                <AnimatedMetricNumber
                  from={0}
                  to={overallGainPct}
                  prefix="+"
                  suffix="%"
                  duration={0.85}
                  className="font-bold"
                />
              </motion.div>
            ) : overallGainPct === null && futComposite > 0 ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.94 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#315C45] text-white dark:bg-[#3B6E52] text-xs font-semibold"
              >
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Setup Completo Planejado</span>
              </motion.span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#151A16] border border-[#DCE4DD] dark:border-[#2A352D] text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
                <span>Índice estável</span>
              </span>
            )}
          </div>
        </div>

        <div className="divide-y divide-[#DCE4DD] dark:divide-[#2A352D]">
          {comparisonSlots.map(
            ({ category, currName, futName, changed, currScore, futScore, gainPct, action }, idx) => {
              const hasPositiveGain = gainPct !== null && gainPct > 0;
              const isNewAddition = gainPct === null && futScore > 0;
              const isConflictFix = action === 'replace_conflict';
              const currRatio = Math.max(0, Math.min(1, currScore / 100));
              const futRatio = Math.max(currRatio, Math.min(1, futScore / 100));
              const deltaRatio = Math.max(0, futRatio - currRatio);

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.28, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className={`px-6 py-4 grid grid-cols-1 lg:grid-cols-12 items-center gap-4 transition-colors ${
                    changed
                      ? 'bg-[#E5EEE6]/25 dark:bg-[#1C261F]/40 hover:bg-[#E5EEE6]/45 dark:hover:bg-[#1E2821]/65'
                      : 'hover:bg-[#E5EEE6]/30 dark:hover:bg-[#1E2821]/50'
                  }`}
                >
                  {/* Category */}
                  <div className="lg:col-span-2 flex items-center gap-2.5">
                    <div className="w-12 aspect-[4/3] rounded-[6px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] shrink-0">
                      <HardwareImage
                        src={HARDWARE_CATEGORY_IMAGES[category].src}
                        alt={HARDWARE_CATEGORY_IMAGES[category].alt}
                        fallbackCategory={category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <HardwareIcon
                        category={category}
                        className="w-3.5 h-3.5 text-[#6F9278] dark:text-[#86AD90] shrink-0"
                      />
                      <span className="text-xs font-semibold text-[#4E5A50] dark:text-[#C4D0C6] truncate">
                        {CATEGORY_SHORT_LABELS[category]}
                      </span>
                    </div>
                  </div>

                  {/* Current -> Future Parts */}
                  <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-11 items-center gap-2 min-w-0">
                    <div className="sm:col-span-5 min-w-0">
                      <span className="text-[11px] text-[#5C675E] dark:text-[#98A69B] block lg:hidden">
                        Atual
                      </span>
                      <p className="text-xs sm:text-sm text-[#4E5A50] dark:text-[#A9B6AC] truncate">
                        {currName}
                      </p>
                    </div>

                    <div className="hidden sm:flex sm:col-span-1 justify-center">
                      <motion.div
                        key={`arrow-${category}-${futName}`}
                        initial={changed ? { x: -4, opacity: 0.4 } : false}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <ArrowRight
                          className={`w-4 h-4 ${
                            changed
                              ? 'text-[#315C45] dark:text-[#86AD90]'
                              : 'text-[#DCE4DD] dark:text-[#2A352D]'
                          }`}
                          aria-hidden="true"
                        />
                      </motion.div>
                    </div>

                    <div className="sm:col-span-5 min-w-0">
                      <span className="text-[11px] text-[#5C675E] dark:text-[#98A69B] block lg:hidden">
                        Futura
                      </span>
                      <p
                        className={`text-xs sm:text-sm font-medium truncate ${
                          changed
                            ? 'text-[#315C45] dark:text-[#86AD90] font-semibold'
                            : 'text-[#202521] dark:text-[#EEF2EE]'
                        }`}
                      >
                        {futName}
                      </p>
                    </div>
                  </div>

                  {/* Animated Performance Gain Indicator */}
                  <div className="lg:col-span-3 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      {hasPositiveGain ? (
                        <motion.span
                          key={`gain-${category}-${gainPct}`}
                          initial={{ opacity: 0, scale: 0.88 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#315C45] text-white dark:bg-[#3B6E52]"
                        >
                          <TrendingUp className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <AnimatedMetricNumber
                            from={0}
                            to={gainPct}
                            prefix="+"
                            suffix="% ganho"
                            duration={0.8}
                          />
                        </motion.span>
                      ) : isNewAddition ? (
                        <motion.span
                          key={`new-${category}-${futName}`}
                          initial={{ opacity: 0, scale: 0.88 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5EEE6] dark:bg-[#233629] text-[#315C45] dark:text-[#A3C7AD] border border-[#315C45]/30"
                        >
                          <PlusCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Peça adicionada</span>
                        </motion.span>
                      ) : isConflictFix ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                          <ShieldAlert className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Conflito resolvido</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#5C675E] dark:text-[#98A69B]">
                          {changed ? 'Compatibilidade ajustada' : 'Mantida (0%)'}
                        </span>
                      )}

                      <span className="text-[11px] font-mono tabular-nums text-[#4E5A50] dark:text-[#A9B6AC]">
                        {currScore} →{' '}
                        <AnimatedMetricNumber
                          from={changed ? currScore : futScore}
                          to={futScore}
                          duration={0.7}
                          className={
                            hasPositiveGain || isNewAddition
                              ? 'font-semibold text-[#315C45] dark:text-[#86AD90]'
                              : ''
                          }
                        />
                      </span>
                    </div>

                    {/* Dual-Layer Animated Progress Gain Bar */}
                    <div className="relative h-2 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
                      {/* Baseline Current Bar */}
                      {currRatio > 0 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          whileInView={{ scaleX: currRatio }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformOrigin: 'left' }}
                          className="absolute inset-y-0 left-0 w-full bg-[#8FA896] dark:bg-[#4F6B57] rounded-full"
                        />
                      )}

                      {/* Future Gain Overlay Bar */}
                      {futScore > 0 && (
                        <motion.div
                          key={`bar-${category}-${futScore}-${currScore}`}
                          initial={{ scaleX: currRatio }}
                          whileInView={{ scaleX: Math.max(0.03, futScore / 100) }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.65, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                          style={{ transformOrigin: 'left' }}
                          className={`absolute inset-y-0 left-0 w-full rounded-full ${
                            hasPositiveGain || isNewAddition
                              ? 'bg-[#315C45] dark:bg-[#5B9B76]'
                              : 'bg-[#6F9278] dark:bg-[#6F9278]'
                          }`}
                        />
                      )}

                      {/* Subtle one-shot sheen along the gained portion */}
                      {(hasPositiveGain || isNewAddition) && deltaRatio > 0 && (
                        <motion.div
                          key={`sheen-${category}-${futScore}`}
                          initial={{ x: '-100%', opacity: 0.85 }}
                          whileInView={{ x: '220%', opacity: 0 }}
                          viewport={{ once: true, amount: 0.2 }}
                          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent"
                        />
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="lg:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenFuturePicker(category)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#315C45] dark:text-[#A3C7AD] bg-white dark:bg-[#191F1B] border border-[#315C45]/45 dark:border-[#6F9278]/50 rounded-[10px] hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821] hover:border-[#315C45] transition-colors whitespace-nowrap shrink-0"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Alterar Futura</span>
                    </button>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      </div>

      {/* 4-Column Gain KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] divide-y sm:divide-y-0 sm:divide-x divide-[#DCE4DD] dark:divide-[#2A352D]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 space-y-2"
        >
          <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
            Ganho em Processamento (CPU)
          </span>
          <div className="flex items-baseline gap-2">
            {(() => {
              const cpuGain = getDeltaPercentValue(cpuCurr, cpuFut);
              if (cpuGain === null) {
                return (
                  <span className="text-2xl font-bold font-mono text-[#315C45] dark:text-[#86AD90]">
                    Novo
                  </span>
                );
              }
              return (
                <AnimatedMetricNumber
                  from={0}
                  to={cpuGain}
                  prefix={cpuGain > 0 ? '+' : ''}
                  suffix="%"
                  duration={0.85}
                  className="text-2xl font-bold text-[#315C45] dark:text-[#86AD90]"
                />
              );
            })()}
            <span className="text-xs font-mono tabular-nums text-[#5C675E] dark:text-[#98A69B]">
              ({cpuCurr} →{' '}
              <AnimatedMetricNumber from={cpuCurr} to={cpuFut} duration={0.65} />)
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
            <motion.div
              key={`kpi-cpu-${cpuFut}`}
              initial={{ scaleX: Math.max(0.02, cpuCurr / 100) }}
              whileInView={{ scaleX: Math.max(0.02, cpuFut / 100) }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-[#315C45] dark:bg-[#6AB087] rounded-full"
            />
          </div>
          <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] truncate">
            {futureBuild.cpu?.name ?? 'Selecione uma CPU futura'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.28, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 space-y-2"
        >
          <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
            Ganho Gráfico (GPU)
          </span>
          <div className="flex items-baseline gap-2">
            {(() => {
              const gpuGain = getDeltaPercentValue(gpuCurr, gpuFut);
              if (gpuGain === null) {
                return (
                  <span className="text-2xl font-bold font-mono text-[#315C45] dark:text-emerald-400">
                    Novo
                  </span>
                );
              }
              return (
                <AnimatedMetricNumber
                  from={0}
                  to={gpuGain}
                  prefix={gpuGain > 0 ? '+' : ''}
                  suffix="%"
                  duration={0.9}
                  className="text-2xl font-bold text-[#315C45] dark:text-emerald-400"
                />
              );
            })()}
            <span className="text-xs font-mono tabular-nums text-[#5C675E] dark:text-[#98A69B]">
              ({gpuCurr} →{' '}
              <AnimatedMetricNumber from={gpuCurr} to={gpuFut} duration={0.7} />)
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
            <motion.div
              key={`kpi-gpu-${gpuFut}`}
              initial={{ scaleX: Math.max(0.02, gpuCurr / 100) }}
              whileInView={{ scaleX: Math.max(0.02, gpuFut / 100) }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-[#315C45] dark:bg-emerald-500 rounded-full"
            />
          </div>
          <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] truncate">
            {futureBuild.gpu?.name ?? 'Selecione uma GPU futura'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.28, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 space-y-2"
        >
          <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
            Memória RAM
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-[#202521] dark:text-[#EEF2EE]">
              {currentBuild.ram?.capacityGB ?? 0} →{' '}
              <AnimatedMetricNumber
                from={currentBuild.ram?.capacityGB ?? 0}
                to={futureBuild.ram?.capacityGB ?? 0}
                suffix=" GB"
                duration={0.65}
              />
            </span>
            {ramFut > ramCurr && ramCurr > 0 && (
              <AnimatedMetricNumber
                from={0}
                to={Math.round(((ramFut - ramCurr) / ramCurr) * 100)}
                prefix="+"
                suffix="%"
                duration={0.75}
                className="text-xs font-bold text-[#315C45] dark:text-[#86AD90]"
              />
            )}
          </div>
          <div className="h-1.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
            <motion.div
              key={`kpi-ram-${ramFut}`}
              initial={{ scaleX: Math.max(0.02, ramCurr / 100) }}
              whileInView={{ scaleX: Math.max(0.02, ramFut / 100) }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className="h-full w-full bg-[#6F9278] dark:bg-[#86AD90] rounded-full"
            />
          </div>
          <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] font-mono tabular-nums truncate">
            {futureBuild.ram
              ? `${futureBuild.ram.type} ${futureBuild.ram.speedMTs} MT/s`
              : 'Sem memória definida'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.28, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 space-y-2"
        >
          <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
            Consumo e Status Futuro
          </span>
          <div className="flex items-center gap-2">
            {futureHasError ? (
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#315C45] dark:text-[#86AD90] shrink-0" aria-hidden="true" />
            )}
            <span
              className={`text-lg font-semibold ${
                futureHasError
                  ? 'text-red-700 dark:text-red-400'
                  : 'text-[#315C45] dark:text-[#86AD90]'
              }`}
            >
              {futureHasError ? 'Alerta na Build Futura' : 'Sem Gargalos'}
            </span>
          </div>
          <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] font-mono tabular-nums">
            {currentAnalysis.estimatedLoadWatts}W →{' '}
            <AnimatedMetricNumber
              from={currentAnalysis.estimatedLoadWatts}
              to={futureAnalysis.estimatedLoadWatts}
              suffix="W"
              duration={0.65}
            />{' '}
            de pico
          </p>
        </motion.div>
      </div>

      {/* Alert if future build has incompatibility or bottleneck */}
      {futureHasError && (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/70 rounded-[14px] p-5 flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
              Atenção na Build Futura: {futureAnalysis.issues.find((i) => i.severity === 'error')?.title}
            </h3>
            <p className="text-xs text-red-800 dark:text-red-300">
              {futureAnalysis.issues.find((i) => i.severity === 'error')?.detail}
            </p>
          </div>
        </div>
      )}

      {/* Visual Charts Row: Bar Comparison + Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Animated Dual Horizontal Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-6 flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#202521] dark:text-[#EEF2EE]">
                Ganho por Subsistema
              </h2>
              <p className="text-xs text-[#5C675E] dark:text-[#98A69B] mt-0.5">
                Comparação percentual relativa entre as peças atuais e o upgrade planejado
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#315C45] dark:text-[#86AD90] shrink-0" aria-hidden="true" />
          </div>

          <div className="space-y-5">
            {metricBars.map((bar, barIdx) => {
              const delta = formatDeltaPercent(bar.currentValue, bar.futureValue);
              const deltaVal = getDeltaPercentValue(bar.currentValue, bar.futureValue);
              const isPositive = bar.futureValue > bar.currentValue;
              return (
                <motion.div
                  key={bar.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.28, delay: barIdx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#202521] dark:text-[#EEF2EE]">
                      {bar.label}
                    </span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        isPositive
                          ? 'text-[#315C45] dark:text-emerald-400'
                          : 'text-[#5C675E] dark:text-[#98A69B]'
                      }`}
                    >
                      {deltaVal === null ? (
                        delta
                      ) : (
                        <AnimatedMetricNumber
                          from={0}
                          to={deltaVal}
                          prefix={deltaVal > 0 ? '+' : ''}
                          suffix="%"
                          duration={0.75}
                        />
                      )}
                    </span>
                  </div>

                  {/* Current Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#5C675E] dark:text-[#98A69B]">
                      <span>Atual</span>
                      <span className="font-mono tabular-nums">{bar.currentLabel}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: Math.max(0.02, bar.currentValue / 100) }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full w-full bg-[#6F9278] dark:bg-[#6F9278] rounded-full"
                      />
                    </div>
                  </div>

                  {/* Future Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-[#315C45] dark:text-[#A3C7AD] font-semibold">
                      <span>Futura</span>
                      <span className="font-mono tabular-nums">{bar.futureLabel}</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: Math.max(0.02, bar.futureValue / 100) }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                        style={{ transformOrigin: 'left' }}
                        className="h-full w-full bg-[#315C45] dark:bg-[#5B9B76] rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Radar Profile Chart */}
        <div className="lg:col-span-5 bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-6 flex flex-col justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#202521] dark:text-[#EEF2EE]">
              Perfil Geral do Sistema
            </h2>
            <p className="text-xs text-[#5C675E] dark:text-[#98A69B] mt-0.5">
              Equilíbrio multidimensional entre CPU, GPU, memória, armazenamento, plataforma e energia
            </p>
          </div>
          <RadarComparisonChart axes={radarAxes} />
        </div>
      </div>

      {/* Power Budget Comparison Bar */}
      <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#202521] dark:text-[#EEF2EE]">
              Consumo Elétrico Estimado vs Capacidade da Fonte
            </h2>
            <p className="text-xs text-[#5C675E] dark:text-[#98A69B]">
              Comparação do pico de carga (CPU + GPU + 75W do sistema) frente à fonte de cada configuração
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#5C675E] dark:text-[#98A69B]">
            Ideal: manter carga abaixo de 75% da fonte
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Build Atual',
              load: currentAnalysis.estimatedLoadWatts,
              psu: currentBuild.psu?.wattage ?? 0,
              rec: currentAnalysis.recommendedPsuWatts,
            },
            {
              title: 'Build Futura',
              load: futureAnalysis.estimatedLoadWatts,
              psu: futureBuild.psu?.wattage ?? 0,
              rec: futureAnalysis.recommendedPsuWatts,
            },
          ].map((item) => {
            const denom = Math.max(item.psu || item.rec, item.load, 1);
            const loadRatio = Math.min(1, item.load / denom);
            const isOverloaded = item.psu > 0 && item.psu < item.rec;
            return (
              <div key={item.title} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#202521] dark:text-[#EEF2EE]">
                    {item.title}
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      isOverloaded
                        ? 'text-red-700 dark:text-red-400 font-semibold'
                        : 'text-[#4E5A50] dark:text-[#A9B6AC]'
                    }`}
                  >
                    {item.load}W pico / {item.psu > 0 ? `Fonte ${item.psu}W` : `Ideal ${item.rec}W`}
                  </span>
                </div>
                <div className="h-3 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: Math.max(0.03, loadRatio) }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    style={{ transformOrigin: 'left' }}
                    className={`h-full w-full rounded-full ${
                      isOverloaded ? 'bg-red-600' : 'bg-[#315C45] dark:bg-[#5B9B76]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Diagnostic & Required Changes Checklist */}
      <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] overflow-hidden">
        <div className="px-6 py-4 bg-[#E5EEE6]/70 dark:bg-[#1E2821] border-b border-[#DCE4DD] dark:border-[#2A352D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-[#315C45] dark:text-[#86AD90] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-[#202521] dark:text-[#EEF2EE]">
                {activePlan
                  ? `Mudanças Recomendadas — Simulação ${activePlan.title}`
                  : 'Mudanças Recomendadas — Simulação Personalizada'}
              </h2>
              <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] mt-0.5">
                Baseado no diagnóstico salvo: {savedDiagnostic.balanceSummary}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shrink-0 self-start sm:self-center ${
              savedDiagnostic.compatibilityStatus === 'error'
                ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                : 'bg-white dark:bg-[#151A16] text-[#315C45] dark:text-[#A3C7AD] border border-[#DCE4DD] dark:border-[#2A352D]'
            }`}
          >
            {savedDiagnostic.compatibilityStatus === 'error' ? (
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            <span>
              {actionableChanges.length === 0
                ? 'Nenhuma mudança necessária'
                : `${actionableChanges.length} ${actionableChanges.length === 1 ? 'mudança indicada' : 'mudanças indicadas'}`}
            </span>
          </span>
        </div>

        <div className="p-6 space-y-4">
          {actionableChanges.length === 0 ? (
            <div className="rounded-[12px] bg-[#E5EEE6]/55 dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] p-4 flex items-center gap-3 text-sm text-[#202521] dark:text-[#EEF2EE]">
              <CheckCircle2 className="w-5 h-5 text-[#315C45] dark:text-[#86AD90] shrink-0" aria-hidden="true" />
              <span>Sua build atual já corresponde exatamente a esta simulação sem conflitos ou pendências.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {actionableChanges.map((change) => {
                const style = ACTION_STYLES[change.action];
                return (
                  <motion.div
                    key={`${change.category}-${change.toName}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                    className={`rounded-[12px] border p-4 space-y-2 ${style.border}`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#202521] dark:text-[#EEF2EE]">
                        <HardwareIcon
                          category={change.category}
                          className="w-3.5 h-3.5 text-[#315C45] dark:text-[#86AD90]"
                        />
                        <span>{CATEGORY_SHORT_LABELS[change.category]}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {change.gainPercent !== undefined && change.gainPercent > 0 && (
                          <span className="text-xs font-mono tabular-nums font-bold text-[#315C45] dark:text-emerald-400">
                            +{change.gainPercent}%
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${style.badge}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      {change.fromName ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[#5C675E] dark:text-[#98A69B] line-through">
                            {change.fromName}
                          </span>
                          <ArrowRight className="w-3 h-3 text-[#315C45] dark:text-[#86AD90] shrink-0" aria-hidden="true" />
                          <span className="font-semibold text-[#202521] dark:text-[#EEF2EE]">
                            {change.toName}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <PlusCircle className="w-3.5 h-3.5 text-[#315C45] dark:text-[#86AD90] shrink-0" aria-hidden="true" />
                          <span className="font-semibold text-[#202521] dark:text-[#EEF2EE]">
                            {change.toName}
                          </span>
                        </div>
                      )}
                      <p className="text-[#4E5A50] dark:text-[#A9B6AC] leading-relaxed">
                        {change.reason}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {keptParts.length > 0 && (
            <div className="pt-2 border-t border-[#DCE4DD] dark:border-[#2A352D] flex flex-wrap items-center gap-2 text-xs text-[#4E5A50] dark:text-[#A9B6AC]">
              <span className="inline-flex items-center gap-1 font-semibold text-[#315C45] dark:text-[#86AD90]">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Peças mantidas do seu setup atual:</span>
              </span>
              {keptParts.map((k) => (
                <span
                  key={k.category}
                  className="px-2.5 py-0.5 rounded-full bg-[#F6F7F3] dark:bg-[#151A16] border border-[#DCE4DD] dark:border-[#2A352D] text-[#202521] dark:text-[#EEF2EE]"
                >
                  {CATEGORY_SHORT_LABELS[k.category]}: {k.toName}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
}
