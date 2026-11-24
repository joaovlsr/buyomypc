import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Check, Search, X } from 'lucide-react';
import {
  CPU_DATABASE,
  GPU_DATABASE,
  MOTHERBOARD_DATABASE,
  PSU_DATABASE,
  RAM_DATABASE,
  STORAGE_DATABASE,
} from '../data/hardwareDatabase';
import {
  AnyHardwarePart,
  HardwareCategory,
  SelectedBuild,
  StorageType,
} from '../types/hardware';
import { checkPartCompatibilityAgainstBuild, formatStorageCapacity } from '../utils/pcAdvisor';
import { CATEGORY_LABELS, HardwareIcon } from './HardwareIcon';
import { HARDWARE_CATEGORY_IMAGES, HardwareImage } from './HardwareVisuals';

interface HardwarePickerModalProps {
  category: HardwareCategory | null;
  build: SelectedBuild;
  titlePrefix?: string;
  onSelect: (part: AnyHardwarePart) => void;
  onClose: () => void;
}

type StorageTypeFilter = 'ALL' | StorageType;

function getSpecsSummary(part: AnyHardwarePart): string {
  switch (part.category) {
    case HardwareCategory.CPU:
      return `${part.brand} · Socket ${part.socket} · ${part.cores}C/${part.threads}T · ${part.boostClockGHz} GHz · TDP ${part.tdpWatts}W${part.integratedGpu ? ` · ${part.integratedGpu}` : ''}`;
    case HardwareCategory.MOTHERBOARD:
      return `${part.brand} · ${part.socket} · Chipset ${part.chipset} · ${part.ramType} · PCIe ${part.pcieGen}.0 · ${part.formFactor}`;
    case HardwareCategory.GPU:
      return `${part.brand} · ${part.vramGB}GB VRAM · TDP ${part.tdpWatts}W · Fonte rec. ${part.recommendedPsuWatts}W · Foco ${part.targetResolution}`;
    case HardwareCategory.RAM:
      return `${part.brand} · ${part.type} · ${part.capacityGB}GB (${part.modules}) · ${part.speedMTs} MT/s CL${part.casLatency}`;
    case HardwareCategory.STORAGE:
      return `${part.brand} · ${part.storageType} · ${formatStorageCapacity(part.capacityGB)} · ${part.interfaceLabel} · ${part.readMBs}/${part.writeMBs} MB/s`;
    case HardwareCategory.PSU:
      return `${part.brand} · ${part.wattage}W · ${part.efficiency} · ${part.modular}${part.atx3 ? ' · ATX 3.0+' : ''}`;
  }
}

