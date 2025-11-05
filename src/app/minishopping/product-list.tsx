
'use client';

import { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { Search, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { getProducts } from '@/services/product-service';

interface ProductListProps {
    initialProducts: Product[];
    initialSearchTerm?: string;
}

const ITEMS_PER_PAGE = 8;

export function ProductList({ initialProducts, initialSearchTerm = '' }: ProductListProps) {
  const [products, setProducts] = useState(initialProducts.slice(0, ITEMS_PER_PAGE));
  const [hasMore, setHasMore] = useState(initialProducts.length > ITEMS_PER_PAGE);
  const [offset, setOffset] = useState(ITEMS_PER_PAGE);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);

  const loaderRef = useRef(null);

  const loadMoreProducts = useCallback(async () => {
    if (isFetchingMore || !hasMore || debouncedSearchTerm) return;
    
    setIsFetchingMore(true);
    // In a real app, you'd fetch from an API with pagination.
    // Here we simulate it by slicing the initial full list.
    const newProducts = initialProducts.slice(offset, offset + ITEMSPER_PAGE);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setProducts(prev => [...prev, ...newProducts]);
    setOffset(prev => prev + ITEMS_PER_PAGE);
    setHasMore(initialProducts.length > offset + ITEMS_PER_PAGE);
    setIsFetchingMore(false);

  }, [offset, hasMore, isFetchingMore, initialProducts, debouncedSearchTerm]);


  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      },
      { threshold: 1.0 }
    );

    const loader = loaderRef.current;
    if (loader) {
      observer.observe(loader);
    }

    return () => {
      if (loader) {
        observer.unobserve(loader);
      }
    };
  }, [loadMoreProducts]);


  // Handle search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const path = window.location.pathname; // check if we are on homepage or minishopping

    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
      if (path === '/') {
        // If on homepage and user starts typing, redirect to minishopping
        startTransition(() => {
          router.push(`/minishopping?${params.toString()}`);
        });
      } else {
        // If on minishopping, just update URL
        startTransition(() => {
          router.replace(`/minishopping?${params.toString()}`);
        });
      }
    } else if (path === '/minishopping') {
      params.delete('q');
       startTransition(() => {
          router.replace(`/minishopping?${params.toString()}`);
        });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  useEffect(() => {
    // When the initialProducts list changes (due to search), reset the local state
    setProducts(initialProducts.slice(0, ITEMS_PER_PAGE));
    setOffset(ITEMS_PER_PAGE);
    setHasMore(initialProducts.length > ITEMS_PER_PAGE);
  }, [initialProducts]);
  

  return (
    <>
      <div className="relative w-full max-w-lg mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
              type="text"
              placeholder="Pesquisar por produtos ou serviços..."
              className="pl-10 h-12 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>
      
      {isPending ? (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : products.length === 0 && debouncedSearchTerm ? (
        <div className="text-center py-10">
            <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado para "{debouncedSearchTerm}".</p>
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
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
            </div>
             {hasMore && (
                <div ref={loaderRef} className="flex justify-center items-center py-8">
                  {isFetchingMore && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                </div>
              )}
        </>
      )}
    </>
  );
}
