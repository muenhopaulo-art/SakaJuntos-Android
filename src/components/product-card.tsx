'use client';

import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart, Package } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addItem: addPersonalItem } = useCart();

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addPersonalItem(product);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground"/>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">{product.name}</h3>
        </div>
        <p className="text-lg font-bold text-foreground mb-4">
          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
        </p>
        <Button className="w-full mt-auto" onClick={handleAddToCart} disabled={!onAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {onAddToCart ? 'Adicionar ao Grupo' : 'Adicionar'}
        </Button>
      </CardContent>
    </Card>
  );
}
