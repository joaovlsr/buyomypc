import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  AnyHardwarePart,
  BuildAnalysis,
  BuildGoal,
  HardwareCategory,
  PartRecommendation,
  SelectedBuild,
  TierBuildSuggestion,
} from '../types/hardware';
import { CATEGORY_LABELS, CATEGORY_SHORT_LABELS, HardwareIcon } from './HardwareIcon';
import { HARDWARE_CATEGORY_IMAGES, HardwareImage } from './HardwareVisuals';

interface DiagnosticAndRecommendationsProps {
  build: SelectedBuild;
  analysis: BuildAnalysis;
  onApplyPart: (part: AnyHardwarePart) => void;
  onApplyTierBuild: (suggestedBuild: SelectedBuild) => void;
  onCompareTierBuild: (suggestedBuild: SelectedBuild, goal?: BuildGoal) => void;
  onSaveDiagnostic?: () => void;
  onOpenComparison?: () => void;
}

type RecommendationTab = 'tiers' | 'upgrade';

function AnimatedPercentCounter({
  value,
  prefix = '+',
  suffix = '%',
  duration = 0.95,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(() =>
    prefersReducedMotion ? value : 0
  );

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }
    if (!isInView) return;

    setDisplayValue(0);
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      },
    });

    return () => controls.stop();
  }, [value, duration, prefersReducedMotion, isInView]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

function getBuildCompositeScore(build: SelectedBuild): number {
  const cpu = build.cpu?.tierScore ?? 0;
  const gpu = build.gpu?.tierScore ?? (build.cpu?.integratedGpu ? 11 : 0);
  const ram = build.ram?.tierScore ?? 0;
  const storage = build.storage?.tierScore ?? 0;
  if (cpu === 0 && gpu === 0) return 0;
  return Math.round(cpu * 0.4 + gpu * 0.44 + ram * 0.1 + storage * 0.06);
}

