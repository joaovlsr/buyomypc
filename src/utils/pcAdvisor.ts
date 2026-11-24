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
  BuildAnalysis,
  BuildGoal,
  CpuPart,
  CpuRamSupport,
  DiagnosticIssue,
  DiagnosticSeverity,
  GpuPart,
  HardwareCategory,
  MotherboardPart,
  PartRecommendation,
  PlannedChangeItem,
  PsuPart,
  RamPart,
  RamType,
  SavedDiagnosticSnapshot,
  SelectedBuild,
  SimulationTierPlan,
  StoragePart,
  StorageType,
  TargetResolution,
  TierBuildSuggestion,
} from '../types/hardware';

export function formatStorageCapacity(capacityGB: number): string {
  if (capacityGB >= 1000) {
    const tb = capacityGB / 1000;
    return Number.isInteger(tb) ? `${tb}TB` : `${tb.toFixed(1)}TB`;
  }
  return `${capacityGB}GB`;
}

const DEFAULT_RESOLUTION = TargetResolution.R1440P;

function getEffectiveCpuPeakWatts(cpu: CpuPart): number {
  if (cpu.brand === 'Intel' && cpu.tdpWatts >= 125) {
    if (cpu.cores >= 24) return 253;
    if (cpu.cores >= 20) return 225;
    return 181;
  }
  if (cpu.brand === 'AMD' && cpu.tdpWatts >= 170) {
    return 210;
  }
  if (cpu.tdpWatts >= 105) {
    return Math.round(cpu.tdpWatts * 1.25);
  }
  return Math.round(cpu.tdpWatts * 1.15);
}

export function isVrmSafe(cpu: CpuPart, mb: MotherboardPart): boolean {
  if (cpu.brand === 'Intel' && cpu.tdpWatts >= 125 && cpu.cores >= 20) {
    return mb.vrmTier >= 80;
  }
  if (cpu.tdpWatts >= 170) {
    return mb.vrmTier >= 80;
  }
  if (cpu.tdpWatts >= 105) {
    return mb.vrmTier >= 55;
  }
  return true;
}

export function isCpuCompatibleWithMotherboard(cpu: CpuPart, mb: MotherboardPart): boolean {
  if (cpu.socket !== mb.socket) return false;
  if (cpu.supportedRam === CpuRamSupport.DDR4 && mb.ramType !== RamType.DDR4) return false;
  if (cpu.supportedRam === CpuRamSupport.DDR5 && mb.ramType !== RamType.DDR5) return false;
  if (cpu.incompatibleChipsets && cpu.incompatibleChipsets.includes(mb.chipset)) return false;
  return true;
}

export function isRamCompatibleWithMotherboard(ram: RamPart, mb: MotherboardPart): boolean {
  if (ram.type !== mb.ramType) return false;
  if (ram.capacityGB > mb.maxRamGB) return false;
  return true;
}

export function isRamCompatibleWithCpu(ram: RamPart, cpu: CpuPart): boolean {
  if (cpu.supportedRam === CpuRamSupport.DDR4) return ram.type === RamType.DDR4;
  if (cpu.supportedRam === CpuRamSupport.DDR5) return ram.type === RamType.DDR5;
  return true;
}

export function calculatePowerBudget(cpu: CpuPart | null, gpu: GpuPart | null) {
  const cpuWatts = cpu ? getEffectiveCpuPeakWatts(cpu) : 0;
  const gpuWatts = gpu ? gpu.tdpWatts : 0;
  const hasCoreParts = Boolean(cpu || gpu);
  const systemBaseOverhead = hasCoreParts ? 75 : 0;
  const estimatedLoadWatts = cpuWatts + gpuWatts + systemBaseOverhead;
  const calculatedRecommendedPsu = hasCoreParts
    ? Math.ceil((estimatedLoadWatts * 1.35) / 50) * 50
    : 450;
  const recommendedPsuWatts = Math.max(
    gpu ? gpu.recommendedPsuWatts : 0,
    calculatedRecommendedPsu
  );
  return { estimatedLoadWatts, recommendedPsuWatts };
}

export function evaluatePairBalance(
  cpu: CpuPart,
  gpu: GpuPart
): 'balanced' | 'cpu_bottleneck' | 'gpu_bottleneck' {
  const diff = cpu.tierScore - gpu.tierScore;
  if (diff < -12) return 'cpu_bottleneck';
  if (diff > 20) return 'gpu_bottleneck';
  return 'balanced';
}

function collectCriticalIssues(build: SelectedBuild): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  if (build.cpu && build.motherboard) {
    if (build.cpu.socket !== build.motherboard.socket) {
      issues.push({
        id: 'err-cpu-mb-socket',
        severity: 'error',
        category: HardwareCategory.MOTHERBOARD,
        title: 'Incompatibilidade de Socket entre CPU e Placa-mãe',
        detail: `${build.cpu.name} utiliza socket ${build.cpu.socket}, enquanto a ${build.motherboard.name} é ${build.motherboard.socket}. Essas peças não encaixam fisicamente.`,
      });
    } else if (
      build.cpu.incompatibleChipsets &&
      build.cpu.incompatibleChipsets.includes(build.motherboard.chipset)
    ) {
      issues.push({
        id: 'err-cpu-mb-chipset',
        severity: 'error',
        category: HardwareCategory.MOTHERBOARD,
        title: `Chipset ${build.motherboard.chipset} incompatível com ${build.cpu.name}`,
        detail: `Apesar de ambos serem ${build.cpu.socket}, placas-mãe com chipset ${build.motherboard.chipset} não oferecem suporte oficial para o ${build.cpu.name}. Prefira chipsets compatíveis como A320, B450, X470 ou X570.`,
      });
    } else if (!isVrmSafe(build.cpu, build.motherboard)) {
      issues.push({
        id: 'err-mb-vrm',
        severity: 'error',
        category: HardwareCategory.MOTHERBOARD,
        title: 'VRM insuficiente para processador de alto consumo',
        detail: `A ${build.motherboard.name} (chipset ${build.motherboard.chipset}) possui estágio de alimentação abaixo do exigido pelo ${build.cpu.name}, causando estrangulamento térmico sob carga.`,
      });
    }
  }

  if (build.ram && build.motherboard && !isRamCompatibleWithMotherboard(build.ram, build.motherboard)) {
    issues.push({
      id: 'err-ram-mb',
      severity: 'error',
      category: HardwareCategory.RAM,
      title: 'Tipo de memória RAM incompatível com a Placa-mãe',
      detail: `A memória ${build.ram.name} é ${build.ram.type}, mas a placa-mãe ${build.motherboard.name} aceita exclusivamente módulos ${build.motherboard.ramType}.`,
    });
  }

  if (build.ram && build.cpu && !isRamCompatibleWithCpu(build.ram, build.cpu)) {
    issues.push({
      id: 'err-ram-cpu',
      severity: 'error',
      category: HardwareCategory.RAM,
      title: 'Memória RAM não suportada pelo Processador',
      detail: `O ${build.cpu.name} suporta apenas ${build.cpu.supportedRam}, não sendo compatível com ${build.ram.type}.`,
    });
  }

  const { estimatedLoadWatts, recommendedPsuWatts } = calculatePowerBudget(build.cpu, build.gpu);
  if (build.psu && estimatedLoadWatts > 0) {
    if (build.psu.wattage < estimatedLoadWatts) {
      issues.push({
        id: 'err-psu-overload',
        severity: 'error',
        category: HardwareCategory.PSU,
        title: 'Potência da fonte insuficiente para o pico do sistema',
        detail: `Consumo de pico estimado em ${estimatedLoadWatts}W, superando a capacidade nominal da ${build.psu.name} (${build.psu.wattage}W). Recomendado mínimo de ${recommendedPsuWatts}W.`,
      });
    } else if (build.psu.wattage < recommendedPsuWatts) {
      issues.push({
        id: 'err-psu-tight',
        severity: 'error',
        category: HardwareCategory.PSU,
        title: 'Fonte abaixo da margem elétrica recomendada',
        detail: `A fonte de ${build.psu.wattage}W trabalha no limite em picos transientes (${estimatedLoadWatts}W estimados). Para operação segura, utilize uma fonte de ${recommendedPsuWatts}W ou superior.`,
      });
    }
  }

  if (build.cpu && build.gpu) {
    const balance = evaluatePairBalance(build.cpu, build.gpu);
    if (balance === 'cpu_bottleneck') {
      issues.push({
        id: 'err-cpu-bottleneck',
        severity: 'error',
        category: HardwareCategory.CPU,
        title: 'Gargalo de CPU detectado',
        detail: `O ${build.cpu.name} limita o desempenho da ${build.gpu.name}, gerando queda de FPS mínimo e subutilização da placa de vídeo.`,
      });
    } else if (balance === 'gpu_bottleneck') {
      issues.push({
        id: 'err-gpu-bottleneck',
        severity: 'error',
        category: HardwareCategory.GPU,
        title: 'Gargalo de GPU detectado',
        detail: `A ${build.gpu.name} está muito abaixo da capacidade do ${build.cpu.name}. Utilize uma GPU proporcional para evitar subaproveitamento do processador.`,
      });
    }
  }

  return issues;
}

