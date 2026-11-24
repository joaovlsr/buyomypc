import { useEffect, useState } from 'react';
import { HardwareCategory } from '../types/hardware';
import { HardwareIcon } from './HardwareIcon';

export interface VisualAsset {
  src: string;
  alt: string;
}

export const BANNER_IMAGES = {
  heroWorkstation: {
    src: '/src/assets/images/hero_natural_pc_1795479540446.jpg',
    alt: 'Estação de trabalho minimalista em tons naturais com gabinete moderno e componentes organizados',
  },
  upgradeBench: {
    src: '/src/assets/images/banner_upgrade_bench_1795479539990.jpg',
    alt: 'Bancada de hardware com placa-mãe, processador, placa de vídeo, memória RAM e fonte em iluminação neutra',
  },
  hardwareTesting: {
    src: '/src/assets/images/banner_hardware_testing_1795485951534.jpg',
    alt: 'Bancada minimalista de testes com placa-mãe, placa de vídeo e memória RAM em luz natural',
  },
  comparisonSetup: {
    src: '/src/assets/images/banner_comparison_setup_1795485952354.jpg',
    alt: 'Estação moderna com monitor ultrawide e gabinete clean com detalhes em verde floresta',
  },
  catalogStudio: {
    src: '/src/assets/images/banner_catalog_studio_1795485952511.jpg',
    alt: 'Componentes selecionados de hardware alinhados em superfície off-white e verde névoa',
  },
} as const;

export const HARDWARE_CATEGORY_IMAGES: Record<HardwareCategory, VisualAsset> = {
  [HardwareCategory.MOTHERBOARD]: {
    src: '/src/assets/images/part_motherboard_1795479540895.jpg',
    alt: 'Placa-mãe moderna em fotografia de estúdio com fundo neutro',
  },
  [HardwareCategory.CPU]: {
    src: '/src/assets/images/part_cpu_1795479541032.jpg',
    alt: 'Processador de alto desempenho em fotografia de estúdio',
  },
  [HardwareCategory.GPU]: {
    src: '/src/assets/images/part_gpu_1795479541657.jpg',
    alt: 'Placa de vídeo dedicada com sistema de refrigeração moderno',
  },
  [HardwareCategory.RAM]: {
    src: '/src/assets/images/part_ram_1795479541850.jpg',
    alt: 'Módulos de memória RAM dual-channel com dissipadores minimalistas',
  },
  [HardwareCategory.STORAGE]: {
    src: '/src/assets/images/part_storage_1795487250015.jpg',
    alt: 'SSD NVMe M.2 e SSD SATA 2.5 em fotografia de estúdio com fundo neutro',
  },
  [HardwareCategory.PSU]: {
    src: '/src/assets/images/part_psu_1795479542208.jpg',
    alt: 'Fonte de alimentação modular de alta eficiência energética',
  },
};

interface HardwareImageProps {
  src: string;
  alt: string;
  fallbackCategory?: HardwareCategory;
  className?: string;
  loading?: 'eager' | 'lazy';
}

export function HardwareImage({
  src,
  alt,
  fallbackCategory,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
}: HardwareImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-[#E5EEE6] dark:bg-[#1E2821] text-[#315C45] dark:text-[#86AD90]"
      >
        {fallbackCategory ? (
          <HardwareIcon category={fallbackCategory} className="w-6 h-6" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-[#315C45]/40 dark:border-[#86AD90]/40" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
