
'use client';

import { useState, useEffect, useTransition, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { Search, Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';

interface ProductListProps {
    allProducts: Product[];
    initialSearchTerm?: string;
}

const ITEMS_PER_PAGE = 8;

export function ProductList({ allProducts, initialSearchTerm = '' }: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || initialSearchTerm;
  
  const [searchTerm, setSearchTerm] = useState(q);
  const [isPending, startTransition] = useTransition();

  // Debounce the search term that comes from the URL or initial prop
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const filteredProducts = useMemo(() => {
    // Separate promoted and non-promoted for prioritization
    const promoted = allProducts.filter(p => p.isPromoted === 'active');
    const notPromoted = allProducts.filter(p => p.isPromoted !== 'active');

    if (!debouncedSearchTerm) {
      // If no search term, return promoted first, then the rest (already shuffled from server)
      return [...promoted, ...notPromoted];
    }
    
    const lowercasedTerm = debouncedSearchTerm.toLowerCase();
    
    // Filter both lists
    const filteredPromoted = promoted.filter(p => 
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.category.toLowerCase().includes(lowercasedTerm)
    );
    const filteredNotPromoted = notPromoted.filter(p => 
      p.name.toLowerCase().includes(lowercasedTerm) ||
      p.category.toLowerCase().includes(lowercasedTerm)
    );
    
    // Return filtered promoted products first
    return [...filteredPromoted, ...filteredNotPromoted];

  }, [allProducts, debouncedSearchTerm]);
  
  const [displayedProducts, setDisplayedProducts] = useState(filteredProducts.slice(0, ITEMS_PER_PAGE));
  const [offset, setOffset] = useState(ITEMS_PER_PAGE);
  const [hasMore, setHasMore] = useState(filteredProducts.length > ITEMS_PER_PAGE);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef(null);
  
   // Sync state with URL search params
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);
  
  // Effect to update URL from search input
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set('q', debouncedSearchTerm);
    } else {
      params.delete('q');
    }
    startTransition(() => {
      // Using replace to not pollute browser history
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [debouncedSearchTerm, pathname, router, searchParams]);


  // Effect to reset pagination when search term changes
  useEffect(() => {
    setDisplayedProducts(filteredProducts.slice(0, ITEMS_PER_PAGE));
    setOffset(ITEMS_PER_PAGE);
    setHasMore(filteredProducts.length > ITEMS_PER_PAGE);
  }, [filteredProducts]);

  const loadMoreProducts = useCallback(() => {
    if (isFetchingMore || !hasMore) return;

    setIsFetchingMore(true);
    // Simulate network delay for loading more items
    setTimeout(() => {
      const newProducts = filteredProducts.slice(offset, offset + ITEMS_PER_PAGE);
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      const newOffset = offset + ITEMS_PER_PAGE;
      setOffset(newOffset);
      setHasMore(filteredProducts.length > newOffset);
      setIsFetchingMore(false);
    }, 500);
  }, [isFetchingMore, hasMore, offset, filteredProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isFetchingMore) {
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
  }, [loaderRef, hasMore, isFetchingMore, loadMoreProducts]);
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('q') as string;
    router.push(`${pathname}?q=${encodeURIComponent(newSearch)}`);
  };

  return (
    <>
      <div className="sticky top-16 md:top-20 z-40 bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="search"
                name="q"
                placeholder="Pesquisar por produtos..."
                className="pl-10 h-12 text-base"
                defaultValue={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </form>
      </div>
      
      {isPending ? (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-lg font-semibold text-muted-foreground">
            {debouncedSearchTerm 
              ? `Nenhum produto encontrado para "${debouncedSearchTerm}".`
              : "Nenhum produto encontrado."
            }
          </p>
          <p className="text-muted-foreground mt-2">
             {debouncedSearchTerm 
              ? "Tente uma pesquisa diferente."
              : "Assim que um lojista adicionar produtos, eles aparecerão aqui."
            }
          </p>
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
            {displayedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
            ))}
            </div>
             {/* Loader ref for infinite scroll */}
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