export function isCandidateBuildProblemFree(candidate: SelectedBuild): boolean {
  return collectCriticalIssues(candidate).length === 0;
}

export function checkPartCompatibilityAgainstBuild(
  part: AnyHardwarePart,
  build: SelectedBuild
): { compatible: boolean; reason?: string } {
  const simulated: SelectedBuild = { ...build };
  switch (part.category) {
    case HardwareCategory.CPU:
      simulated.cpu = part;
      break;
    case HardwareCategory.MOTHERBOARD:
      simulated.motherboard = part;
      break;
    case HardwareCategory.GPU:
      simulated.gpu = part;
      break;
    case HardwareCategory.RAM:
      simulated.ram = part;
      break;
    case HardwareCategory.STORAGE:
      simulated.storage = part;
      break;
    case HardwareCategory.PSU:
      simulated.psu = part;
      break;
  }

  const issues = collectCriticalIssues(simulated);
  if (issues.length > 0) {
    return {
      compatible: false,
      reason: issues[0].title,
    };
  }
  return { compatible: true };
}

function scoreCandidate(tierScore: number, anchorScore: number, goal: BuildGoal): number {
  const distance = Math.abs(tierScore - anchorScore);
  if (goal === BuildGoal.VALUE) {
    const overkillPenalty = tierScore > anchorScore + 10 ? (tierScore - anchorScore) * 0.9 : 0;
    return 100 - distance * 1.2 - overkillPenalty;
  }
  if (goal === BuildGoal.PERFORMANCE) {
    return tierScore * 1.45 - distance * 0.35;
  }
  return 100 - distance * 1.35 + tierScore * 0.12;
}

