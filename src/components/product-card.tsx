
'use client';

import type { Product } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useCart } from '@/contexts/cart-context';
import { ShoppingCart, Package, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { getUser } from '@/services/user-service';
import { useEffect, useState } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addItem: addPersonalItem } = useCart();
  const { toast } = useToast();
  const [lojistaPhone, setLojistaPhone] = useState<string | null>(null);

  useEffect(() => {
    if (product.category === 'serviço' && product.lojistaId) {
      getUser(product.lojistaId).then(lojista => {
        if (lojista && lojista.phone) {
          setLojistaPhone(lojista.phone);
        }
      }).catch(err => console.error("Failed to fetch lojista phone", err));
    }
  }, [product.category, product.lojistaId]);

  const handleAction = () => {
    if (product.category === 'serviço') {
      if (lojistaPhone) {
        window.location.href = `tel:${lojistaPhone}`;
      } else {
        toast({
          title: "Contacto indisponível",
          description: "Não foi possível encontrar o contacto para este serviço.",
          variant: "destructive"
        });
      }
      return;
    }

    // Default to product logic
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addPersonalItem(product);
      toast({
        title: "Adicionado ao Carrinho!",
        description: `${product.name} foi adicionado ao seu carrinho pessoal.`,
      });
    }
  };

  const getButtonContent = () => {
    if (product.category === 'serviço') {
      return (
        <>
          <Phone className="mr-2 h-4 w-4" />
          Ligar
        </>
      );
    }
    return (
      <>
        <ShoppingCart className="mr-2 h-4 w-4" />
        {onAddToCart ? 'Adicionar ao Grupo' : 'Adicionar'}
      </>
    );
  };
  
  const isActionDisabled = product.category === 'serviço' && !lojistaPhone;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.aiHint} />
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
        <Button className="w-full mt-auto" onClick={handleAction} disabled={isActionDisabled}>
          {getButtonContent()}
        </Button>
      </CardContent>
    </Card>
  );
}
