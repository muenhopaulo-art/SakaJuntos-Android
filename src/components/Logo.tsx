import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
        <span className="font-bold text-3xl text-green-600 font-headline tracking-tighter">
            SakaJuntos
        </span>
    </div>
  );
}
