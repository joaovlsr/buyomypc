export enum HardwareCategory {
  GPU = 'GPU',
  CPU = 'CPU',
  MOTHERBOARD = 'MOTHERBOARD',
  RAM = 'RAM',
  STORAGE = 'STORAGE',
  PSU = 'PSU',
}

export enum StorageType {
  HD = 'HD',
  SSD_SATA = 'SSD SATA',
  NVME = 'SSD NVMe',
}

export enum SocketType {
  LGA1151 = 'LGA1151',
  LGA1200 = 'LGA1200',
  AM4 = 'AM4',
  AM5 = 'AM5',
  LGA1700 = 'LGA1700',
  LGA1851 = 'LGA1851',
}

export enum RamType {
  DDR4 = 'DDR4',
  DDR5 = 'DDR5',
}

export enum CpuRamSupport {
  DDR4 = 'DDR4',
  DDR5 = 'DDR5',
  DDR4_OR_DDR5 = 'DDR4_OR_DDR5',
}

export enum BuildGoal {
  VALUE = 'VALUE',
  BALANCED = 'BALANCED',
  PERFORMANCE = 'PERFORMANCE',
}

export enum TargetResolution {
  R1080P = '1080p',
  R1440P = '1440p',
  R4K = '4K',
}

export interface CpuPart {
  id: string;
  category: HardwareCategory.CPU;
  name: string;
  brand: 'AMD' | 'Intel';
  socket: SocketType;
  supportedRam: CpuRamSupport;
  cores: number;
  threads: number;
  boostClockGHz: number;
  tdpWatts: number;
  tierScore: number; // 1 - 100 relative compute/gaming strength
  pcieGen: 3 | 4 | 5;
  releaseYear: number;
  integratedGpu?: string;
  incompatibleChipsets?: string[];
  notes: string;
}

export interface MotherboardPart {
  id: string;
  category: HardwareCategory.MOTHERBOARD;
  name: string;
  brand: string;
  socket: SocketType;
  chipset: string;
  ramType: RamType;
  maxRamGB: number;
  ramSlots: number;
  formFactor: 'ATX' | 'mATX' | 'ITX';
  pcieGen: 3 | 4 | 5;
  m2Slots: number;
  vrmTier: number; // 1 - 100 power delivery capability
  notes: string;
}

export interface GpuPart {
  id: string;
  category: HardwareCategory.GPU;
  name: string;
  brand: 'NVIDIA' | 'AMD';
  vramGB: number;
  tdpWatts: number;
  recommendedPsuWatts: number;
  requiresAtx3Connector: boolean;
  pcieGen: 3 | 4 | 5;
  tierScore: number; // 1 - 100 relative raster/gaming strength
  targetResolution: TargetResolution;
  lengthMm: number;
  notes: string;
}

export interface RamPart {
  id: string;
  category: HardwareCategory.RAM;
  name: string;
  brand: string;
  type: RamType;
  capacityGB: number;
  modules: string;
  speedMTs: number;
  casLatency: number;
  tierScore: number; // 1 - 100
  notes: string;
}

export interface StoragePart {
  id: string;
  category: HardwareCategory.STORAGE;
  name: string;
  brand: string;
  storageType: StorageType;
  capacityGB: number;
  interfaceLabel: string;
  formFactor: '3.5"' | '2.5"' | 'M.2 2280';
  pcieGen?: 3 | 4 | 5;
  readMBs: number;
  writeMBs: number;
  tierScore: number; // 1 - 100 relative responsiveness & bandwidth
  notes: string;
}

export interface PsuPart {
  id: string;
  category: HardwareCategory.PSU;
  name: string;
  brand: string;
  wattage: number;
  efficiency: '80+ White' | '80+ Bronze' | '80+ Gold' | '80+ Platinum';
  modular: 'Não Modular' | 'Semi-Modular' | 'Full Modular';
  atx3: boolean;
  tierScore: number; // 1 - 100
  notes: string;
}

export type AnyHardwarePart =
  | CpuPart
  | MotherboardPart
  | GpuPart
  | RamPart
  | StoragePart
  | PsuPart;

export interface SelectedBuild {
  cpu: CpuPart | null;
  motherboard: MotherboardPart | null;
  gpu: GpuPart | null;
  ram: RamPart | null;
  storage: StoragePart | null;
  psu: PsuPart | null;
}

export type DiagnosticSeverity = 'ok' | 'warning' | 'error';

export interface DiagnosticIssue {
  id: string;
  severity: DiagnosticSeverity;
  category: HardwareCategory | 'SYSTEM';
  title: string;
  detail: string;
}

export interface PartRecommendation<T extends AnyHardwarePart> {
  part: T;
  reason: string;
  fitLabel: string;
  estimatedGainPercent?: number;
  isPlatformChange?: boolean;
  compatibleWithCurrent: boolean;
}

export interface TierBuildSuggestion {
  goal: BuildGoal;
  title: string;
  subtitle: string;
  completedBuild: SelectedBuild;
  suggestedSlots: HardwareCategory[];
  estimatedLoadWatts: number;
  recommendedPsuWatts: number;
  balanceNote: string;
}

export interface BuildAnalysis {
  compatibilityStatus: DiagnosticSeverity;
  issues: DiagnosticIssue[];
  estimatedLoadWatts: number;
  recommendedPsuWatts: number;
  psuHeadroomPercent: number | null;
  balanceStatus: 'balanced' | 'cpu_bottleneck' | 'gpu_bottleneck' | 'incomplete';
  balanceSummary: string;
  bottleneckDetail: string | null;
  selectedCount: number;
  platformSummary: string;
  tierSuggestions: TierBuildSuggestion[];
  missingSlotRecommendations: {
    cpu: PartRecommendation<CpuPart>[];
    motherboard: PartRecommendation<MotherboardPart>[];
    gpu: PartRecommendation<GpuPart>[];
    ram: PartRecommendation<RamPart>[];
    storage: PartRecommendation<StoragePart>[];
    psu: PartRecommendation<PsuPart>[];
  };
  upgradeRecommendations: {
    cpu: PartRecommendation<CpuPart>[];
    motherboard: PartRecommendation<MotherboardPart>[];
    gpu: PartRecommendation<GpuPart>[];
    ram: PartRecommendation<RamPart>[];
    storage: PartRecommendation<StoragePart>[];
    psu: PartRecommendation<PsuPart>[];
  };
  prioritySummary: string[];
}

export type ChangeActionType = 'add' | 'upgrade' | 'replace_conflict' | 'keep';

export interface PlannedChangeItem {
  category: HardwareCategory;
  action: ChangeActionType;
  fromName: string | null;
  toName: string;
  reason: string;
  gainPercent?: number;
}

export interface SimulationTierPlan {
  goal: BuildGoal;
  title: 'Entrada' | 'Equilibrado' | 'Máximo Desempenho';
  subtitle: string;
  futureBuild: SelectedBuild;
  changes: PlannedChangeItem[];
}

export interface SavedDiagnosticSnapshot {
  savedAt: string;
  buildIds: {
    cpu: string | null;
    motherboard: string | null;
    gpu: string | null;
    ram: string | null;
    storage?: string | null;
    psu: string | null;
  };
  compatibilityStatus: DiagnosticSeverity;
  balanceStatus: BuildAnalysis['balanceStatus'];
  balanceSummary: string;
  issues: DiagnosticIssue[];
  prioritySummary: string[];
  simulationPlans: SimulationTierPlan[];
}

