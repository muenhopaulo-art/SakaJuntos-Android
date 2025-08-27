import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PromotionCard } from '@/components/promotion-card';
import { getGroupPromotions } from '@/services/product-service';
import { AlertTriangle } from 'lucide-react';
import type { GroupPromotion } from '@/lib/types';

export default async function GruposPage() {
  let groupPromotions: GroupPromotion[] = [];
  let error: string | null = null;

  try {
    groupPromotions = await getGroupPromotions();
  } catch (e: any) {
    console.error(e);
    error = e.message || "Ocorreu um erro ao buscar as promoções. Verifique se a API do Firestore está habilitada no seu projeto Google Cloud.";
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Promoções de Grupo</h1>
        <p className="text-xl text-muted-foreground">
          Junte-se a outros e poupe. Mais forte, é mais barato!
        </p>
      </div>
       {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Promoções</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2">Por favor, tente <a href="/seed" className="underline">popular a base de dados</a> ou verifique a sua conexão. Se o problema persistir, certifique-se que a API do Firestore está habilitada na sua conta Google Cloud.</p>
          </AlertDescription>
        </Alert>
       ) : groupPromotions.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma promoção encontrada. Tente <a href="/seed" className="underline font-semibold">popular a base de dados</a>.</p>
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
