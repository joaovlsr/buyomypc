import { AlertTriangle, CheckCircle2, Cpu, Gauge, ShieldAlert } from 'lucide-react';
import { BuildAnalysis, SelectedBuild } from '../types/hardware';

interface TelemetryStripProps {
  analysis: BuildAnalysis;
  build: SelectedBuild;
  seamless?: boolean;
}

export function TelemetryStrip({ analysis, build, seamless = false }: TelemetryStripProps) {
  const hasCriticalAlert = analysis.compatibilityStatus === 'error';

  const compatLabel = hasCriticalAlert
    ? 'Alerta Crítico'
    : analysis.compatibilityStatus === 'warning'
      ? 'Requer Atenção'
      : analysis.selectedCount === 0
        ? 'Aguardando Peças'
        : '100% Compatível';

  const compatColor = hasCriticalAlert
    ? 'text-red-700 dark:text-red-400'
    : analysis.compatibilityStatus === 'warning'
      ? 'text-amber-700 dark:text-amber-400'
      : analysis.selectedCount === 0
        ? 'text-[#5C675E] dark:text-[#98A69B]'
        : 'text-[#315C45] dark:text-[#86AD90]';

  const CompatIcon = hasCriticalAlert
    ? ShieldAlert
    : analysis.compatibilityStatus === 'warning'
      ? AlertTriangle
      : CheckCircle2;

  const isBottleneck =
    analysis.balanceStatus === 'cpu_bottleneck' || analysis.balanceStatus === 'gpu_bottleneck';

  const balanceLabel =
    analysis.balanceStatus === 'balanced'
      ? 'Equilibrado'
      : analysis.balanceStatus === 'cpu_bottleneck'
        ? 'Gargalo de CPU'
        : analysis.balanceStatus === 'gpu_bottleneck'
          ? 'Gargalo de GPU'
          : 'Incompleto';

  const balanceColor = isBottleneck
    ? 'text-red-700 dark:text-red-400'
    : analysis.balanceStatus === 'balanced'
      ? 'text-[#315C45] dark:text-[#86AD90]'
      : 'text-[#202521] dark:text-[#EEF2EE]';

  return (
    <section
      aria-label="Resumo técnico da configuração"
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x transition-colors ${
        seamless
          ? 'bg-transparent divide-[#DCE4DD] dark:divide-[#2A352D]'
          : `bg-white dark:bg-[#191F1B] border rounded-[14px] ${
              hasCriticalAlert
                ? 'border-red-300 dark:border-red-800/80 divide-red-200 dark:divide-red-900/60'
                : 'border-[#DCE4DD] dark:border-[#2A352D] divide-[#DCE4DD] dark:divide-[#2A352D]'
            }`
      }`}
    >
      {/* 1. Compatibilidade */}
      <div
        className={`p-5 flex flex-col justify-between gap-2 ${
          hasCriticalAlert
            ? `bg-red-50/75 dark:bg-red-950/35 ${seamless ? '' : 'rounded-t-[14px] sm:rounded-tr-none sm:rounded-l-[14px]'}`
            : analysis.compatibilityStatus === 'ok' && analysis.selectedCount > 0
              ? `bg-[#E5EEE6]/55 dark:bg-[#1E2821]/70 ${seamless ? '' : 'rounded-t-[14px] sm:rounded-tr-none sm:rounded-l-[14px]'}`
              : ''
        }`}
      >
        <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
          Status Técnico
        </span>
        <div className={`flex items-center gap-2 text-lg font-semibold ${compatColor}`}>
          <CompatIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{compatLabel}</span>
        </div>
        <span
          className={`text-xs tabular-nums ${
            hasCriticalAlert
              ? 'text-red-700 dark:text-red-400 font-medium'
              : 'text-[#5C675E] dark:text-[#98A69B]'
          }`}
        >
          {analysis.issues.length === 0
            ? 'Nenhum conflito físico ou gargalo'
            : `${analysis.issues.length} ${analysis.issues.length === 1 ? 'alerta técnico' : 'alertas técnicos'}`}
        </span>
      </div>

      {/* 2. Consumo & Fonte */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
          Consumo Estimado
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold font-mono tabular-nums text-[#202521] dark:text-[#EEF2EE]">
            {analysis.estimatedLoadWatts > 0 ? `${analysis.estimatedLoadWatts} W` : '0 W'}
          </span>
          <span className="text-xs text-[#5C675E] dark:text-[#98A69B] font-mono tabular-nums">
            {build.psu ? `/ Fonte ${build.psu.wattage} W` : `/ Ideal ${analysis.recommendedPsuWatts} W`}
          </span>
        </div>
        <span
          className={`text-xs tabular-nums ${
            build.psu &&
            analysis.psuHeadroomPercent !== null &&
            build.psu.wattage < analysis.recommendedPsuWatts
              ? 'text-red-700 dark:text-red-400 font-medium'
              : 'text-[#5C675E] dark:text-[#98A69B]'
          }`}
        >
          {build.psu && analysis.psuHeadroomPercent !== null
            ? analysis.psuHeadroomPercent >= 0
              ? `Margem elétrica de ${analysis.psuHeadroomPercent}%`
              : `Déficit de ${Math.abs(analysis.psuHeadroomPercent)}% na fonte`
            : `Sugestão mínima com folga: ${analysis.recommendedPsuWatts} W`}
        </span>
      </div>

      {/* 3. Equilíbrio CPU x GPU */}
      <div
        className={`p-5 flex flex-col justify-between gap-2 ${
          isBottleneck ? 'bg-red-50/60 dark:bg-red-950/30' : ''
        }`}
      >
        <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
          Equilíbrio CPU × GPU
        </span>
        <div className={`flex items-center gap-2 text-lg font-semibold ${balanceColor}`}>
          <Gauge className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="truncate">{balanceLabel}</span>
        </div>
        <span
          className={`text-xs line-clamp-1 ${
            isBottleneck
              ? 'text-red-700 dark:text-red-400 font-medium'
              : 'text-[#5C675E] dark:text-[#98A69B]'
          }`}
        >
          {build.cpu && build.gpu
            ? `${build.cpu.name.replace('AMD ', '').replace('Intel ', '')} + ${build.gpu.name.replace('NVIDIA GeForce ', '').replace('AMD Radeon ', '')}`
            : build.cpu?.integratedGpu
              ? `Vídeo integrado: ${build.cpu.integratedGpu}`
              : 'Selecione CPU e GPU para avaliar'}
        </span>
      </div>

      {/* 4. Plataforma & Slots */}
      <div className="p-5 flex flex-col justify-between gap-2">
        <span className="text-xs font-medium text-[#5C675E] dark:text-[#98A69B]">
          Plataforma e Peças
        </span>
        <div className="flex items-center gap-2 text-lg font-semibold text-[#202521] dark:text-[#EEF2EE]">
          <Cpu className="w-5 h-5 shrink-0 text-[#6F9278] dark:text-[#86AD90]" aria-hidden="true" />
          <span className="truncate font-mono tabular-nums">{analysis.selectedCount} / 6 peças</span>
        </div>
        <span className="text-xs text-[#5C675E] dark:text-[#98A69B] font-mono truncate">
          {analysis.platformSummary}
        </span>
      </div>
    </section>
  );
}
