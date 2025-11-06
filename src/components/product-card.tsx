

'use client';

import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ShoppingCart, Package, Phone, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { ScheduleServiceDialog } from './schedule-service-dialog';

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
  
  const cardLink = product.productType === 'service' ? '#' : `/produto/${product.id}`;

  const cardContent = (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-card">
    <CardContent className="p-4 flex-grow flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
            {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
            ) : (
                <Package className="w-16 h-16 text-muted-foreground"/>
            )}
        </div>
        <div className="flex-grow">
          <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
          <h3 className="font-semibold text-base line-clamp-2 mb-2">{product.name}</h3>
        </div>
        <p className="text-lg font-bold text-foreground mb-4">
        {product.price > 0 
            ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)
            : 'Preço sob consulta'
        }
        </p>
        {product.productType === 'service' ? (
            <ScheduleServiceDialog product={product}>
              <Button className="w-full mt-auto">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Serviço
              </Button>
            </ScheduleServiceDialog>
        ) : (
            <Button onClick={handleAddToCart} className="w-full mt-auto" disabled={product.stock === 0}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Adicionar
            </Button>
        )}
    </CardContent>
    </Card>
  );

  // If it's a service, the card itself doesn't link to a detail page, it opens the dialog.
  if (product.productType === 'service') {
    return cardContent;
  }

  // If it's a product, wrap with a link.
  return (
    <Link href={`/produto/${product.id}`} className="block h-full group">
       {cardContent}
    </Link>
  );
}
