'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = "https://picsum.photos/400/400";

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const imageUrl = product.image || PLACEHOLDER_IMAGE;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.aiHint}/>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-base line-clamp-2 mb-2">{product.name}</h3>
        </div>
        <p className="text-lg font-bold text-foreground mb-4">
          {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}
        </p>
        <Button className="w-full mt-auto" onClick={() => addItem(product)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
}