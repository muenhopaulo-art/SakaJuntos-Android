'use client';

import Image from 'next/image';
import type { GroupPromotion } from '@/lib/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useCart } from '@/contexts/cart-context';
import { Progress } from './ui/progress';
import { Users, ShoppingCart } from 'lucide-react';

interface PromotionCardProps {
  promotion: GroupPromotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const { addItem } = useCart();
  const progress = (promotion.participants / promotion.target) * 100;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 bg-card">
      <CardHeader>
        <CardTitle className="font-headline">{promotion.name}</CardTitle>
        <CardDescription className="line-clamp-2">{promotion.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <Image src={promotion.image} alt={promotion.name} fill className="object-cover" data-ai-hint={promotion.aiHint} />
        </div>
        <div className="space-y-2">
            <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(promotion.price)}
            </p>
            <div>
            <div className="flex justify-between items-center mb-1 text-sm text-muted-foreground">
                <span className='flex items-center gap-1'><Users className='w-4 h-4' /> Participantes</span>
                <span>{promotion.participants} / {promotion.target}</span>
            </div>
            <Progress value={progress} className="h-2" />
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => addItem(promotion)}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Juntar-se ao Grupo
        </Button>
      </CardFooter>
    </Card>
  );
}
