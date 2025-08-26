import { PromotionCard } from '@/components/promotion-card';
import { getGroupPromotions } from '@/services/product-service';

export default async function GruposPage() {
  const groupPromotions = await getGroupPromotions();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Promoções de Grupo</h1>
        <p className="text-xl text-muted-foreground">
          Junte-se a outros e poupe. Mais forte, é mais barato!
        </p>
      </div>
       {groupPromotions.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma promoção encontrada. Tente popular a base de dados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupPromotions.map(promo => (
            <PromotionCard key={promo.id} promotion={promo} />
          ))}
        </div>
      )}
    </div>
  );
}