function generateTierSuggestion(
  baseBuild: SelectedBuild,
  tier: BuildGoal
): TierBuildSuggestion | null {
  if (!isCandidateBuildProblemFree(baseBuild)) {
    return null;
  }

  const draft: SelectedBuild = { ...baseBuild };
  const suggestedSlots: HardwareCategory[] = [];
  const tierBaseTarget = tier === BuildGoal.VALUE ? 48 : tier === BuildGoal.BALANCED ? 68 : 96;

  // 1. Fill CPU if missing
  if (!draft.cpu) {
    suggestedSlots.push(HardwareCategory.CPU);
    const compatibleCpus = CPU_DATABASE.filter((cpu) => {
      const testBuild: SelectedBuild = { ...draft, cpu };
      if (!isCandidateBuildProblemFree(testBuild)) return false;

      if (!draft.gpu) {
        const hasMatchingGpu = GPU_DATABASE.some((gpu) =>
          isCandidateBuildProblemFree({ ...testBuild, gpu })
        );
        if (!hasMatchingGpu) return false;
      }

      if (!draft.motherboard) {
        const hasMatchingMb = MOTHERBOARD_DATABASE.some((mb) =>
          isCandidateBuildProblemFree({ ...testBuild, motherboard: mb })
        );
        if (!hasMatchingMb) return false;
      }

      return true;
    });

    if (compatibleCpus.length === 0) return null;

    let cpuTarget = tierBaseTarget;
    if (draft.gpu) {
      const idealBalancedCpu = draft.gpu.tierScore;
      cpuTarget =
        tier === BuildGoal.VALUE
          ? Math.max(20, idealBalancedCpu - 6)
          : tier === BuildGoal.BALANCED
            ? idealBalancedCpu + 2
            : idealBalancedCpu + 12;
    }

    compatibleCpus.sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) {
        return b.tierScore - a.tierScore;
      }
      return Math.abs(a.tierScore - cpuTarget) - Math.abs(b.tierScore - cpuTarget);
    });

    draft.cpu = compatibleCpus[0] ?? null;
  }

  // 2. Fill Motherboard if missing
  if (!draft.motherboard) {
    suggestedSlots.push(HardwareCategory.MOTHERBOARD);
    const compatibleMbs = MOTHERBOARD_DATABASE.filter((mb) =>
      isCandidateBuildProblemFree({ ...draft, motherboard: mb })
    );

    if (compatibleMbs.length === 0) return null;

    const mbTarget = tier === BuildGoal.VALUE ? 54 : tier === BuildGoal.BALANCED ? 76 : 95;
    compatibleMbs.sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) return b.vrmTier - a.vrmTier;
      return Math.abs(a.vrmTier - mbTarget) - Math.abs(b.vrmTier - mbTarget);
    });

    draft.motherboard = compatibleMbs[0] ?? null;
  }

  // 3. Fill RAM if missing (strictly dual-channel)
  if (!draft.ram) {
    suggestedSlots.push(HardwareCategory.RAM);
    const compatibleRams = RAM_DATABASE.filter(
      (ram) =>
        !ram.modules.startsWith('1x') &&
        isCandidateBuildProblemFree({ ...draft, ram })
    );

    if (compatibleRams.length === 0) return null;

    const ramTarget = tier === BuildGoal.VALUE ? 52 : tier === BuildGoal.BALANCED ? 78 : 94;
    compatibleRams.sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) return b.tierScore - a.tierScore;
      return Math.abs(a.tierScore - ramTarget) - Math.abs(b.tierScore - ramTarget);
    });

    draft.ram = compatibleRams[0] ?? null;
  }

  // 4. Fill GPU if missing
  if (!draft.gpu) {
    suggestedSlots.push(HardwareCategory.GPU);
    const compatibleGpus = GPU_DATABASE.filter((gpu) =>
      isCandidateBuildProblemFree({ ...draft, gpu })
    );

    if (compatibleGpus.length === 0) return null;

    const cpuScore = draft.cpu ? draft.cpu.tierScore : tierBaseTarget;
    const gpuTarget =
      tier === BuildGoal.VALUE
        ? Math.min(cpuScore, 48)
        : tier === BuildGoal.BALANCED
          ? Math.min(cpuScore + 2, 76)
          : Math.min(cpuScore + 10, 99);

    compatibleGpus.sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) {
        return b.tierScore - a.tierScore;
      }
      return Math.abs(a.tierScore - gpuTarget) - Math.abs(b.tierScore - gpuTarget);
    });

    draft.gpu = compatibleGpus[0] ?? null;
  }

  // 5. Fill PSU if missing
  const { estimatedLoadWatts, recommendedPsuWatts } = calculatePowerBudget(draft.cpu, draft.gpu);

  if (!draft.psu) {
    suggestedSlots.push(HardwareCategory.PSU);
    const needsAtx3 = Boolean(draft.gpu?.requiresAtx3Connector);
    const eligiblePsus = PSU_DATABASE.filter((psu) => {
      if (!isCandidateBuildProblemFree({ ...draft, psu })) return false;
      if (needsAtx3 && !psu.atx3) return false;
      return true;
    });

    const fallbackPsus =
      eligiblePsus.length > 0
        ? eligiblePsus
        : PSU_DATABASE.filter((psu) => isCandidateBuildProblemFree({ ...draft, psu }));

    if (fallbackPsus.length === 0) return null;

    fallbackPsus.sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) return b.tierScore - a.tierScore;
      if (tier === BuildGoal.BALANCED) {
        const idealW = recommendedPsuWatts + 100;
        return Math.abs(a.wattage - idealW) - Math.abs(b.wattage - idealW);
      }
      return a.wattage - b.wattage;
    });

    draft.psu = fallbackPsus[0] ?? null;
  }

  // 6. Fill Storage if missing (or leave existing storage)
  if (!draft.storage) {
    suggestedSlots.push(HardwareCategory.STORAGE);
    const mbPcie = draft.motherboard?.pcieGen ?? 4;
    const eligibleStorage = STORAGE_DATABASE.filter(
      (s) => s.storageType !== StorageType.HD && (s.pcieGen ?? 3) <= mbPcie
    );
    const pool = eligibleStorage.length > 0 ? eligibleStorage : STORAGE_DATABASE;
    const storageTarget = tier === BuildGoal.VALUE ? 64 : tier === BuildGoal.BALANCED ? 82 : 99;
    const sorted = [...pool].sort((a, b) => {
      if (tier === BuildGoal.PERFORMANCE) return b.tierScore - a.tierScore;
      return Math.abs(a.tierScore - storageTarget) - Math.abs(b.tierScore - storageTarget);
    });
    draft.storage = sorted[0] ?? null;
  }

  if (!isCandidateBuildProblemFree(draft)) {
    return null;
  }

  const title =
    tier === BuildGoal.VALUE
      ? 'Entrada'
      : tier === BuildGoal.BALANCED
        ? 'Equilibrado'
        : 'Máximo Desempenho';

  const subtitle =
    tier === BuildGoal.VALUE
      ? 'Configuração compatível e eficiente para uso diário e jogos leves/intermediários.'
      : tier === BuildGoal.BALANCED
        ? 'Melhor equilíbrio entre processador, placa de vídeo e folga elétrica sem gargalos.'
        : 'Aproveitamento máximo compatível com seu hardware atual sem gerar gargalo.';

  const balanceNote =
    draft.cpu && draft.gpu
      ? `Sem gargalos · ${draft.cpu.name.replace('AMD ', '').replace('Intel ', '')} + ${draft.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '')} · ${estimatedLoadWatts}W pico`
      : `Consumo estimado em ${estimatedLoadWatts}W`;

  return {
    goal: tier,
    title,
    subtitle,
    completedBuild: draft,
    suggestedSlots,
    estimatedLoadWatts,
    recommendedPsuWatts,
    balanceNote,
  };
}

