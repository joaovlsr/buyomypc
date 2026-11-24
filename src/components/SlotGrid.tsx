import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import {
  AnyHardwarePart,
  BuildAnalysis,
  HardwareCategory,
  SelectedBuild,
} from '../types/hardware';
import { checkPartCompatibilityAgainstBuild, formatStorageCapacity } from '../utils/pcAdvisor';
import { CATEGORY_LABELS, CATEGORY_SHORT_LABELS, HardwareIcon } from './HardwareIcon';
import { HARDWARE_CATEGORY_IMAGES, HardwareImage } from './HardwareVisuals';

interface SlotGridProps {
  build: SelectedBuild;
  analysis: BuildAnalysis;
  onOpenPicker: (category: HardwareCategory) => void;
  onClearSlot: (category: HardwareCategory) => void;
}

interface SlotDefinition {
  category: HardwareCategory;
  cardTitle: string;
  part: AnyHardwarePart | null;
  emptyHint: string;
}

function getKeySpecLine(part: AnyHardwarePart): string {
  switch (part.category) {
    case HardwareCategory.GPU:
      return `${part.vramGB}GB VRAM · ${part.tdpWatts}W · PCIe ${part.pcieGen}.0`;
    case HardwareCategory.CPU:
      return `${part.socket} · ${part.cores}C/${part.threads}T · ${part.boostClockGHz} GHz`;
    case HardwareCategory.MOTHERBOARD:
      return `${part.socket} · ${part.chipset} · ${part.ramType}`;
    case HardwareCategory.RAM:
      return `${part.type} · ${part.capacityGB}GB · ${part.speedMTs} MT/s`;
    case HardwareCategory.STORAGE:
      return `${part.storageType} · ${formatStorageCapacity(part.capacityGB)} · ${part.readMBs} MB/s`;
    case HardwareCategory.PSU:
      return `${part.wattage}W · ${part.efficiency} · ${part.modular}`;
  }
}