export function HardwarePickerModal({
  category,
  build,
  titlePrefix = 'Selecionar',
  onSelect,
  onClose,
}: HardwarePickerModalProps) {
  const [query, setQuery] = useState('');
  const [storageTypeFilter, setStorageTypeFilter] = useState<StorageTypeFilter>('ALL');

  useEffect(() => {
    setQuery('');
    setStorageTypeFilter('ALL');
  }, [category]);

  useEffect(() => {
    if (!category) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category, onClose]);

  const currentSelectedId = useMemo(() => {
    if (!category) return null;
    switch (category) {
      case HardwareCategory.CPU:
        return build.cpu?.id ?? null;
      case HardwareCategory.MOTHERBOARD:
        return build.motherboard?.id ?? null;
      case HardwareCategory.GPU:
        return build.gpu?.id ?? null;
      case HardwareCategory.RAM:
        return build.ram?.id ?? null;
      case HardwareCategory.STORAGE:
        return build.storage?.id ?? null;
      case HardwareCategory.PSU:
        return build.psu?.id ?? null;
    }
  }, [category, build]);

  const parts = useMemo(() => {
    if (!category) return [];
    let list: AnyHardwarePart[] = [];
    switch (category) {
      case HardwareCategory.CPU:
        list = CPU_DATABASE;
        break;
      case HardwareCategory.MOTHERBOARD:
        list = MOTHERBOARD_DATABASE;
        break;
      case HardwareCategory.GPU:
        list = GPU_DATABASE;
        break;
      case HardwareCategory.RAM:
        list = RAM_DATABASE;
        break;
      case HardwareCategory.STORAGE:
        list = STORAGE_DATABASE;
        break;
      case HardwareCategory.PSU:
        list = PSU_DATABASE;
        break;
    }

    const q = query.trim().toLowerCase();
    return list
      .filter((part) => {
        if (
          category === HardwareCategory.STORAGE &&
          storageTypeFilter !== 'ALL' &&
          part.category === HardwareCategory.STORAGE
        ) {
          return part.storageType === storageTypeFilter;
        }
        return true;
      })
      .map((part) => ({
        part,
        compat: checkPartCompatibilityAgainstBuild(part, build),
        specs: getSpecsSummary(part),
      }))
      .filter(({ part, specs }) => {
        if (!q) return true;
        return (
          part.name.toLowerCase().includes(q) ||
          specs.toLowerCase().includes(q) ||
          part.notes.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.compat.compatible !== b.compat.compatible) {
          return a.compat.compatible ? -1 : 1;
        }
        const aScore =
          a.part.category === HardwareCategory.MOTHERBOARD ? a.part.vrmTier : a.part.tierScore;
        const bScore =
          b.part.category === HardwareCategory.MOTHERBOARD ? b.part.vrmTier : b.part.tierScore;
        return bScore - aScore;
      });
  }, [category, query, build, storageTypeFilter]);

  const compatibleCount = useMemo(
    () => parts.filter((item) => item.compat.compatible).length,
    [parts]
  );
  const incompatibleCount = parts.length - compatibleCount;

  return (
    <AnimatePresence>
      {category && (
        <motion.div
          key="picker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="picker-modal-title"
          onClick={onClose}
        >
          <motion.div
            key="picker-panel"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Category Studio Visual */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[#DCE4DD] dark:border-[#2A352D]">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-16 aspect-[4/3] rounded-[8px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-[#E5EEE6] dark:bg-[#1E2821] shrink-0">
                  <HardwareImage
                    src={HARDWARE_CATEGORY_IMAGES[category].src}
                    alt={HARDWARE_CATEGORY_IMAGES[category].alt}
                    fallbackCategory={category}
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h2
                    id="picker-modal-title"
                    className="text-lg font-semibold text-[#202521] dark:text-[#EEF2EE] truncate"
                  >
                    {titlePrefix} {CATEGORY_LABELS[category]}
                  </h2>
                  <p className="inline-flex items-center gap-1.5 text-xs text-[#5C675E] dark:text-[#98A69B] truncate">
                    <HardwareIcon category={category} className="w-3.5 h-3.5 text-[#315C45] dark:text-[#86AD90] shrink-0" />
                    <span>Lista unificada da base de dados ({parts.length} peças exibidas)</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar janela de seleção"
                className="p-2 text-[#5C675E] dark:text-[#98A69B] hover:text-[#202521] dark:hover:text-white hover:bg-[#E5EEE6]/70 dark:hover:bg-[#1E2821] rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-[#315C45]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search, Optional Storage Sub-Tabs & Unified Legend Toolbar */}
            <div className="px-6 py-3.5 bg-[#F6F7F3] dark:bg-[#151A16] border-b border-[#DCE4DD] dark:border-[#2A352D] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6F9278] dark:text-[#86AD90] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      category === HardwareCategory.STORAGE
                        ? 'Buscar HD, SSD SATA, NVMe, 1TB, 2TB, Samsung...'
                        : 'Buscar modelo, marca, socket ou chipset (ex: 3400G, B450)...'
                    }
                    autoFocus
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[10px] text-[#202521] dark:text-[#EEF2EE] placeholder:text-[#7B867D] focus:outline-none focus:border-[#315C45] focus:ring-1 focus:ring-[#315C45]"
                  />
                </div>
                <div className="flex items-center gap-4 text-xs shrink-0">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[#315C45] dark:text-emerald-300 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 shrink-0" aria-hidden="true" />
                    <span>Compatíveis ({compatibleCount})</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-red-800 dark:text-red-300 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" aria-hidden="true" />
                    <span>Incompatíveis ({incompatibleCount})</span>
                  </span>
                </div>
              </div>

              {category === HardwareCategory.STORAGE && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { id: 'ALL', label: 'Todos os Tipos' },
                      { id: StorageType.NVME, label: 'SSDs NVMe (M.2)' },
                      { id: StorageType.SSD_SATA, label: 'SSDs SATA (2.5")' },
                      { id: StorageType.HD, label: 'HDs (Disco Rígido)' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStorageTypeFilter(item.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        storageTypeFilter === item.id
                          ? 'bg-[#315C45] text-white dark:bg-[#3B6E52]'
                          : 'bg-white dark:bg-[#191F1B] text-[#4E5A50] dark:text-[#C4D0C6] border border-[#DCE4DD] dark:border-[#2A352D] hover:border-[#315C45]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Unified Parts List (Green = Compatible, Red = May Cause Incompatibility) */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#DCE4DD]/80 dark:divide-[#2A352D]">
              {parts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-[#202521] dark:text-[#EEF2EE]">
                    Nenhuma peça encontrada com a busca atual.
                  </p>
                  <p className="text-xs text-[#5C675E] dark:text-[#98A69B] mt-1">
                    Tente limpar ou alterar os termos digitados para visualizar todas as opções disponíveis.
                  </p>
                </div>
              ) : (
                parts.map(({ part, compat, specs }) => {
                  const isSelected = part.id === currentSelectedId;
                  const rowTone = compat.compatible
                    ? isSelected
                      ? 'bg-[#D6E6D8] dark:bg-emerald-950/60 ring-1 ring-inset ring-[#315C45]/45'
                      : 'bg-emerald-50/75 hover:bg-emerald-100/75 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50'
                    : isSelected
                      ? 'bg-red-100/90 dark:bg-red-950/65 ring-1 ring-inset ring-red-500/40'
                      : 'bg-red-50/80 hover:bg-red-100/75 dark:bg-red-950/35 dark:hover:bg-red-950/55';

                  return (
                    <div
                      key={part.id}
                      className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${rowTone}`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-semibold text-[#202521] dark:text-[#EEF2EE]">
                            {part.name}
                          </span>
                          {compat.compatible ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#315C45] dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              {isSelected ? 'Selecionada · Compatível' : 'Compatível'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 dark:text-red-400">
                              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                              {isSelected ? 'Selecionada · Risco de Conflito' : 'Pode causar incompatibilidade'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#4E5A50] dark:text-[#C4D0C6] font-mono tabular-nums">
                          {specs}
                        </p>
                        <p className="text-xs text-[#5C675E] dark:text-[#98A69B]">{part.notes}</p>
                        {!compat.compatible && compat.reason && (
                          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 dark:text-red-300 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{compat.reason}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelect(part);
                            onClose();
                          }}
                          className={`px-4 py-2 text-xs font-semibold rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 min-h-[40px] ${
                            isSelected
                              ? 'bg-[#202521] dark:bg-[#2A352D] text-white'
                              : compat.compatible
                                ? 'bg-[#315C45] text-white hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262]'
                                : 'bg-white/95 dark:bg-[#191F1B] text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50'
                          }`}
                        >
                          {isSelected
                            ? 'Manter Peça'
                            : compat.compatible
                              ? 'Selecionar'
                              : 'Selecionar mesmo assim'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
