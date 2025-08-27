'use client';

import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Users, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

interface PromotionCardProps {
  promotion: GroupPromotion;
  showJoinButton: boolean;
  onJoin: (groupId: string) => void;
}

export function PromotionCard({ promotion, showJoinButton, onJoin }: PromotionCardProps) {
  const progress = (promotion.participants / promotion.target) * 100;

  const cardContent = (
    <Card className="flex flex-col h-full overflow-hidden bg-card transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle className="font-headline">{promotion.name}</CardTitle>
        <CardDescription className="line-clamp-2 h-[40px]">{promotion.description}</CardDescription>
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
      {showJoinButton && (
        <CardFooter>
            <Button className='w-full' variant="outline" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onJoin(promotion.id); }}>
                <UserPlus className='mr-2' />
                Pedir para Aderir
            </Button>
        </CardFooter>
      )}
    </Card>
  );

  return (
    <Link href={`/grupos/${promotion.id}`} className="block h-full">
      {cardContent}
    </Link>
  );
}
