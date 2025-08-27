import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PromotionCard } from '@/components/promotion-card';
import { getGroupPromotions } from '@/services/product-service';
import { AlertTriangle } from 'lucide-react';
import type { GroupPromotion } from '@/lib/types';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        if (error.message.includes('not-found')) {
            return "O banco de dados Firestore não foi encontrado. Por favor, crie um no seu projeto Firebase.";
        }
        if (error.message.includes('permission-denied')) {
            return "A API do Firestore não está habilitada. Por favor, habilite-a no seu projeto Google Cloud.";
        }
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar as promoções.";
}


export default async function GruposPage() {
  let groupPromotions: GroupPromotion[] = [];
  let error: string | null = null;

  try {
    groupPromotions = await getGroupPromotions();
  } catch (e: any) {
    console.error(e);
    error = getErrorMessage(e);
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
            <p className="mt-2">Por favor, tente novamente ou verifique a sua conexão. Se o problema persistir, certifique-se que a base de dados existe e que a API do Firestore está habilitada na sua conta Google Cloud.</p>
          </AlertDescription>
        </Alert>
       ) : groupPromotions.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-lg font-semibold text-muted-foreground">Nenhuma promoção encontrada.</p>
          <p className="text-muted-foreground mt-2">Parece que a base de dados está vazia. Que tal adicionar alguns produtos?</p>
          <a href="/seed" className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
            Popular a Base de Dados
          </a>
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