export function analyzeBuild(build: SelectedBuild): BuildAnalysis {
  const issues: DiagnosticIssue[] = collectCriticalIssues(build);

  if (build.ram && build.ram.modules.startsWith('1x')) {
    issues.push({
      id: 'warn-ram-single-channel',
      severity: 'warning',
      category: HardwareCategory.RAM,
      title: 'Memória operando em Single-Channel',
      detail: `O módulo único (${build.ram.modules}) reduz pela metade a largura de banda de memória, prejudicando APUs (como Ryzen série G) e a estabilidade de FPS mínimo.`,
    });
  } else if (build.ram && build.ram.capacityGB < 32 && (build.gpu?.tierScore ?? 0) >= 75) {
    issues.push({
      id: 'warn-ram-capacity',
      severity: 'warning',
      category: HardwareCategory.RAM,
      title: '16GB pode limitar builds de alto desempenho',
      detail: `Com uma GPU de nível ${build.gpu?.name}, recomenda-se 32GB de RAM para evitar engasgos em jogos pesados e multitarefa.`,
    });
  }

  const { estimatedLoadWatts, recommendedPsuWatts } = calculatePowerBudget(build.cpu, build.gpu);
  let psuHeadroomPercent: number | null = null;
  if (build.psu && estimatedLoadWatts > 0) {
    psuHeadroomPercent = Math.round(((build.psu.wattage - estimatedLoadWatts) / build.psu.wattage) * 100);
    if (build.gpu?.requiresAtx3Connector && !build.psu.atx3) {
      issues.push({
        id: 'warn-psu-atx3',
        severity: 'warning',
        category: HardwareCategory.PSU,
        title: 'Adaptador necessário para conector 12VHPWR / 12V-2x6',
        detail: `A ${build.gpu.name} utiliza alimentação PCIe 5.0 de 16 pinos; a ${build.psu.name} exigirá o cabo adaptador múltiplo incluso na GPU.`,
      });
    }
  }

  if (build.gpu && build.motherboard && build.gpu.pcieGen >= 4 && build.motherboard.pcieGen === 3) {
    issues.push({
      id: 'warn-pcie-gen3',
      severity: 'warning',
      category: HardwareCategory.MOTHERBOARD,
      title: 'Barramento PCIe 3.0 na placa-mãe',
      detail: `A ${build.motherboard.name} opera em PCIe 3.0. Placas x16 operam normalmente com diferença mínima; apenas placas x8 podem ter leve redução de banda se estourar a VRAM.`,
    });
  }

  if (build.storage?.storageType === StorageType.HD) {
    issues.push({
      id: 'warn-storage-hdd',
      severity: 'warning',
      category: HardwareCategory.STORAGE,
      title: 'Sistema limitado por HD mecânico (HDD)',
      detail: `O ${build.storage.name} (${build.storage.readMBs} MB/s) causa inicialização lenta e engasgos ao carregar texturas em jogos atuais. Migrar para um SSD NVMe traz resposta imediata.`,
    });
  } else if (
    build.storage?.storageType === StorageType.NVME &&
    build.storage.pcieGen &&
    build.motherboard &&
    build.storage.pcieGen > build.motherboard.pcieGen
  ) {
    issues.push({
      id: 'warn-storage-pcie-cap',
      severity: 'warning',
      category: HardwareCategory.STORAGE,
      title: `SSD NVMe PCIe ${build.storage.pcieGen}.0 limitado pelo barramento da placa-mãe`,
      detail: `O ${build.storage.name} funciona normalmente na ${build.motherboard.name}, mas operará limitado à velocidade PCIe ${build.motherboard.pcieGen}.0.`,
    });
  }

  let balanceStatus: BuildAnalysis['balanceStatus'] = 'incomplete';
  let balanceSummary = 'Preencha ao menos a Placa-mãe, CPU ou GPU para receber as 3 configurações completas.';
  let bottleneckDetail: string | null = null;

  if (build.cpu && !build.gpu && build.cpu.integratedGpu) {
    balanceSummary = `O ${build.cpu.name} possui gráficos integrados (${build.cpu.integratedGpu}) para dar vídeo sem placa dedicada; adicionar uma GPU dedicada compatível traz o maior salto em jogos.`;
  }

  if (build.cpu && build.gpu) {
    const pairBalance = evaluatePairBalance(build.cpu, build.gpu);
    if (pairBalance === 'cpu_bottleneck') {
      balanceStatus = 'cpu_bottleneck';
      balanceSummary = `Gargalo de processador: o ${build.cpu.name} limita severamente a ${build.gpu.name}.`;
      bottleneckDetail = `Gargalo detectado: este processador não acompanha a taxa de quadros da ${build.gpu.name}.`;
    } else if (pairBalance === 'gpu_bottleneck') {
      balanceStatus = 'gpu_bottleneck';
      balanceSummary = `Gargalo de GPU: a ${build.gpu.name} está muito abaixo da capacidade do ${build.cpu.name}.`;
      bottleneckDetail = `Gargalo detectado: placa de vídeo subdimensionada para o potencial do ${build.cpu.name}.`;
    } else {
      balanceStatus = 'balanced';
      balanceSummary = 'Conjunto bem dimensionado: CPU e GPU trabalham em faixa harmônica sem gargalos.';
    }
  }

  const hasError = issues.some((i) => i.severity === 'error');
  const hasWarning = issues.some((i) => i.severity === 'warning');
  const compatibilityStatus: DiagnosticSeverity = hasError ? 'error' : hasWarning ? 'warning' : 'ok';

  // Gate 3-tier suggestions strictly on having at least Motherboard, GPU, or CPU selected
  const hasCoreAnchor = Boolean(build.motherboard || build.gpu || build.cpu);
  const tierSuggestions = hasCoreAnchor
    ? [
        generateTierSuggestion(build, BuildGoal.VALUE),
        generateTierSuggestion(build, BuildGoal.BALANCED),
        generateTierSuggestion(build, BuildGoal.PERFORMANCE),
      ].filter((t): t is TierBuildSuggestion => t !== null)
    : [];

  // Upgrade Recommendations: STRICTLY compatible & problem-free
  const cpuUpgrades: PartRecommendation<CpuPart>[] = [];
  if (build.cpu) {
    CPU_DATABASE.filter(
      (c) =>
        c.id !== build.cpu!.id &&
        c.tierScore > build.cpu!.tierScore &&
        isCandidateBuildProblemFree({ ...build, cpu: c })
    )
      .sort((a, b) => b.tierScore - a.tierScore)
      .slice(0, 3)
      .forEach((c) => {
        const gain = Math.round(((c.tierScore - build.cpu!.tierScore) / build.cpu!.tierScore) * 100);
        cpuUpgrades.push({
          part: c,
          fitLabel: `Upgrade Compatível ${c.socket}`,
          estimatedGainPercent: gain,
          isPlatformChange: false,
          compatibleWithCurrent: true,
          reason: `100% compatível com suas peças atuais · +${gain}% de fôlego sem gerar gargalo.`,
        });
      });
  }

  const gpuUpgrades: PartRecommendation<GpuPart>[] = [];
  if (build.gpu) {
    GPU_DATABASE.filter(
      (g) =>
        g.id !== build.gpu!.id &&
        g.tierScore > build.gpu!.tierScore &&
        isCandidateBuildProblemFree({ ...build, gpu: g })
    )
      .sort((a, b) =>
        scoreCandidate(b.tierScore, Math.min(98, build.gpu!.tierScore + 24), BuildGoal.BALANCED) -
        scoreCandidate(a.tierScore, Math.min(98, build.gpu!.tierScore + 24), BuildGoal.BALANCED)
      )
      .slice(0, 3)
      .forEach((g) => {
        const gain = Math.round(((g.tierScore - build.gpu!.tierScore) / build.gpu!.tierScore) * 100);
        gpuUpgrades.push({
          part: g,
          fitLabel: 'Upgrade 100% Compatível',
          estimatedGainPercent: gain,
          compatibleWithCurrent: true,
          reason: `${g.vramGB}GB VRAM · +${gain}% em poder gráfico sem gargalo e dentro da sua fonte.`,
        });
      });
  }

  const ramUpgrades: PartRecommendation<RamPart>[] = [];
  if (build.ram) {
    RAM_DATABASE.filter(
      (r) =>
        r.id !== build.ram!.id &&
        !r.modules.startsWith('1x') &&
        r.tierScore > build.ram!.tierScore &&
        isCandidateBuildProblemFree({ ...build, ram: r })
    )
      .sort((a, b) => b.tierScore - a.tierScore)
      .slice(0, 2)
      .forEach((r) => {
        const gain = Math.round(((r.tierScore - build.ram!.tierScore) / build.ram!.tierScore) * 100);
        ramUpgrades.push({
          part: r,
          fitLabel: `Kit ${r.capacityGB}GB ${r.type}`,
          estimatedGainPercent: gain,
          compatibleWithCurrent: true,
          reason: `Sobe para ${r.capacityGB}GB (${r.modules}) Dual-Channel a ${r.speedMTs}MT/s CL${r.casLatency} mantendo compatibilidade total.`,
        });
      });
  }

  const mbUpgrades: PartRecommendation<MotherboardPart>[] = [];
  if (build.motherboard) {
    MOTHERBOARD_DATABASE.filter(
      (m) =>
        m.id !== build.motherboard!.id &&
        m.vrmTier > build.motherboard!.vrmTier + 8 &&
        isCandidateBuildProblemFree({ ...build, motherboard: m })
    )
      .sort((a, b) => b.vrmTier - a.vrmTier)
      .slice(0, 2)
      .forEach((m) => {
        mbUpgrades.push({
          part: m,
          fitLabel: `Chipset ${m.chipset}`,
          compatibleWithCurrent: true,
          reason: `VRM superior, PCIe ${m.pcieGen}.0 e ${m.m2Slots} slots M.2 mantendo todas as suas peças atuais.`,
        });
      });
  }

  const psuUpgrades: PartRecommendation<PsuPart>[] = [];
  if (build.psu) {
    PSU_DATABASE.filter(
      (p) =>
        p.id !== build.psu!.id &&
        (p.wattage > build.psu!.wattage || (build.gpu?.requiresAtx3Connector && p.atx3 && !build.psu!.atx3)) &&
        isCandidateBuildProblemFree({ ...build, psu: p })
    )
      .sort((a, b) => a.wattage - b.wattage)
      .slice(0, 2)
      .forEach((p) => {
        psuUpgrades.push({
          part: p,
          fitLabel: p.atx3 ? `${p.wattage}W ATX 3.0+` : `${p.wattage}W ${p.efficiency}`,
          compatibleWithCurrent: true,
          reason: `Garante margem elétrica segura para todo o sistema (${p.efficiency}, ${p.modular}).`,
        });
      });
  }

  const storageUpgrades: PartRecommendation<StoragePart>[] = [];
  if (build.storage) {
    const mbPcie = build.motherboard?.pcieGen ?? 4;
    STORAGE_DATABASE.filter(
      (s) =>
        s.id !== build.storage!.id &&
        s.tierScore > build.storage!.tierScore &&
        (!s.pcieGen || s.pcieGen <= mbPcie || s.pcieGen <= 4)
    )
      .sort((a, b) => b.tierScore - a.tierScore)
      .slice(0, 3)
      .forEach((s) => {
        const gain = Math.round(((s.tierScore - build.storage!.tierScore) / build.storage!.tierScore) * 100);
        storageUpgrades.push({
          part: s,
          fitLabel: `${s.storageType} · ${formatStorageCapacity(s.capacityGB)}`,
          estimatedGainPercent: gain,
          compatibleWithCurrent: true,
          reason: `${s.interfaceLabel} (${s.readMBs} MB/s leitura) · +${gain}% em agilidade de sistema e carregamentos.`,
        });
      });
  }

  const prioritySummary: string[] = [];
  if (hasError) {
    prioritySummary.push(
      'Alerta crítico ativo: corrija as incompatibilidades ou gargalos destacados em vermelho no setup atual. Nenhuma recomendação incompatível será sugerida.'
    );
  }
  if (!hasCoreAnchor) {
    prioritySummary.push(
      'Preencha ao menos a Placa-mãe, CPU ou GPU para liberar as sugestões completas (Entrada, Equilibrado e Máximo Desempenho).'
    );
  } else if (
    !build.cpu ||
    !build.motherboard ||
    !build.gpu ||
    !build.ram ||
    !build.storage ||
    !build.psu
  ) {
    const missingNames: string[] = [];
    if (!build.motherboard) missingNames.push('Placa-mãe');
    if (!build.cpu) missingNames.push('CPU');
    if (!build.gpu) missingNames.push('GPU');
    if (!build.ram) missingNames.push('Memória RAM');
    if (!build.storage) missingNames.push('Armazenamento');
    if (!build.psu) missingNames.push('Fonte');
    prioritySummary.push(
      hasError
        ? `Faltam ${missingNames.length} componente(s) (${missingNames.join(', ')}). Resolva o alerta acima para liberar as sugestões completas compatíveis.`
        : `Faltam ${missingNames.length} componente(s) (${missingNames.join(', ')}). Confira os 3 perfis completos (Entrada, Equilibrado e Máximo Desempenho) gerados sem gargalos a partir do seu hardware atual.`
    );
  }
  if (balanceStatus === 'cpu_bottleneck' && cpuUpgrades[0]) {
    prioritySummary.push(
      `Correção recomendada: atualizar o processador para ${cpuUpgrades[0].part.name} elimina o gargalo com a ${build.gpu?.name}.`
    );
  } else if (balanceStatus === 'gpu_bottleneck' && gpuUpgrades[0]) {
    prioritySummary.push(
      `Correção recomendada: atualizar a placa de vídeo para ${gpuUpgrades[0].part.name} equilibra o conjunto com o ${build.cpu?.name}.`
    );
  } else if (build.gpu && gpuUpgrades[0]) {
    prioritySummary.push(
      `Upgrade gráfico compatível disponível: ${gpuUpgrades[0].part.name} (+${gpuUpgrades[0].estimatedGainPercent}% em poder gráfico, sem gargalo).`
    );
  }
  if (build.ram && (build.ram.modules.startsWith('1x') || build.ram.capacityGB < 32) && ramUpgrades[0]) {
    prioritySummary.push(
      `Atualize a memória para Dual-Channel com o kit ${ramUpgrades[0].part.name}.`
    );
  }
  if (build.storage?.storageType === StorageType.HD && storageUpgrades[0]) {
    prioritySummary.push(
      `Upgrade de armazenamento prioritário: troque o HD pelo ${storageUpgrades[0].part.name} para eliminar lentidão de boot e telas de loading.`
    );
  }

  const selectedParts = [
    build.cpu,
    build.motherboard,
    build.gpu,
    build.ram,
    build.storage,
    build.psu,
  ].filter(Boolean);
  const socketLabel = build.motherboard?.socket ?? build.cpu?.socket ?? null;
  const ramLabel = build.motherboard?.ramType ?? build.ram?.type ?? null;
  const platformSummary =
    socketLabel && ramLabel
      ? `Socket ${socketLabel} · ${ramLabel}`
      : socketLabel
        ? `Socket ${socketLabel}`
        : ramLabel
          ? `Memória ${ramLabel}`
          : 'Plataforma a definir';

  return {
    compatibilityStatus,
    issues,
    estimatedLoadWatts,
    recommendedPsuWatts,
    psuHeadroomPercent,
    balanceStatus,
    balanceSummary,
    bottleneckDetail,
    selectedCount: selectedParts.length,
    platformSummary,
    tierSuggestions,
    missingSlotRecommendations: {
      cpu: [],
      motherboard: [],
      gpu: [],
      ram: [],
      storage: [],
      psu: [],
    },
    upgradeRecommendations: {
      cpu: cpuUpgrades,
      motherboard: mbUpgrades,
      gpu: gpuUpgrades,
      ram: ramUpgrades,
      storage: storageUpgrades,
      psu: psuUpgrades,
    },
    prioritySummary,
  };
}

