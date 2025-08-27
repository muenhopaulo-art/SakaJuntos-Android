import { ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <ShoppingCart className="h-full w-full" />
    </div>
  );
}