function BestUpgradeSpotlight({
  category,
  rec,
  onApply,
}: {
  category: HardwareCategory;
  rec: PartRecommendation<AnyHardwarePart>;
  onApply: (part: AnyHardwarePart) => void;
}) {
  const gain = rec.estimatedGainPercent ?? 0;
  const barRatio = Math.max(0.18, Math.min(1, gain / 100));

  return (
    <motion.div
      key={`best-${rec.part.id}-${gain}`}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden rounded-[16px] border-2 border-[#315C45] dark:border-[#6AB087] bg-gradient-to-br from-[#E5EEE6]/85 via-white to-[#E5EEE6]/55 dark:from-[#1B2B22] dark:via-[#191F1B] dark:to-[#16211B] p-5 sm:p-6 shadow-sm"
    >
      {/* Subtle one-shot light sweep on scroll into view */}
      <motion.div
        aria-hidden="true"
        initial={{ x: '-120%' }}
        whileInView={{ x: '240%' }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/35 dark:via-white/10 to-transparent skew-x-[-20deg]"
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Image + Badge + Part Details */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0 flex-1">
          <div className="w-full sm:w-32 aspect-[4/3] rounded-[12px] overflow-hidden border border-[#315C45]/35 dark:border-[#6F9278]/50 bg-[#F6F7F3] dark:bg-[#151A16] shrink-0">
            <HardwareImage
              src={HARDWARE_CATEGORY_IMAGES[category].src}
              alt={HARDWARE_CATEGORY_IMAGES[category].alt}
              fallbackCategory={category}
              loading="eager"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#315C45] text-white dark:bg-[#3B6E52] shadow-xs">
                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Upgrade com Maior Ganho</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 dark:bg-[#151A16] text-[#315C45] dark:text-[#A3C7AD] border border-[#DCE4DD] dark:border-[#2A352D]">
                <HardwareIcon category={category} className="w-3.5 h-3.5 shrink-0" />
                <span>{CATEGORY_LABELS[category]}</span>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-[#202521] dark:text-[#EEF2EE] tracking-tight">
              {rec.part.name}
            </h3>

            <p className="text-xs sm:text-sm text-[#4E5A50] dark:text-[#B8C6BA] leading-relaxed">
              {rec.reason}
            </p>
          </div>
        </div>

        {/* Right: Animated Gain Counter + Bar + CTA */}
        <div className="lg:w-72 shrink-0 flex flex-col gap-3 bg-white/90 dark:bg-[#151A16]/90 border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B] inline-flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#315C45] dark:text-[#6AB087]" aria-hidden="true" />
              <span>Ganho estimado</span>
            </span>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.7 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl font-bold text-[#315C45] dark:text-[#6AB087] leading-none"
            >
              <AnimatedPercentCounter value={gain} duration={1.1} />
            </motion.div>
          </div>

          {/* Fluid animated gain bar */}
          <div className="space-y-1">
            <div className="h-2.5 w-full bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: barRatio }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                style={{ transformOrigin: 'left' }}
                className="h-full w-full bg-gradient-to-r from-[#6F9278] to-[#315C45] dark:from-[#5B9B76] dark:to-[#86AD90] rounded-full"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5C675E] dark:text-[#98A69B]">
              <span>{rec.fitLabel}</span>
              <span className="font-semibold text-[#315C45] dark:text-[#86AD90]">Sem gargalo</span>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onApply(rec.part)}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold text-white bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap min-h-[40px]"
          >
            <span>Aplicar Maior Upgrade</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function UpgradeGroup<T extends AnyHardwarePart>({
  category,
  items,
  globalBestId,
  onApply,
}: {
  category: HardwareCategory;
  items: PartRecommendation<T>[];
  globalBestId: string | null;
  onApply: (part: AnyHardwarePart) => void;
}) {
  if (items.length === 0) return null;

  // Put highest-gain option first inside each category
  const sortedItems = [...items].sort(
    (a, b) => (b.estimatedGainPercent ?? 0) - (a.estimatedGainPercent ?? 0)
  );
  const topGainInGroup = Math.max(...sortedItems.map((i) => i.estimatedGainPercent ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] overflow-hidden"
    >
      <div className="px-5 py-3.5 bg-[#E5EEE6]/70 dark:bg-[#1E2821] border-b border-[#DCE4DD] dark:border-[#2A352D] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <HardwareIcon category={category} className="w-4 h-4 text-[#315C45] dark:text-[#86AD90]" />
          <h4 className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
            {CATEGORY_LABELS[category]}
          </h4>
        </div>
        <span className="text-xs text-[#5C675E] dark:text-[#98A69B] tabular-nums">
          {sortedItems.length} {sortedItems.length === 1 ? 'opção' : 'opções'}
        </span>
      </div>

      <div className="divide-y divide-[#DCE4DD] dark:divide-[#2A352D]">
        {sortedItems.map((rec, index) => {
          const gain = rec.estimatedGainPercent ?? 0;
          const isBestInCategory = gain > 0 && gain === topGainInGroup;
          const isGlobalBest = rec.part.id === globalBestId;

          return (
            <motion.div
              key={rec.part.id}
              initial={{ opacity: 0, x: -6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.26,
                delay: index * 0.05,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isBestInCategory
                  ? 'bg-[#E5EEE6]/45 dark:bg-[#1E2B22]/75 hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2B22]'
                  : 'hover:bg-[#E5EEE6]/30 dark:hover:bg-[#1E2821]/50'
              }`}
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {isGlobalBest ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#315C45] text-white dark:bg-[#3B6E52]">
                      <Award className="w-3 h-3" aria-hidden="true" />
                      <span>Maior ganho geral</span>
                    </span>
                  ) : isBestInCategory ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5EEE6] dark:bg-[#233629] text-[#315C45] dark:text-[#A3C7AD] border border-[#315C45]/25">
                      <TrendingUp className="w-3 h-3" aria-hidden="true" />
                      <span>Maior ganho em {CATEGORY_SHORT_LABELS[category]}</span>
                    </span>
                  ) : null}

                  <span className="font-semibold text-[#315C45] dark:text-[#86AD90]">
                    {rec.fitLabel}
                  </span>

                  {gain > 0 && (
                    <>
                      <span className="text-[#DCE4DD] dark:text-[#2A352D]" aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          isBestInCategory
                            ? 'text-[#315C45] dark:text-emerald-300 text-sm'
                            : 'text-[#315C45] dark:text-emerald-400'
                        }`}
                      >
                        <AnimatedPercentCounter value={gain} duration={0.85 + index * 0.1} />
                        <span className="font-sans text-xs font-medium">desempenho</span>
                      </span>
                    </>
                  )}
                </div>

                <div className="text-base font-semibold text-[#202521] dark:text-[#EEF2EE]">
                  {rec.part.name}
                </div>

                {gain > 0 && (
                  <div className="h-1.5 w-full max-w-xs bg-[#E5EEE6] dark:bg-[#222A24] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: Math.max(0.12, Math.min(1, gain / Math.max(topGainInGroup, 50))) }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.75, delay: 0.08 + index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      style={{ transformOrigin: 'left' }}
                      className={`h-full w-full rounded-full ${
                        isBestInCategory
                          ? 'bg-[#315C45] dark:bg-[#6AB087]'
                          : 'bg-[#6F9278] dark:bg-[#5B9B76]'
                      }`}
                    />
                  </div>
                )}

                <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC]">{rec.reason}</p>
              </div>

              <div className="flex items-center justify-end shrink-0">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onApply(rec.part)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 min-h-[40px] ${
                    isBestInCategory
                      ? 'text-white bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] shadow-xs'
                      : 'text-[#315C45] dark:text-[#A3C7AD] bg-[#F6F7F3] dark:bg-[#1E2821] border border-[#315C45]/40 dark:border-[#6F9278]/50 hover:bg-[#E5EEE6] dark:hover:bg-[#243228]'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Aplicar Upgrade</span>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TierBuildCard({
  tier,
  currentBuild,
  gainPercent,
  isHighestGainTier,
  index,
  onApply,
  onCompare,
}: {
  tier: TierBuildSuggestion;
  currentBuild: SelectedBuild;
  gainPercent: number | null;
  isHighestGainTier: boolean;
  index: number;
  onApply: (suggestedBuild: SelectedBuild) => void;
  onCompare: (suggestedBuild: SelectedBuild) => void;
}) {
  const rows: {
    category: HardwareCategory;
    part: AnyHardwarePart | null;
    isUserOwned: boolean;
  }[] = [
    {
      category: HardwareCategory.MOTHERBOARD,
      part: tier.completedBuild.motherboard,
      isUserOwned: Boolean(currentBuild.motherboard),
    },
    {
      category: HardwareCategory.CPU,
      part: tier.completedBuild.cpu,
      isUserOwned: Boolean(currentBuild.cpu),
    },
    {
      category: HardwareCategory.GPU,
      part: tier.completedBuild.gpu,
      isUserOwned: Boolean(currentBuild.gpu),
    },
    {
      category: HardwareCategory.RAM,
      part: tier.completedBuild.ram,
      isUserOwned: Boolean(currentBuild.ram),
    },
    {
      category: HardwareCategory.STORAGE,
      part: tier.completedBuild.storage,
      isUserOwned: Boolean(currentBuild.storage),
    },
    {
      category: HardwareCategory.PSU,
      part: tier.completedBuild.psu,
      isUserOwned: Boolean(currentBuild.psu),
    },
  ];

  const hasSuggestedAdditions = rows.some((r) => !r.isUserOwned && r.part !== null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className={`rounded-[14px] flex flex-col justify-between overflow-hidden transition-shadow ${
        isHighestGainTier
          ? 'bg-white dark:bg-[#191F1B] border-2 border-[#315C45] dark:border-[#6AB087] shadow-sm'
          : 'bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D]'
      }`}
    >
      <div>
        <div
          className={`p-5 border-b border-[#DCE4DD] dark:border-[#2A352D] space-y-1.5 ${
            isHighestGainTier
              ? 'bg-gradient-to-r from-[#E5EEE6] to-[#E5EEE6]/55 dark:from-[#1E2E23] dark:to-[#19231C]'
              : 'bg-[#E5EEE6]/70 dark:bg-[#1E2821]'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-[#202521] dark:text-[#EEF2EE]">
                {tier.title}
              </h3>
              {isHighestGainTier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#315C45] text-white dark:bg-[#3B6E52]">
                  <TrendingUp className="w-3 h-3" aria-hidden="true" />
                  <span>Maior Ganho</span>
                </span>
              )}
            </div>
            <span className="text-xs font-mono tabular-nums text-[#315C45] dark:text-[#A3C7AD] font-medium shrink-0">
              {tier.estimatedLoadWatts} W pico
            </span>
          </div>

          {gainPercent !== null && gainPercent > 0 && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C45] dark:text-[#6AB087]">
              <AnimatedPercentCounter value={gainPercent} duration={0.95} className="text-sm font-bold" />
              <span>de ganho geral estimado</span>
            </div>
          )}

          <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] leading-relaxed">
            {tier.subtitle}
          </p>
        </div>

        <div className="divide-y divide-[#DCE4DD] dark:divide-[#2A352D]">
          {rows.map(({ category, part, isUserOwned }) => (
            <div key={category} className="px-5 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-[#5C675E] dark:text-[#98A69B]">
                    {CATEGORY_SHORT_LABELS[category]}
                  </span>
                  <span className="text-[#DCE4DD] dark:text-[#2A352D]" aria-hidden="true">·</span>
                  <span
                    className={
                      isUserOwned
                        ? 'font-medium text-[#4E5A50] dark:text-[#C4D0C6]'
                        : 'font-semibold text-[#315C45] dark:text-[#86AD90]'
                    }
                  >
                    {isUserOwned ? 'Sua peça atual' : 'Sugerida para completar'}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#202521] dark:text-[#EEF2EE] truncate">
                  {part ? part.name : 'Indisponível'}
                </p>
              </div>
              {isUserOwned && (
                <Check className="w-4 h-4 text-[#6F9278] dark:text-[#86AD90] shrink-0 mt-1" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-[#F6F7F3] dark:bg-[#151A16] border-t border-[#DCE4DD] dark:border-[#2A352D] space-y-2.5">
        <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] font-mono tabular-nums truncate">
          {tier.balanceNote}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!hasSuggestedAdditions}
            onClick={() => onApply(tier.completedBuild)}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap min-h-[40px] ${
              hasSuggestedAdditions
                ? 'bg-[#315C45] text-white hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262]'
                : 'bg-[#E5EEE6]/60 dark:bg-[#222A24] text-[#7B867D] dark:text-[#667368] cursor-not-allowed'
            }`}
          >
            <span>Completar ({tier.title})</span>
          </button>
          <button
            type="button"
            onClick={() => onCompare(tier.completedBuild)}
            title="Comparar com Build Atual no gráfico"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-[#315C45] dark:text-[#A3C7AD] bg-white dark:bg-[#191F1B] border border-[#315C45]/45 dark:border-[#6F9278]/50 hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821] hover:border-[#315C45] rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Comparar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function DiagnosticAndRecommendations({
  build,
  analysis,
  onApplyPart,
  onApplyTierBuild,
  onCompareTierBuild,
  onSaveDiagnostic,
  onOpenComparison,
}: DiagnosticAndRecommendationsProps) {
  const hasCoreAnchor = Boolean(build.motherboard || build.gpu || build.cpu);
  const hasMissingSlots = analysis.selectedCount < 6;
  const hasSelectedSlots = analysis.selectedCount > 0;
  const [activeTab, setActiveTab] = useState<RecommendationTab>(
    hasMissingSlots ? 'tiers' : 'upgrade'
  );
  const [savedNoticeVisible, setSavedNoticeVisible] = useState(false);

  useEffect(() => {
    setSavedNoticeVisible(false);
  }, [build]);

  useEffect(() => {
    if (!hasMissingSlots) {
      setActiveTab('upgrade');
    } else if (hasCoreAnchor) {
      setActiveTab((prev) => (prev === 'upgrade' ? 'upgrade' : 'tiers'));
    }
  }, [hasMissingSlots, hasCoreAnchor]);

  const criticalIssues = analysis.issues.filter((i) => i.severity === 'error');
  const warningIssues = analysis.issues.filter((i) => i.severity === 'warning');

  const bestGlobalUpgrade = useMemo(() => {
    const candidates: {
      category: HardwareCategory;
      rec: PartRecommendation<AnyHardwarePart>;
    }[] = [
      ...analysis.upgradeRecommendations.gpu.map((rec) => ({
        category: HardwareCategory.GPU,
        rec,
      })),
      ...analysis.upgradeRecommendations.cpu.map((rec) => ({
        category: HardwareCategory.CPU,
        rec,
      })),
      ...analysis.upgradeRecommendations.ram.map((rec) => ({
        category: HardwareCategory.RAM,
        rec,
      })),
      ...analysis.upgradeRecommendations.storage.map((rec) => ({
        category: HardwareCategory.STORAGE,
        rec,
      })),
    ].filter((item) => (item.rec.estimatedGainPercent ?? 0) > 0);

    if (candidates.length === 0) return null;
    candidates.sort(
      (a, b) => (b.rec.estimatedGainPercent ?? 0) - (a.rec.estimatedGainPercent ?? 0)
    );
    return candidates[0];
  }, [analysis.upgradeRecommendations]);

  const tierGainMap = useMemo(() => {
    const currentScore = getBuildCompositeScore(build);
    return analysis.tierSuggestions.map((tier) => {
      if (currentScore === 0) return null;
      const tierScore = getBuildCompositeScore(tier.completedBuild);
      const gain = Math.round(((tierScore - currentScore) / currentScore) * 100);
      return gain > 0 ? gain : 0;
    });
  }, [build, analysis.tierSuggestions]);

  const maxTierGain = useMemo(() => {
    const valid = tierGainMap.filter((v): v is number => v !== null && v > 0);
    return valid.length > 0 ? Math.max(...valid) : null;
  }, [tierGainMap]);

  return (
    <div className="space-y-10">
      {/* Diagnóstico Técnico & Alertas Críticos Vermelhos */}
      <section id="diagnostico" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#202521] dark:text-[#EEF2EE]">
            Diagnóstico Técnico e Alertas
          </h2>
          <p className="text-sm text-[#4E5A50] dark:text-[#A9B6AC] mt-1">
            Validação em tempo real de compatibilidade física, suporte de chipset, capacidade elétrica e gargalos entre CPU e GPU.
          </p>
        </div>

        <AnimatePresence>
          {criticalIssues.length > 0 && (
            <motion.div
              key="critical-alert-box"
              role="alert"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/70 rounded-[14px] overflow-hidden"
            >
              <div className="px-5 py-4 bg-red-100/80 dark:bg-red-900/40 border-b border-red-200 dark:border-red-800/70 flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">
                    Alerta Crítico: Incompatibilidade ou Gargalo Detectado ({criticalIssues.length})
                  </h3>
                  <p className="text-xs text-red-800 dark:text-red-300">
                    As peças selecionadas apresentam conflito técnico ou gargalo severo de desempenho.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-red-200 dark:divide-red-900/60">
                {criticalIssues.map((issue) => (
                  <div key={issue.id} className="p-5 flex items-start gap-3">
                    <ShieldAlert className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-semibold text-red-800 dark:text-red-300">
                        <span>Alerta Vermelho</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {issue.category === 'SYSTEM' ? 'Sistema' : CATEGORY_LABELS[issue.category]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-red-950 dark:text-red-100">{issue.title}</p>
                      <p className="text-xs text-red-900 dark:text-red-200/90 leading-relaxed">{issue.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* General Summary & Secondary Warnings */}
        <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] divide-y divide-[#DCE4DD] dark:divide-[#2A352D]">
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              {criticalIssues.length > 0 ? (
                <ShieldAlert className="w-5 h-5 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
              ) : warningIssues.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#315C45] dark:text-[#86AD90] shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
                  {analysis.selectedCount === 0
                    ? 'Nenhuma peça selecionada ainda'
                    : criticalIssues.length > 0
                      ? 'Revisão recomendada nas peças selecionadas'
                      : warningIssues.length > 0
                        ? 'Configuração funcional com observações de otimização'
                        : 'Configuração validada sem conflitos ou gargalos'}
                </h3>
                <p className="text-sm text-[#4E5A50] dark:text-[#A9B6AC]">{analysis.balanceSummary}</p>
              </div>
            </div>

            {analysis.prioritySummary.length > 0 && (
              <div className="pt-1 pl-8 space-y-1.5">
                {analysis.prioritySummary.map((line, index) => (
                  <p key={index} className="text-xs text-[#4E5A50] dark:text-[#C4D0C6] leading-relaxed">
                    • {line}
                  </p>
                ))}
              </div>
            )}
          </div>

          {warningIssues.length > 0 && (
            <div className="divide-y divide-[#DCE4DD] dark:divide-[#2A352D]">
              {warningIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-5 flex items-start gap-3 bg-amber-50/50 dark:bg-amber-950/20"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                      <span>Observação Técnica</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {issue.category === 'SYSTEM'
                          ? 'Sistema'
                          : CATEGORY_LABELS[issue.category]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">{issue.title}</p>
                    <p className="text-xs text-[#4E5A50] dark:text-[#C4D0C6] leading-relaxed">{issue.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sugestões: Banner + 3 Perfis Completos + Upgrades */}
      <section id="recomendacoes" className="scroll-mt-24 space-y-6">
        {/* Personalized Upgrade Banner inspired by Brand Mockup */}
        <div className="relative overflow-hidden rounded-[16px] border border-[#DCE4DD] dark:border-[#2A352D] bg-[#E5EEE6] dark:bg-[#1A241D] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 w-72 h-72 rounded-full bg-[#6F9278]/15 dark:bg-[#6F9278]/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-24 -bottom-16 w-56 h-56 rotate-12 bg-white/35 dark:bg-white/5 rounded-[24px]"
          />

          <div className="lg:col-span-7 relative z-10 space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-[#121613]/60 text-[#315C45] dark:text-[#A3C7AD] border border-[#DCE4DD] dark:border-[#2A352D]">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sua recomendação personalizada</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202521] dark:text-[#EEF2EE]">
              Seu PC está pronto para um upgrade?
            </h2>
            <p className="text-sm text-[#4E5A50] dark:text-[#B8C6BA] max-w-xl leading-relaxed">
              {activeTab === 'tiers'
                ? 'Três montagens completas (Entrada, Equilibrado e Máximo Desempenho) mantendo tudo o que você já selecionou.'
                : 'Caminhos de upgrade compatíveis e sem gargalo para evoluir as peças que você já possui.'}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onSaveDiagnostic?.();
                  setSavedNoticeVisible(true);
                  document
                    .getElementById('sugestoes-conteudo')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#315C45] hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262] rounded-full transition-colors whitespace-nowrap"
              >
                <span>Analisar meu PC</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-[#121613]/70 border border-[#DCE4DD] dark:border-[#2A352D] rounded-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('tiers')}
                  disabled={!hasMissingSlots}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'tiers'
                      ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                      : hasMissingSlots
                        ? 'text-[#315C45] dark:text-[#A3C7AD] hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821]'
                        : 'text-[#89978B] dark:text-[#5F6D61] cursor-not-allowed'
                  }`}
                >
                  Sugestões de Montagem (3 Perfis)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upgrade')}
                  disabled={!hasSelectedSlots}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap shrink-0 ${
                    activeTab === 'upgrade'
                      ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                      : hasSelectedSlots
                        ? 'text-[#315C45] dark:text-[#A3C7AD] hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821]'
                        : 'text-[#89978B] dark:text-[#5F6D61] cursor-not-allowed'
                  }`}
                >
                  Upgrades Compatíveis ({analysis.selectedCount})
                </button>
              </div>
            </div>

            {savedNoticeVisible && onOpenComparison && (
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#315C45] dark:text-[#A3C7AD] bg-white/85 dark:bg-[#151A16]/85 border border-[#315C45]/30 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Diagnóstico salvo para o Comparativo.</span>
                <button
                  type="button"
                  onClick={onOpenComparison}
                  className="font-semibold underline underline-offset-2 hover:text-[#202521] dark:hover:text-white"
                >
                  Abrir Comparativo →
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 relative z-10 flex flex-col gap-3 lg:items-end">
            <div className="bg-white/85 dark:bg-[#191F1B]/85 backdrop-blur-xs border border-[#DCE4DD] dark:border-[#2A352D] rounded-[12px] p-4 sm:p-5 space-y-2.5 w-full lg:max-w-xs">
              {[
                'Análise de hardware em tempo real',
                'Sugestões sob medida sem gargalos',
                '100% compatível com suas peças',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-xs font-medium text-[#202521] dark:text-[#EEF2EE]">
                  <span className="w-5 h-5 rounded-full bg-[#315C45] text-white inline-flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div id="sugestoes-conteudo" className="scroll-mt-24">

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${hasCoreAnchor}-${analysis.tierSuggestions.length}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'tiers' && hasMissingSlots ? (
              !hasCoreAnchor ? (
                <div className="bg-[#E5EEE6]/60 dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-8 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
                    Selecione ao menos a Placa-mãe, GPU ou CPU para gerar as sugestões
                  </p>
                  <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] max-w-xl mx-auto">
                    Assim que você informar qualquer uma dessas três peças principais acima, exibiremos automaticamente 3 configurações completas (Entrada, Equilibrado e Máximo Desempenho) 100% compatíveis e sem gargalos.
                  </p>
                </div>
              ) : analysis.tierSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {analysis.tierSuggestions.map((tier, idx) => {
                    const gain = tierGainMap[idx] ?? null;
                    const isHighestGainTier =
                      maxTierGain !== null
                        ? gain === maxTierGain
                        : idx === analysis.tierSuggestions.length - 1;
                    return (
                      <TierBuildCard
                        key={tier.goal}
                        tier={tier}
                        currentBuild={build}
                        gainPercent={gain}
                        isHighestGainTier={isHighestGainTier}
                        index={idx}
                        onApply={onApplyTierBuild}
                        onCompare={(suggested) => onCompareTierBuild(suggested, tier.goal)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/70 rounded-[14px] p-6 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                    Sugestões bloqueadas por conflito ou gargalo nas peças atuais
                  </p>
                  <p className="text-xs text-red-800 dark:text-red-300 max-w-xl mx-auto">
                    Para garantir que nenhuma peça incompatível ou com gargalo seja recomendada, corrija ou remova primeiro o item destacado em vermelho acima.
                  </p>
                </div>
              )
            ) : hasSelectedSlots ? (
              analysis.upgradeRecommendations.gpu.length === 0 &&
              analysis.upgradeRecommendations.cpu.length === 0 &&
              analysis.upgradeRecommendations.ram.length === 0 &&
              analysis.upgradeRecommendations.storage.length === 0 &&
              analysis.upgradeRecommendations.motherboard.length === 0 &&
              analysis.upgradeRecommendations.psu.length === 0 ? (
                <div className="bg-[#E5EEE6]/60 dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-8 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
                    Nenhum upgrade isolado disponível sem gerar gargalo ou conflito
                  </p>
                  <p className="text-xs text-[#4E5A50] dark:text-[#A9B6AC] max-w-xl mx-auto">
                    Suas peças atuais já estão no limite compatível entre si (por exemplo, potência da fonte, socket da placa-mãe ou equilíbrio CPU × GPU). Para evoluir além deste ponto, substitua também o componente limitante ou teste um cenário na aba Comparativo.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {bestGlobalUpgrade && (
                    <BestUpgradeSpotlight
                      category={bestGlobalUpgrade.category}
                      rec={bestGlobalUpgrade.rec}
                      onApply={onApplyPart}
                    />
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {build.gpu && (
                      <UpgradeGroup
                        category={HardwareCategory.GPU}
                        items={analysis.upgradeRecommendations.gpu}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                    {build.cpu && (
                      <UpgradeGroup
                        category={HardwareCategory.CPU}
                        items={analysis.upgradeRecommendations.cpu}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                    {build.ram && (
                      <UpgradeGroup
                        category={HardwareCategory.RAM}
                        items={analysis.upgradeRecommendations.ram}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                    {build.storage && (
                      <UpgradeGroup
                        category={HardwareCategory.STORAGE}
                        items={analysis.upgradeRecommendations.storage}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                    {build.motherboard && (
                      <UpgradeGroup
                        category={HardwareCategory.MOTHERBOARD}
                        items={analysis.upgradeRecommendations.motherboard}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                    {build.psu && (
                      <UpgradeGroup
                        category={HardwareCategory.PSU}
                        items={analysis.upgradeRecommendations.psu}
                        globalBestId={bestGlobalUpgrade?.rec.part.id ?? null}
                        onApply={onApplyPart}
                      />
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="bg-[#E5EEE6]/60 dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] p-8 text-center">
                <p className="text-sm font-medium text-[#202521] dark:text-[#EEF2EE]">
                  Selecione ao menos a Placa-mãe, GPU ou CPU para gerar as recomendações.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