export function hydrateBuildFromIds(ids: {
  cpu: string | null;
  motherboard: string | null;
  gpu: string | null;
  ram: string | null;
  storage?: string | null;
  psu: string | null;
}): SelectedBuild {
  return {
    cpu: ids.cpu ? CPU_DATABASE.find((c) => c.id === ids.cpu) ?? null : null,
    motherboard: ids.motherboard
      ? MOTHERBOARD_DATABASE.find((m) => m.id === ids.motherboard) ?? null
      : null,
    gpu: ids.gpu ? GPU_DATABASE.find((g) => g.id === ids.gpu) ?? null : null,
    ram: ids.ram ? RAM_DATABASE.find((r) => r.id === ids.ram) ?? null : null,
    storage: ids.storage ? STORAGE_DATABASE.find((s) => s.id === ids.storage) ?? null : null,
    psu: ids.psu ? PSU_DATABASE.find((p) => p.id === ids.psu) ?? null : null,
  };
}

function findBestCompatiblePsu(build: SelectedBuild, targetTier: BuildGoal): PsuPart | null {
  const { recommendedPsuWatts } = calculatePowerBudget(build.cpu, build.gpu);
  const needsAtx3 = Boolean(build.gpu?.requiresAtx3Connector);
  const eligible = PSU_DATABASE.filter(
    (psu) =>
      isCandidateBuildProblemFree({ ...build, psu }) && (!needsAtx3 || psu.atx3)
  );
  const pool =
    eligible.length > 0
      ? eligible
      : PSU_DATABASE.filter((psu) => isCandidateBuildProblemFree({ ...build, psu }));

  if (pool.length === 0) return null;
  pool.sort((a, b) => {
    if (targetTier === BuildGoal.PERFORMANCE) return b.tierScore - a.tierScore;
    if (targetTier === BuildGoal.BALANCED) {
      const idealW = recommendedPsuWatts + 100;
      return Math.abs(a.wattage - idealW) - Math.abs(b.wattage - idealW);
    }
    return a.wattage - b.wattage;
  });
  return pool[0] ?? null;
}

