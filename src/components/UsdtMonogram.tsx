import { cn } from '@/lib/utils';

interface UsdtMonogramProps {
  size?: number;
  className?: string;
  letter?: string;
}

/** Moneta dorata con monogramma "U" stile LYRA */
export function UsdtMonogram({ size = 48, className, letter = 'U' }: UsdtMonogramProps) {
  return (
    <div
      className={cn('usdt-coin shrink-0', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {letter}
    </div>
  );
}
