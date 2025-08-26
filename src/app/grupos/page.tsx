import { PromotionCard } from '@/components/promotion-card';
import { groupPromotions } from '@/lib/mock-data';

export default function GruposPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Promoções de Grupo</h1>
        <p className="text-xl text-muted-foreground">
          Junte-se a outros e poupe. Mais forte, é mais barato!
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupPromotions.map(promo => (
          <PromotionCard key={promo.id} promotion={promo} />
        ))}
      </div>
    </div>
  );
}