function findBestCompatibleRam(
  build: SelectedBuild,
  prefer32GB: boolean
): RamPart | null {
  const pool = RAM_DATABASE.filter(
    (ram) =>
      !ram.modules.startsWith('1x') &&
      isCandidateBuildProblemFree({ ...build, ram })
  );
  if (pool.length === 0) return null;
  pool.sort((a, b) => {
    if (prefer32GB) {
      if ((a.capacityGB >= 32) !== (b.capacityGB >= 32)) {
        return a.capacityGB >= 32 ? -1 : 1;
      }
      return b.tierScore - a.tierScore;
    }
    return Math.abs(a.capacityGB - 16) - Math.abs(b.capacityGB - 16) || b.speedMTs - a.speedMTs;
  });
  return pool[0] ?? null;
}

function findBestStorageForGoal(
  current: StoragePart | null,
  mb: MotherboardPart | null,
  goal: BuildGoal
): StoragePart | null {
  const mbPcie = mb?.pcieGen ?? 4;
  const nvmes = STORAGE_DATABASE.filter(
    (s) => s.storageType === StorageType.NVME && (!s.pcieGen || s.pcieGen <= mbPcie)
  );
  const pool = nvmes.length > 0 ? nvmes : STORAGE_DATABASE;

  if (goal === BuildGoal.VALUE) {
    if (current && current.storageType !== StorageType.HD) return current;
    return [...pool].sort((a, b) => Math.abs(a.tierScore - 68) - Math.abs(b.tierScore - 68))[0] ?? null;
  }

  if (goal === BuildGoal.BALANCED) {
    if (current && current.tierScore >= 82) return current;
    return [...pool].sort((a, b) => Math.abs(a.tierScore - 82) - Math.abs(b.tierScore - 82))[0] ?? null;
  }

  const top = [...pool].sort((a, b) => b.tierScore - a.tierScore)[0] ?? null;
  if (current && top && current.tierScore >= top.tierScore) return current;
  return top;
}

function buildRepairedSeed(currentBuild: SelectedBuild): SelectedBuild {
  if (isCandidateBuildProblemFree(currentBuild)) return { ...currentBuild };

  // Preserve as many valid user parts as possible while removing conflicting parts
  const candidates: SelectedBuild[] = [
    { ...currentBuild, cpu: null, psu: null },
    { ...currentBuild, gpu: null, psu: null },
    { ...currentBuild, motherboard: null, ram: null, psu: null },
    { ...currentBuild, cpu: null, gpu: null, psu: null },
    {
      cpu: null,
      motherboard: currentBuild.motherboard,
      gpu: null,
      ram: null,
      storage: currentBuild.storage,
      psu: null,
    },
    {
      cpu: null,
      motherboard: null,
      gpu: currentBuild.gpu,
      ram: null,
      storage: currentBuild.storage,
      psu: null,
    },
  ];

  for (const cand of candidates) {
    if (
      (cand.motherboard || cand.cpu || cand.gpu) &&
      isCandidateBuildProblemFree(cand) &&
      generateTierSuggestion(cand, BuildGoal.BALANCED) !== null
    ) {
      return cand;
    }
  }

  return {
    cpu: null,
    motherboard: MOTHERBOARD_DATABASE.find((m) => m.id === 'mb-b550m-aorus') ?? MOTHERBOARD_DATABASE[0] ?? null,
    gpu: null,
    ram: null,
    storage: currentBuild.storage,
    psu: null,
  };
}

