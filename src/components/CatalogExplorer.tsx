import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Plus, Search } from 'lucide-react';
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
import { CATEGORY_SHORT_LABELS, HardwareIcon } from './HardwareIcon';
import {
  BANNER_IMAGES,
  HARDWARE_CATEGORY_IMAGES,
  HardwareImage,
} from './HardwareVisuals';

interface CatalogExplorerProps {
  build: SelectedBuild;
  externalSearch?: string;
  onApplyPart: (part: AnyHardwarePart) => void;
  onBackToConfigurator: () => void;
}

type FilterCategory = 'ALL' | HardwareCategory;
type StorageSubFilter = 'ALL' | StorageType;

function getTechnicalSpecs(part: AnyHardwarePart): string {
  switch (part.category) {
    case HardwareCategory.GPU:
      return `${part.vramGB}GB VRAM · ${part.tdpWatts}W · PCIe ${part.pcieGen}.0 · ${part.targetResolution}`;
    case HardwareCategory.CPU:
      return `${part.socket} · ${part.cores}C/${part.threads}T · ${part.boostClockGHz} GHz · ${part.tdpWatts}W${part.integratedGpu ? ` · ${part.integratedGpu}` : ''}`;
    case HardwareCategory.MOTHERBOARD:
      return `${part.socket} · ${part.chipset} · ${part.ramType} · PCIe ${part.pcieGen}.0 · ${part.formFactor}`;
    case HardwareCategory.RAM:
      return `${part.type} · ${part.capacityGB}GB (${part.modules}) · ${part.speedMTs} MT/s CL${part.casLatency}`;
    case HardwareCategory.STORAGE:
      return `${part.storageType} · ${formatStorageCapacity(part.capacityGB)} · ${part.interfaceLabel} · ${part.readMBs}/${part.writeMBs} MB/s`;
    case HardwareCategory.PSU:
      return `${part.wattage}W · ${part.efficiency} · ${part.modular}${part.atx3 ? ' · ATX 3.0+' : ''}`;
  }
}