export function SlotGrid({ build, analysis, onOpenPicker, onClearSlot }: SlotGridProps) {
  const slots: SlotDefinition[] = [
    {
      category: HardwareCategory.MOTHERBOARD,
      cardTitle: 'Placa-mãe',
      part: build.motherboard,
      emptyHint: 'Base, socket AM4/AM5/LGA e DDR',
    },
    {
      category: HardwareCategory.CPU,
      cardTitle: 'Processador',
      part: build.cpu,
      emptyHint: 'Mais velocidade para suas tarefas',
    },
    {
      category: HardwareCategory.GPU,
      cardTitle: 'Placa de vídeo',
      part: build.gpu,
      emptyHint: 'Gráficos incríveis e mais FPS',
    },
    {
      category: HardwareCategory.RAM,
      cardTitle: 'Memória RAM',
      part: build.ram,
      emptyHint: 'Multitarefas sem travar',
    },
    {
      category: HardwareCategory.STORAGE,
      cardTitle: 'Armazenamento',
      part: build.storage,
      emptyHint: 'HDs, SSDs SATA e NVMe M.2',
    },
    {
      category: HardwareCategory.PSU,
      cardTitle: 'Fonte',
      part: build.psu,
      emptyHint: 'Energia estável e folga elétrica',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {slots.map(({ category, cardTitle, part, emptyHint }, idx) => {
        const compat = part
          ? checkPartCompatibilityAgainstBuild(part, build)
          : { compatible: true };

        const slotErrorIssue = part
          ? analysis.issues.find((i) => i.severity === 'error' && i.category === category)
          : undefined;

        const isBottleneckedSlot =
          (category === HardwareCategory.CPU && analysis.balanceStatus === 'cpu_bottleneck') ||
          (category === HardwareCategory.GPU && analysis.balanceStatus === 'gpu_bottleneck');

        const redAlertMessage =
          (!compat.compatible && compat.reason) ||
          slotErrorIssue?.title ||
          (isBottleneckedSlot ? analysis.bottleneckDetail : null);

        const hasRedAlert = Boolean(redAlertMessage);

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.26, delay: idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={`group rounded-[14px] border flex flex-col justify-between overflow-hidden transition-all ${
              hasRedAlert
                ? 'bg-red-50/90 dark:bg-red-950/35 border-red-300 dark:border-red-800/80 shadow-xs'
                : part
                  ? 'bg-white dark:bg-[#191F1B] border-[#315C45]/45 dark:border-[#6F9278]/55 shadow-xs hover:border-[#315C45]'
                  : 'bg-white dark:bg-[#191F1B] border-[#DCE4DD] dark:border-[#2A352D] hover:border-[#6F9278] dark:hover:border-[#6F9278]/70'
            }`}
          >
            {/* Clickable Top Image + Component Info */}
            <button
              type="button"
              onClick={() => onOpenPicker(category)}
              className="text-left flex-1 flex flex-col focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#315C45]"
            >
              {/* Studio Product Image Stage */}
              <div
                className={`relative w-full aspect-[4/3] overflow-hidden border-b ${
                  hasRedAlert
                    ? 'border-red-200 dark:border-red-900/60 bg-red-100/40 dark:bg-red-950/40'
                    : 'border-[#DCE4DD]/70 dark:border-[#2A352D] bg-[#F6F7F3] dark:bg-[#151A16]'
                }`}
              >
                <HardwareImage
                  src={HARDWARE_CATEGORY_IMAGES[category].src}
                  alt={HARDWARE_CATEGORY_IMAGES[category].alt}
                  fallbackCategory={category}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                    part ? 'opacity-100' : 'opacity-90'
                  }`}
                />

                {/* Corner Status Tag */}
                <span
                  className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-xs border ${
                    hasRedAlert
                      ? 'bg-red-600 text-white border-red-500'
                      : part
                        ? 'bg-[#315C45]/90 text-white border-[#315C45]'
                        : 'bg-white/90 dark:bg-[#191F1B]/90 text-[#4E5A50] dark:text-[#C4D0C6] border-[#DCE4DD] dark:border-[#2A352D]'
                  }`}
                >
                  <HardwareIcon category={category} className="w-3 h-3 shrink-0" />
                  <span>{CATEGORY_SHORT_LABELS[category]}</span>
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-2 w-full">
                {part ? (
                  <motion.div
                    key={part.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5 text-[11px] font-medium">
                      <span className="text-[#315C45] dark:text-[#A3C7AD] font-semibold">
                        {part.brand}
                      </span>
                      {hasRedAlert ? (
                        <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold">
                          <ShieldAlert className="w-3 h-3" aria-hidden="true" />
                          <span>Alerta</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#315C45] dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                          <span>OK</span>
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE] line-clamp-2 leading-snug">
                      {part.name}
                    </div>

                    <p className="text-[11px] text-[#5C675E] dark:text-[#98A69B] font-mono tabular-nums truncate">
                      {getKeySpecLine(part)}
                    </p>

                    {hasRedAlert && redAlertMessage && (
                      <div className="mt-1.5 rounded-[8px] bg-red-100/90 dark:bg-red-900/45 border border-red-200 dark:border-red-800/60 px-2.5 py-1.5 text-[11px] font-semibold text-red-800 dark:text-red-300 leading-snug flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="line-clamp-2">{redAlertMessage}</span>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
                      {cardTitle}
                    </h3>
                    <p className="text-xs text-[#5C675E] dark:text-[#98A69B] leading-snug">
                      {emptyHint}
                    </p>
                  </div>
                )}
              </div>
            </button>

            {/* Card Footer Action Strip (matches mockup circular -> arrow + swap/clear) */}
            <div
              className={`px-4 py-3 border-t flex items-center justify-between gap-2 ${
                hasRedAlert
                  ? 'border-red-200 dark:border-red-900/60 bg-red-100/40 dark:bg-red-950/30'
                  : 'border-[#DCE4DD]/70 dark:border-[#2A352D] bg-[#F6F7F3]/60 dark:bg-[#151A16]/60'
              }`}
            >
              {part ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenPicker(category)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#315C45] dark:text-[#A3C7AD] hover:text-[#264836] dark:hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Trocar peça</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearSlot(category)}
                    aria-label={`Remover ${CATEGORY_LABELS[category]}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[#5C675E] dark:text-[#98A69B] hover:text-red-700 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenPicker(category)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#315C45] dark:text-[#A3C7AD] group-hover:text-[#264836] dark:group-hover:text-white transition-colors"
                >
                  <span>Selecionar Peça</span>
                  <span className="w-7 h-7 rounded-full bg-[#315C45] group-hover:bg-[#264836] dark:bg-[#3B6E52] text-white inline-flex items-center justify-center transition-transform group-hover:translate-x-0.5 shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