function upgradeCompletedBuildForGoal(
  baseBuild: SelectedBuild,
  goal: BuildGoal
): SelectedBuild {
  // Ensure we start from a clean 6-part compatible build
  let draft: SelectedBuild = { ...baseBuild };
  if (
    !draft.cpu ||
    !draft.motherboard ||
    !draft.gpu ||
    !draft.ram ||
    !draft.storage ||
    !draft.psu ||
    !isCandidateBuildProblemFree(draft)
  ) {
    const seed = buildRepairedSeed(draft);
    const completed = generateTierSuggestion(seed, goal)?.completedBuild;
    if (completed) {
      draft = { ...completed };
    }
  }

  // If the original build already had CPU & GPU, compute genuine upgrade targets for each simulation tier
  const alreadyHadBothCore = Boolean(baseBuild.cpu && baseBuild.gpu);
  if (!alreadyHadBothCore && isCandidateBuildProblemFree(baseBuild)) {
    return draft;
  }

  if (goal === BuildGoal.VALUE) {
    // Entry upgrade: fix weak RAM (single-channel / <16GB), upgrade HDD -> NVMe, & conservative step-up
    if (draft.ram && (draft.ram.modules.startsWith('1x') || draft.ram.capacityGB < 16)) {
      const betterRam = findBestCompatibleRam({ ...draft, ram: null }, false);
      if (betterRam) draft.ram = betterRam;
    }

    const entryStorage = findBestStorageForGoal(draft.storage, draft.motherboard, BuildGoal.VALUE);
    if (entryStorage) draft.storage = entryStorage;

    const gpuTargetMin = (draft.gpu?.tierScore ?? 0) + 10;
    const cpuTargetMin = (draft.cpu?.tierScore ?? 0) + 8;

    const entryGpu = GPU_DATABASE.filter(
      (g) =>
        g.tierScore >= gpuTargetMin &&
        isCandidateBuildProblemFree({ ...draft, gpu: g, psu: null })
    ).sort((a, b) => a.tierScore - b.tierScore)[0];

    if (entryGpu) {
      draft.gpu = entryGpu;
    } else {
      const entryCpu = CPU_DATABASE.filter(
        (c) =>
          c.tierScore >= cpuTargetMin &&
          isCandidateBuildProblemFree({ ...draft, cpu: c, gpu: null, psu: null }) &&
          isCandidateBuildProblemFree({ ...draft, cpu: c, psu: null })
      ).sort((a, b) => a.tierScore - b.tierScore)[0];
      if (entryCpu) draft.cpu = entryCpu;
    }

    if (!isCandidateBuildProblemFree(draft) || !draft.psu) {
      const safePsu = findBestCompatiblePsu(draft, BuildGoal.VALUE);
      if (safePsu) draft.psu = safePsu;
    }
    return draft;
  }

  if (goal === BuildGoal.BALANCED) {
    // Balanced upgrade: elevate CPU+GPU together cleanly on current motherboard when possible
    const currentCpuScore = draft.cpu?.tierScore ?? 45;
    const currentGpuScore = draft.gpu?.tierScore ?? 45;
    const targetBalancedScore = Math.min(84, Math.max(currentCpuScore, currentGpuScore) + 18);

    const candidateCpus = CPU_DATABASE.filter(
      (c) =>
        c.tierScore >= currentCpuScore &&
        isCandidateBuildProblemFree({ ...draft, cpu: c, gpu: null, psu: null })
    ).sort(
      (a, b) =>
        Math.abs(a.tierScore - targetBalancedScore) -
        Math.abs(b.tierScore - targetBalancedScore)
    );

    if (candidateCpus[0]) {
      draft.cpu = candidateCpus[0];
    }

    const cpuScoreAfter = draft.cpu?.tierScore ?? targetBalancedScore;
    const candidateGpus = GPU_DATABASE.filter(
      (g) =>
        g.tierScore > (baseBuild.gpu?.tierScore ?? 0) &&
        isCandidateBuildProblemFree({ ...draft, gpu: g, psu: null })
    ).sort((a, b) => {
      const targetG = Math.min(86, Math.max(cpuScoreAfter, currentGpuScore + 16));
      return Math.abs(a.tierScore - targetG) - Math.abs(b.tierScore - targetG);
    });

    if (candidateGpus[0]) {
      draft.gpu = candidateGpus[0];
    }

    const need32 = (draft.gpu?.tierScore ?? 0) >= 72 || (draft.ram?.capacityGB ?? 0) <= 16;
    const upgradedRam = findBestCompatibleRam({ ...draft, ram: null }, need32);
    if (upgradedRam && upgradedRam.tierScore >= (draft.ram?.tierScore ?? 0)) {
      draft.ram = upgradedRam;
    }

    const balancedStorage = findBestStorageForGoal(draft.storage, draft.motherboard, BuildGoal.BALANCED);
    if (balancedStorage) draft.storage = balancedStorage;

    if (!isCandidateBuildProblemFree(draft) || (draft.gpu?.requiresAtx3Connector && !draft.psu?.atx3)) {
      const safePsu = findBestCompatiblePsu(draft, BuildGoal.BALANCED);
      if (safePsu) draft.psu = safePsu;
    }
    return draft;
  }

  // PERFORMANCE: Max out current motherboard if it gives a clear leap; otherwise step up to flagship AM5 platform
  const topSamePlatformCpu = CPU_DATABASE.filter((c) =>
    isCandidateBuildProblemFree({ ...draft, cpu: c, gpu: null, ram: draft.ram, psu: null })
  ).sort((a, b) => b.tierScore - a.tierScore)[0];

  const topSamePlatformGpu = topSamePlatformCpu
    ? GPU_DATABASE.filter((g) =>
        isCandidateBuildProblemFree({
          ...draft,
          cpu: topSamePlatformCpu,
          gpu: g,
          psu: null,
        })
      ).sort((a, b) => b.tierScore - a.tierScore)[0]
    : undefined;

  const canMeaningfullyPeakOnSamePlatform =
    topSamePlatformCpu &&
    topSamePlatformGpu &&
    (topSamePlatformCpu.tierScore >= 82 || topSamePlatformGpu.tierScore >= 82) &&
    (topSamePlatformCpu.tierScore > (baseBuild.cpu?.tierScore ?? 0) ||
      topSamePlatformGpu.tierScore > (baseBuild.gpu?.tierScore ?? 0));

  if (canMeaningfullyPeakOnSamePlatform) {
    draft.cpu = topSamePlatformCpu;
    draft.gpu = topSamePlatformGpu;
    const bestRam = findBestCompatibleRam({ ...draft, ram: null }, true);
    if (bestRam && bestRam.tierScore >= (draft.ram?.tierScore ?? 0)) {
      draft.ram = bestRam;
    }
    const perfStorage = findBestStorageForGoal(draft.storage, draft.motherboard, BuildGoal.PERFORMANCE);
    if (perfStorage) draft.storage = perfStorage;
    const safePsu = findBestCompatiblePsu(draft, BuildGoal.PERFORMANCE);
    if (safePsu) draft.psu = safePsu;
    return draft;
  }

  // Platform ceiling reached: step up cleanly to AM5 high-performance architecture
  const am5Mb =
    MOTHERBOARD_DATABASE.find((m) => m.id === 'mb-x870e-aorus') ??
    MOTHERBOARD_DATABASE.find((m) => m.vrmTier >= 85) ??
    draft.motherboard;
  const perfSeed: SelectedBuild = {
    cpu: null,
    motherboard: am5Mb,
    gpu: null,
    ram: null,
    storage: null,
    psu: null,
  };
  return generateTierSuggestion(perfSeed, BuildGoal.PERFORMANCE)?.completedBuild ?? draft;
}

