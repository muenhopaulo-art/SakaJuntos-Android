import { ProductCard } from '@/components/product-card';
import { products } from '@/lib/mock-data';

export default function MiniShoppingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">MiniShopping</h1>
        <p className="text-xl text-muted-foreground">
          Encontre tudo o que precisa, à distância de um clique.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
