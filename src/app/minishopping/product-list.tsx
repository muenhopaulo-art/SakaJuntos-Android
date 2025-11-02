
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { Search } from 'lucide-react';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';

interface ProductListProps {
    initialProducts: Product[];
    initialSearchTerm?: string;
}

export function ProductList({ initialProducts, initialSearchTerm = '' }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
    } else {
      params.delete('q');
    }
    
    startTransition(() => {
      router.replace(`/minishopping?${params.toString()}`);
    });
  }, [debouncedSearchTerm, router, searchParams]);

  return (
    <>
      <div className="space-y-4 mb-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight font-headline">MiniShopping</h1>
            <p className="text-xl text-muted-foreground">
              Encontre tudo o que precisa, à distância de um clique.
            </p>
        </div>
        <div className="relative w-full max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Pesquisar produtos..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      
      {products.length === 0 && initialSearchTerm ? (
        <div className="text-center py-10">
            <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado para "{initialSearchTerm}".</p>
            <p className="text-muted-foreground mt-2">Tente uma pesquisa diferente.</p>
        </div>
      ) : products.length === 0 ? (
         <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado.</p>
          <p className="text-muted-foreground mt-2">Parece que a base de dados está vazia. Que tal adicionar alguns produtos?</p>
           <Link href="/seed" className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
            Popular a Base de Dados
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
              <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </>
  );
}