export function CatalogExplorer({
  build,
  externalSearch,
  onApplyPart,
  onBackToConfigurator,
}: CatalogExplorerProps) {
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('ALL');
  const [storageSubFilter, setStorageSubFilter] = useState<StorageSubFilter>('ALL');
  const [search, setSearch] = useState(externalSearch ?? '');

  useEffect(() => {
    if (externalSearch !== undefined) {
      setSearch(externalSearch);
    }
  }, [externalSearch]);

  useEffect(() => {
    if (categoryFilter !== HardwareCategory.STORAGE) {
      setStorageSubFilter('ALL');
    }
  }, [categoryFilter]);

  const selectedIds = useMemo(
    () =>
      new Set(
        [
          build.cpu?.id,
          build.motherboard?.id,
          build.gpu?.id,
          build.ram?.id,
          build.storage?.id,
          build.psu?.id,
        ].filter(Boolean)
      ),
    [build]
  );

  const allParts: AnyHardwarePart[] = useMemo(
    () => [
      ...MOTHERBOARD_DATABASE,
      ...CPU_DATABASE,
      ...GPU_DATABASE,
      ...RAM_DATABASE,
      ...STORAGE_DATABASE,
      ...PSU_DATABASE,
    ],
    []
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allParts
      .filter((part) => categoryFilter === 'ALL' || part.category === categoryFilter)
      .filter((part) => {
        if (
          categoryFilter === HardwareCategory.STORAGE &&
          storageSubFilter !== 'ALL' &&
          part.category === HardwareCategory.STORAGE
        ) {
          return part.storageType === storageSubFilter;
        }
        return true;
      })
      .map((part) => ({
        part,
        specs: getTechnicalSpecs(part),
        compat: checkPartCompatibilityAgainstBuild(part, build),
        isSelected: selectedIds.has(part.id),
      }))
      .filter(({ part, specs }) => {
        if (!q) return true;
        return (
          part.name.toLowerCase().includes(q) ||
          specs.toLowerCase().includes(q) ||
          part.brand.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.compat.compatible !== b.compat.compatible) {
          return a.compat.compatible ? -1 : 1;
        }
        return 0;
      });
  }, [allParts, categoryFilter, storageSubFilter, search, build, selectedIds]);

  const compatibleCount = useMemo(
    () => filteredRows.filter((row) => row.compat.compatible).length,
    [filteredRows]
  );
  const incompatibleCount = filteredRows.length - compatibleCount;

  const filterTabs: { id: FilterCategory; label: string }[] = [
    { id: 'ALL', label: `Todas (${allParts.length})` },
    { id: HardwareCategory.MOTHERBOARD, label: `Placas-mãe (${MOTHERBOARD_DATABASE.length})` },
    { id: HardwareCategory.CPU, label: `CPUs (${CPU_DATABASE.length})` },
    { id: HardwareCategory.GPU, label: `GPUs (${GPU_DATABASE.length})` },
    { id: HardwareCategory.RAM, label: `Memórias (${RAM_DATABASE.length})` },
    { id: HardwareCategory.STORAGE, label: `Armazenamento (${STORAGE_DATABASE.length})` },
    { id: HardwareCategory.PSU, label: `Fontes (${PSU_DATABASE.length})` },
  ];

  const categoryCards: {
    category: HardwareCategory;
    title: string;
    subtitle: string;
    count: number;
  }[] = [
    {
      category: HardwareCategory.MOTHERBOARD,
      title: 'Placas-mãe',
      subtitle: 'Sockets AM4, AM5 e LGA',
      count: MOTHERBOARD_DATABASE.length,
    },
    {
      category: HardwareCategory.CPU,
      title: 'Processadores',
      subtitle: 'Ryzen e Intel Core',
      count: CPU_DATABASE.length,
    },
    {
      category: HardwareCategory.GPU,
      title: 'Placas de Vídeo',
      subtitle: 'FHD, QHD e 4K',
      count: GPU_DATABASE.length,
    },
    {
      category: HardwareCategory.RAM,
      title: 'Memória RAM',
      subtitle: 'Kits DDR4 e DDR5',
      count: RAM_DATABASE.length,
    },
    {
      category: HardwareCategory.STORAGE,
      title: 'Armazenamento',
      subtitle: 'HDs, SSDs e NVMe',
      count: STORAGE_DATABASE.length,
    },
    {
      category: HardwareCategory.PSU,
      title: 'Fontes',
      subtitle: 'Eficiência e ATX 3.0',
      count: PSU_DATABASE.length,
    },
  ];

  return (
    <section aria-label="Base de Dados de Hardware" className="space-y-6">
      {/* Window Banner */}
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
              Base de Dados de Hardware
            </h1>
            <p className="text-sm text-[#4E5A50] dark:text-[#A9B6AC] max-w-2xl">
              Consulte todas as {allParts.length} peças registradas no site em uma tabela unificada: verde indica compatibilidade e vermelho aponta possível conflito ou gargalo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs self-start bg-[#F6F7F3] dark:bg-[#151A16] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[10px] px-3.5 py-2.5">
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

        <div className="lg:col-span-4 relative rounded-[10px] overflow-hidden border border-[#DCE4DD] dark:border-[#2A352D] bg-[#E5EEE6] dark:bg-[#1E2821] aspect-[16/9] lg:aspect-auto lg:min-h-[170px]">
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
              Catálogo Verificado
            </p>
            <p className="text-xs sm:text-sm font-semibold leading-snug mt-0.5">
              {allParts.length} componentes indexados por compatibilidade
            </p>
          </div>
        </div>
      </div>

      {/* Visual Hardware Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categoryCards.map(({ category, title, subtitle, count }) => {
          const isActive = categoryFilter === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() =>
                setCategoryFilter((prev) => (prev === category ? 'ALL' : category))
              }
              className={`group text-left rounded-[12px] border p-2.5 transition-all flex flex-col gap-2.5 ${
                isActive
                  ? 'bg-[#E5EEE6]/70 dark:bg-[#1E2821] border-[#315C45] dark:border-[#6F9278] ring-1 ring-[#315C45]/30'
                  : 'bg-white dark:bg-[#191F1B] border-[#DCE4DD] dark:border-[#2A352D] hover:border-[#6F9278] dark:hover:border-[#6F9278]/70'
              }`}
            >
              <div className="w-full aspect-[4/3] rounded-[8px] overflow-hidden border border-[#DCE4DD]/80 dark:border-[#2A352D] bg-[#F6F7F3] dark:bg-[#151A16]">
                <HardwareImage
                  src={HARDWARE_CATEGORY_IMAGES[category].src}
                  alt={HARDWARE_CATEGORY_IMAGES[category].alt}
                  fallbackCategory={category}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <div className="px-0.5 space-y-0.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#202521] dark:text-[#EEF2EE] truncate">
                    <HardwareIcon
                      category={category}
                      className="w-3.5 h-3.5 text-[#315C45] dark:text-[#86AD90] shrink-0"
                    />
                    <span className="truncate">{title}</span>
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[#5C675E] dark:text-[#98A69B] shrink-0">
                    {count}
                  </span>
                </div>
                <p className="text-[11px] text-[#5C675E] dark:text-[#98A69B] truncate">
                  {subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar */}
      <div className="space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#E5EEE6] dark:bg-[#1E2821] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[10px] overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === tab.id
                    ? 'bg-[#315C45] text-white shadow-xs dark:bg-[#3B6E52]'
                    : 'text-[#315C45] dark:text-[#A3C7AD] hover:bg-white/60 dark:hover:bg-[#191F1B]/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-[#6F9278] dark:text-[#86AD90] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar catálogo (ex: NVMe, SSD, HD, RTX)..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[10px] text-[#202521] dark:text-[#EEF2EE] placeholder:text-[#7B867D] focus:outline-none focus:border-[#315C45] focus:ring-1 focus:ring-[#315C45]"
            />
          </div>
        </div>

        {categoryFilter === HardwareCategory.STORAGE && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
              Tipo de armazenamento:
            </span>
            {(
              [
                { id: 'ALL', label: 'Todos (HD + SSD + NVMe)' },
                { id: StorageType.NVME, label: 'SSDs NVMe (M.2)' },
                { id: StorageType.SSD_SATA, label: 'SSDs SATA (2.5")' },
                { id: StorageType.HD, label: 'HDs (Mecânico 3.5")' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStorageSubFilter(item.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  storageSubFilter === item.id
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

      {/* Unified Data Table */}
      <div className="bg-white dark:bg-[#191F1B] border border-[#DCE4DD] dark:border-[#2A352D] rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DCE4DD] dark:border-[#2A352D] bg-[#F6F7F3] dark:bg-[#151A16] text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Modelo</th>
                <th className="py-3 px-4">Especificações Técnicas</th>
                <th className="py-3 px-4">Compatibilidade</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE4DD]/80 dark:divide-[#2A352D] text-sm">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 px-4 text-center text-[#5C675E] dark:text-[#98A69B] text-sm">
                    Nenhum componente encontrado para os critérios selecionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map(({ part, specs, compat, isSelected }) => {
                  const rowTone = compat.compatible
                    ? 'bg-emerald-50/75 hover:bg-emerald-100/75 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45'
                    : 'bg-red-50/80 hover:bg-red-100/75 dark:bg-red-950/30 dark:hover:bg-red-950/50';

                  return (
                    <tr
                      key={part.id}
                      className={`transition-colors ${rowTone}`}
                    >
                      <td className="py-3 px-4 text-xs font-medium text-[#4E5A50] dark:text-[#C4D0C6] whitespace-nowrap">
                        {CATEGORY_SHORT_LABELS[part.category]}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#202521] dark:text-[#EEF2EE] whitespace-nowrap">
                        {part.name}
                      </td>
                      <td className="py-3 px-4 text-xs font-mono tabular-nums text-[#4E5A50] dark:text-[#C4D0C6] whitespace-nowrap">
                        {specs}
                      </td>
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        {compat.compatible ? (
                          <span className="inline-flex items-center gap-1.5 text-[#315C45] dark:text-emerald-400 font-semibold">
                            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Compatível</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold"
                            title={compat.reason}
                          >
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate max-w-[240px]">{compat.reason}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onApplyPart(part);
                            onBackToConfigurator();
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-[10px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315C45] whitespace-nowrap shrink-0 ${
                            isSelected
                              ? 'bg-[#202521] dark:bg-[#2A352D] text-white'
                              : compat.compatible
                                ? 'bg-[#315C45] text-white hover:bg-[#264836] dark:bg-[#3B6E52] dark:hover:bg-[#478262]'
                                : 'bg-white/95 dark:bg-[#191F1B] text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/50'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>No Setup</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Usar no Setup</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
