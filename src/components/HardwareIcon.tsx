import { Cpu, CircuitBoard, HardDrive, MemoryStick, Monitor, Zap } from 'lucide-react';
import { HardwareCategory } from '../types/hardware';

interface HardwareIconProps {
  category: HardwareCategory;
  className?: string;
}

export function HardwareIcon({ category, className = 'w-5 h-5' }: HardwareIconProps) {
  switch (category) {
    case HardwareCategory.GPU:
      return <Monitor className={className} aria-hidden="true" />;
    case HardwareCategory.CPU:
      return <Cpu className={className} aria-hidden="true" />;
    case HardwareCategory.MOTHERBOARD:
      return <CircuitBoard className={className} aria-hidden="true" />;
    case HardwareCategory.RAM:
      return <MemoryStick className={className} aria-hidden="true" />;
    case HardwareCategory.STORAGE:
      return <HardDrive className={className} aria-hidden="true" />;
    case HardwareCategory.PSU:
      return <Zap className={className} aria-hidden="true" />;
  }
}

export const CATEGORY_LABELS: Record<HardwareCategory, string> = {
  [HardwareCategory.GPU]: 'Placa de Vídeo (GPU)',
  [HardwareCategory.CPU]: 'Processador (CPU)',
  [HardwareCategory.MOTHERBOARD]: 'Placa-mãe',
  [HardwareCategory.RAM]: 'Memória RAM',
  [HardwareCategory.STORAGE]: 'Armazenamento',
  [HardwareCategory.PSU]: 'Fonte (PSU)',
};

export const CATEGORY_SHORT_LABELS: Record<HardwareCategory, string> = {
  [HardwareCategory.GPU]: 'GPU',
  [HardwareCategory.CPU]: 'CPU',
  [HardwareCategory.MOTHERBOARD]: 'Placa-mãe',
  [HardwareCategory.RAM]: 'RAM',
  [HardwareCategory.STORAGE]: 'Armaz.',
  [HardwareCategory.PSU]: 'Fonte',
};
