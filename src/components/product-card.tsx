

'use client';

import type { Product, User } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader } from './ui/card';
import { ShoppingCart, Package, Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/cart-context';
import { ScheduleServiceDialog } from './schedule-service-dialog';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
};

interface ProductCardProps {
  product: Product;
  lojistasMap?: Map<string, User>;
  onAddToCart?: (product: Product) => void; // Allow custom add to cart action
}

export function ProductCard({ product, lojistasMap, onAddToCart }: ProductCardProps) {
  const { addItem } = useCart();
  const [user] = useAuthState(auth);
  
  const isOwner = user && product.lojistaId === user.uid;

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onAddToCart) {
        onAddToCart(product);
    } else {
        if(isOwner) return; // double check
        addItem(product, 1, user?.uid);
    }
  };
  
  const lojista = product.lojistaId ? lojistasMap?.get(product.lojistaId) : null;
  const isService = product.productType === 'service';
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined;

  const cardContent = (
    <Card className={cn("flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-1 bg-card", isOwner && "bg-muted/30")}>
    <CardHeader className="p-4">
        {lojista && (
            <Link href={`/vendedores/${lojista.uid}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={lojista.photoURL} alt={lojista.name} />
                    <AvatarFallback>{getInitials(lojista.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{lojista.name}</p>
                    {lojista.province && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{lojista.province}</p>}
                </div>
            </Link>
        )}
    </CardHeader>
    <Link href={`/produto/${product.id}`} className="flex-grow flex flex-col p-4 pt-0">
        <CardContent className="p-0 flex-grow flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg mb-4 bg-muted flex items-center justify-center">
                {imageUrl ? (
                    <Image src={imageUrl} alt={product.name} fill className="object-cover" />
                ) : (
                    <Package className="w-16 h-16 text-muted-foreground"/>
                )}
                 {isOwner && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">Seu Item</div>
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
        </CardContent>
    </Link>
     <div className="p-4 pt-0">
        {isService ? (
            <ScheduleServiceDialog product={product}>
              <Button className="w-full mt-auto" disabled={isOwner}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Serviço
              </Button>
            </ScheduleServiceDialog>
        ) : (
            <Button onClick={handleAddToCart} className="w-full mt-auto" disabled={product.stock === 0 || isOwner}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                 {isOwner ? 'Este é seu produto' : product.stock === 0 ? 'Indisponível' : 'Adicionar'}
            </Button>
        )}
     </div>
    </Card>
  );

  return (
    <div className="h-full group">
       {cardContent}
    </div>
  );
}
