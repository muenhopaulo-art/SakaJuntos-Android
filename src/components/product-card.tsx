
'use client';

import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ShoppingCart, Package } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };
  
  return (
    <Link href={`/produto/${product.id}`} className="block h-full group">
        <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-card">
        <CardContent className="p-4 flex-grow flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
                {product.imageUrls && product.imageUrls.length > 0 ? (
                <Image src={product.imageUrls[0]} alt={product.name} fill className="object-cover" data-ai-hint={product.aiHint} />
                ) : (
                <Package className="w-16 h-16 text-muted-foreground"/>
                )}
            </div>
            <div className="flex-grow">
            <h3 className="font-semibold text-base line-clamp-2 mb-2">{product.name}</h3>
            </div>
            <p className="text-lg font-bold text-foreground mb-4">
            {product.category === 'serviço' && product.price > 0 && 'A partir de '}
            {product.price > 0 
                ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)
                : 'Preço sob consulta'
            }
            </p>
            {product.category === 'produto' ? (
                 <Button onClick={handleAddToCart} className="w-full mt-auto">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar
                </Button>
            ) : (
                <Button variant="outline" className="w-full mt-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    Ver Detalhes
                </Button>
            )}
        </CardContent>
        </Card>
    </Link>
  );
}
