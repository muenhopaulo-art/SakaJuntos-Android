'use client';

import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Users } from 'lucide-react';
import Link from 'next/link';

interface PromotionCardProps {
  promotion: GroupPromotion;
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const progress = (promotion.participants / promotion.target) * 100;

  return (
    <Link href={`/grupos/${promotion.id}`} className="block h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
      <Card className="flex flex-col h-full overflow-hidden bg-card">
        <CardHeader>
          <CardTitle className="font-headline">{promotion.name}</CardTitle>
          <CardDescription className="line-clamp-2">{promotion.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            <Users className="w-16 h-16 text-muted-foreground" />
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
      </Card>
    </Link>
  );
}
