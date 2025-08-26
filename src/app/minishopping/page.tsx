import { ProductCard } from '@/components/product-card';
import { getProducts } from '@/services/product-service';

export default async function MiniShoppingPage() {
  const products = await getProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">MiniShopping</h1>
        <p className="text-xl text-muted-foreground">
          Encontre tudo o que precisa, à distância de um clique.
        </p>
      </div>
      {products.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">Nenhum produto encontrado. Tente popular a base de dados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
