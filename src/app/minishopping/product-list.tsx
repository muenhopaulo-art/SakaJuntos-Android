

'use client';

import { useState, useEffect, useTransition, useCallback, useRef, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/product-card';
import { Search, Loader2, ListFilter, MapPin } from 'lucide-react';
import type { Product, User } from '@/lib/types';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { productCategories, provinces } from '@/lib/categories';

interface ProductListProps {
    allProducts: Product[];
    lojistasMap: Map<string, User>;
    initialSearchTerm?: string;
}

const ITEMS_PER_PAGE = 8;
const PROMOTED_INTERVAL = 5; // Insert a promoted product every 5 items

// Helper function to shuffle an array
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export function ProductList({ allProducts, lojistasMap, initialSearchTerm = '' }: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || initialSearchTerm;
  
  const [searchTerm, setSearchTerm] = useState(q);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  const [user] = useAuthState(auth);
  const [appUser, setAppUser] = useState<User | null>(null);

  useEffect(() => {
    if(user) {
      getUser(user.uid).then(setAppUser);
    }
  }, [user]);

  const productBuckets = useMemo(() => {
    // 1. Filter by search term, category, and province
    const filtered = allProducts.filter(p => {
        const lojista = p.lojistaId ? lojistasMap.get(p.lojistaId) : null;
        const matchesSearch = debouncedSearchTerm 
            ? p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || p.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            : true;
        const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(p.category) : true;
        const matchesProvince = selectedProvinces.length > 0 ? (lojista && lojista.province && selectedProvinces.includes(lojista.province)) : true;
        
        return matchesSearch && matchesCategory && matchesProvince;
    });

    // 2. Separate into categories
    const promoted = filtered.filter(p => p.isPromoted === 'active');
    const nonPromoted = filtered.filter(p => p.isPromoted !== 'active');
    
    const userProvince = appUser?.province;
    
    let localProducts: Product[] = [];
    let otherProducts: Product[] = [];

    if(userProvince) {
      nonPromoted.forEach(p => {
        const lojista = p.lojistaId ? lojistasMap.get(p.lojistaId) : null;
        if(lojista && lojista.province === userProvince) {
          localProducts.push(p);
        } else {
          otherProducts.push(p);
        }
      });
    } else {
      otherProducts = nonPromoted;
    }
    
    // 3. Shuffle the different buckets to create a randomized order for the session
    return {
      shuffledPromoted: shuffleArray(promoted),
      shuffledBase: shuffleArray([...localProducts, ...otherProducts]),
    };

  }, [allProducts, lojistasMap, debouncedSearchTerm, selectedCategories, selectedProvinces, appUser]);
  
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loaderRef = useRef(null);
  const pageRef = useRef(0);
  
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
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, [debouncedSearchTerm, pathname, router, searchParams]);

  const generateFeedPage = useCallback((page: number) => {
    const { shuffledBase, shuffledPromoted } = productBuckets;
    const newProducts: Product[] = [];

    if (shuffledBase.length === 0 && shuffledPromoted.length === 0) {
      return [];
    }

    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    for (let i = startIndex; i < endIndex; i++) {
        // Calculate the position in the base feed, looping if necessary
        const baseIndex = i % shuffledBase.length;
        if(shuffledBase[baseIndex]) {
            newProducts.push(shuffledBase[baseIndex]);
        }
        
        // Interleave a promoted product
        if ((i + 1) % PROMOTED_INTERVAL === 0 && shuffledPromoted.length > 0) {
            const promotedIndex = Math.floor(i / PROMOTED_INTERVAL) % shuffledPromoted.length;
            newProducts.push(shuffledPromoted[promotedIndex]);
        }
    }
    return newProducts;
  }, [productBuckets]);

  // Effect to reset pagination when filters change
  useEffect(() => {
    pageRef.current = 0;
    const initialProducts = generateFeedPage(0);
    setDisplayedProducts(initialProducts);
  }, [productBuckets, generateFeedPage]);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
        prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvinces(prev => 
        prev.includes(province) 
        ? prev.filter(p => p !== province)
        : [...prev, province]
    );
  };

  const loadMoreProducts = useCallback(() => {
    if (isFetchingMore) return;

    setIsFetchingMore(true);
    // Simulate network delay for loading more items
    setTimeout(() => {
      pageRef.current++;
      const newProducts = generateFeedPage(pageRef.current);
      setDisplayedProducts(prev => [...prev, ...newProducts]);
      setIsFetchingMore(false);
    }, 500);
  }, [isFetchingMore, generateFeedPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isFetchingMore) {
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
  }, [loaderRef, isFetchingMore, loadMoreProducts]);
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSearch = formData.get('q') as string;
    router.push(`${pathname}?q=${encodeURIComponent(newSearch)}`);
  };

  return (
    <>
      <div className="sticky top-16 md:top-20 z-40 bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg mx-auto mb-2">
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
         <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                        <ListFilter className="mr-2 h-4 w-4"/> 
                        Categorias {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-48">
                        {productCategories.map(category => (
                            <DropdownMenuItem key={category} onSelect={(e) => e.preventDefault()}>
                                <Checkbox 
                                    id={`cat-${category}`}
                                    checked={selectedCategories.includes(category)}
                                    onCheckedChange={() => handleCategoryChange(category)}
                                    className="mr-2"
                                />
                                <label htmlFor={`cat-${category}`} className="w-full cursor-pointer">{category}</label>
                            </DropdownMenuItem>
                        ))}
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                        <MapPin className="mr-2 h-4 w-4"/> 
                        Províncias {selectedProvinces.length > 0 && `(${selectedProvinces.length})`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>Filtrar por Província</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ScrollArea className="h-48">
                        {provinces.map(province => (
                            <DropdownMenuItem key={province} onSelect={(e) => e.preventDefault()}>
                                <Checkbox 
                                    id={`prov-${province}`}
                                    checked={selectedProvinces.includes(province)}
                                    onCheckedChange={() => handleProvinceChange(province)}
                                    className="mr-2"
                                />
                                <label htmlFor={`prov-${province}`} className="w-full cursor-pointer">{province}</label>
                            </DropdownMenuItem>
                        ))}
                    </ScrollArea>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      {isPending ? (
         <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : displayedProducts.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-lg font-semibold text-muted-foreground">
            {debouncedSearchTerm || selectedCategories.length > 0 || selectedProvinces.length > 0
              ? `Nenhum produto encontrado para os filtros selecionados.`
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
            {displayedProducts.map((product, index) => (
                <ProductCard key={`${product.id}-${index}`} product={product} lojistasMap={lojistasMap} />
            ))}
            </div>
             {/* Loader ref for infinite scroll */}
            <div ref={loaderRef} className="flex justify-center items-center py-8">
              {isFetchingMore && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
            </div>
        </>
      )}
    </>
  );
}