export function buildPlannedChanges(
  currentBuild: SelectedBuild,
  currentAnalysis: BuildAnalysis,
  targetBuild: SelectedBuild
): PlannedChangeItem[] {
  const slots: {
    category: HardwareCategory;
    curr: SelectedBuild[keyof SelectedBuild];
    next: SelectedBuild[keyof SelectedBuild];
  }[] = [
    { category: HardwareCategory.MOTHERBOARD, curr: currentBuild.motherboard, next: targetBuild.motherboard },
    { category: HardwareCategory.CPU, curr: currentBuild.cpu, next: targetBuild.cpu },
    { category: HardwareCategory.GPU, curr: currentBuild.gpu, next: targetBuild.gpu },
    { category: HardwareCategory.RAM, curr: currentBuild.ram, next: targetBuild.ram },
    { category: HardwareCategory.STORAGE, curr: currentBuild.storage, next: targetBuild.storage },
    { category: HardwareCategory.PSU, curr: currentBuild.psu, next: targetBuild.psu },
  ];

  const items: PlannedChangeItem[] = [];

  for (const { category, curr, next } of slots) {
    if (!next) continue;

    if (curr && curr.id === next.id) {
      items.push({
        category,
        action: 'keep',
        fromName: curr.name,
        toName: next.name,
        reason: 'Componente mantido: já atende com compatibilidade e sem gargalo.',
      });
      continue;
    }

    if (!curr) {
      items.push({
        category,
        action: 'add',
        fromName: null,
        toName: next.name,
        reason: 'Peça adicionada conforme o diagnóstico para fechar o conjunto sem gargalos.',
      });
      continue;
    }

    const matchingError = currentAnalysis.issues.find(
      (i) => i.severity === 'error' && i.category === category
    );
    const matchingWarning = currentAnalysis.issues.find(
      (i) => i.severity === 'warning' && i.category === category
    );

    let gainPercent: number | undefined;
    if (
      (curr.category === HardwareCategory.CPU && next.category === HardwareCategory.CPU) ||
      (curr.category === HardwareCategory.GPU && next.category === HardwareCategory.GPU) ||
      (curr.category === HardwareCategory.RAM && next.category === HardwareCategory.RAM) ||
      (curr.category === HardwareCategory.STORAGE && next.category === HardwareCategory.STORAGE)
    ) {
      const pct = Math.round(((next.tierScore - curr.tierScore) / curr.tierScore) * 100);
      if (pct > 0) gainPercent = pct;
    }

    if (matchingError) {
      items.push({
        category,
        action: 'replace_conflict',
        fromName: curr.name,
        toName: next.name,
        gainPercent,
        reason: `Correção do diagnóstico (${matchingError.title}): substitui por opção 100% compatível.`,
      });
      continue;
    }

    let upgradeReason = 'Evolução compatível mantendo equilíbrio geral do sistema.';
    if (category === HardwareCategory.GPU && next.category === HardwareCategory.GPU) {
      upgradeReason = gainPercent
        ? `Amplia o poder gráfico em +${gainPercent}% (${next.vramGB}GB VRAM) mantendo equilíbrio com a CPU.`
        : `Atualiza para ${next.vramGB}GB VRAM em equilíbrio com o processador.`;
    } else if (category === HardwareCategory.CPU && next.category === HardwareCategory.CPU) {
      upgradeReason = gainPercent
        ? `Eleva o processamento em +${gainPercent}% (${next.cores}C/${next.threads}T) sem causar gargalo.`
        : `Processador ${next.cores}C/${next.threads}T compatível com a arquitetura selecionada.`;
    } else if (category === HardwareCategory.RAM && next.category === HardwareCategory.RAM) {
      upgradeReason = matchingWarning
        ? `Resolve o alerta de memória (${matchingWarning.title}) subindo para ${next.capacityGB}GB (${next.modules}).`
        : `Aumenta capacidade e banda para ${next.capacityGB}GB ${next.type} ${next.speedMTs}MT/s.`;
    } else if (category === HardwareCategory.STORAGE && next.category === HardwareCategory.STORAGE) {
      upgradeReason = `Evolui para ${next.storageType} de ${formatStorageCapacity(next.capacityGB)} (${next.readMBs} MB/s leitura, ${next.interfaceLabel}).`;
    } else if (category === HardwareCategory.PSU && next.category === HardwareCategory.PSU) {
      upgradeReason = `Amplia a margem elétrica para ${next.wattage}W (${next.efficiency})${next.atx3 ? ' com padrão ATX 3.0+' : ''}.`;
    } else if (category === HardwareCategory.MOTHERBOARD && next.category === HardwareCategory.MOTHERBOARD) {
      upgradeReason = `Atualiza a plataforma para ${next.socket} (${next.chipset}, ${next.ramType}) liberando maior teto de upgrade.`;
    }

    items.push({
      category,
      action: 'upgrade',
      fromName: curr.name,
      toName: next.name,
      gainPercent,
      reason: upgradeReason,
    });
  }

  return items;
}

export function generateSimulationPlansForComparison(
  currentBuild: SelectedBuild,
  currentAnalysis: BuildAnalysis
): SimulationTierPlan[] {
  const goals: {
    goal: BuildGoal;
    title: SimulationTierPlan['title'];
    subtitle: string;
  }[] = [
    {
      goal: BuildGoal.VALUE,
      title: 'Entrada',
      subtitle: 'Evolução objetiva e econômica baseada no diagnóstico atual.',
    },
    {
      goal: BuildGoal.BALANCED,
      title: 'Equilibrado',
      subtitle: 'Melhor relação entre ganho de desempenho, compatibilidade e margem elétrica.',
    },
    {
      goal: BuildGoal.PERFORMANCE,
      title: 'Máximo Desempenho',
      subtitle: 'Potencial máximo compatível extraindo todo o fôlego do diagnóstico.',
    },
  ];

  return goals.map(({ goal, title, subtitle }) => {
    const directTier = currentAnalysis.tierSuggestions.find((t) => t.goal === goal);
    const hasMissingCore = !currentBuild.cpu || !currentBuild.gpu;

    const futureBuild =
      directTier && hasMissingCore && isCandidateBuildProblemFree(currentBuild)
        ? directTier.completedBuild
        : upgradeCompletedBuildForGoal(currentBuild, goal);

    return {
      goal,
      title,
      subtitle,
      futureBuild,
      changes: buildPlannedChanges(currentBuild, currentAnalysis, futureBuild),
    };
  });
}

export function createDiagnosticSnapshot(
  build: SelectedBuild,
  analysis: BuildAnalysis
): SavedDiagnosticSnapshot {
  return {
    savedAt: new Date().toISOString(),
    buildIds: {
      cpu: build.cpu?.id ?? null,
      motherboard: build.motherboard?.id ?? null,
      gpu: build.gpu?.id ?? null,
      ram: build.ram?.id ?? null,
      storage: build.storage?.id ?? null,
      psu: build.psu?.id ?? null,
    },
    compatibilityStatus: analysis.compatibilityStatus,
    balanceStatus: analysis.balanceStatus,
    balanceSummary: analysis.balanceSummary,
    issues: analysis.issues,
    prioritySummary: analysis.prioritySummary,
    simulationPlans: generateSimulationPlansForComparison(build, analysis),
  };
}

export { DEFAULT_RESOLUTION };

