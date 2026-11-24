interface BrandMarkProps {
  className?: string;
}

/**
 * Símbolo geométrico de dois chevrons ascendentes sólidos inspirado na identidade
 * Natural Technology ("Buy or Upgrade my pc").
 */
export function BrandMark({ className = 'w-7 h-7' }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chevron inferior (verde eucalipto) */}
      <path
        d="M5.5 22.8L16 12.6L26.5 22.8C27.1 23.4 27.1 24.3 26.5 24.9L24.7 26.6C24.1 27.2 23.2 27.2 22.6 26.6L16 20.1L9.4 26.6C8.8 27.2 7.9 27.2 7.3 26.6L5.5 24.9C4.9 24.3 4.9 23.4 5.5 22.8Z"
        className="fill-[#6F9278] dark:fill-[#86AD90]"
      />
      {/* Chevron superior (verde floresta) */}
      <path
        d="M5.5 13.8L16 3.6L26.5 13.8C27.1 14.4 27.1 15.3 26.5 15.9L24.7 17.6C24.1 18.2 23.2 18.2 22.6 17.6L16 11.1L9.4 17.6C8.8 18.2 7.9 18.2 7.3 17.6L5.5 15.9C4.9 15.3 4.9 14.4 5.5 13.8Z"
        className="fill-[#315C45] dark:fill-[#A3C7AD]"
      />
    </svg>
  );
}
