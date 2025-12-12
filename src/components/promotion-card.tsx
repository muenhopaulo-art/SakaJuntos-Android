
'use client';

import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Users, UserPlus, Hourglass, Package, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface PromotionCardProps {
  promotion: GroupPromotion;
  showJoinButton?: boolean;
  onJoin?: (groupId: string) => void;
  isJoining?: boolean;
  isRequested?: boolean;
}

export function PromotionCard({ 
    promotion, 
    showJoinButton = false, 
    onJoin,
    isJoining = false,
    isRequested = false
}: PromotionCardProps) {
  const progress = (promotion.participants / promotion.target) * 100;
  const isFinalized = promotion.status === 'finalized';
  const isDelivered = promotion.status === 'delivered';
  const imageUrl = promotion.imageUrls && promotion.imageUrls.length > 0 ? promotion.imageUrls[0] : undefined;

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onJoin) {
      onJoin(promotion.id);
    }
  };

  const renderJoinButton = () => {
    if (isRequested) {
      return (
        <Button className='w-full' variant="outline" disabled>
          <Check className='mr-2' />
          Solicitação Enviada
        </Button>
      );
    }
    if (isJoining) {
        return (
             <Button className='w-full' variant="outline" disabled>
                <Loader2 className='mr-2 animate-spin' />
                A enviar...
            </Button>
        )
    }
    return (
      <Button className='w-full' variant="outline" onClick={handleJoinClick} disabled={isFinalized || isDelivered}>
        <UserPlus className='mr-2' />
        Pedir para Aderir
      </Button>
    );
  }

  const cardContent = (
    <Card className={cn("flex flex-col h-full overflow-hidden bg-card transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1", isFinalized && "bg-muted/50")}>
       {isFinalized && (
        <div className="p-2 text-xs bg-yellow-500/20 text-yellow-800 flex items-center gap-2 font-medium">
          <Hourglass className="h-4 w-4" />
          <span>Pedido em processamento</span>
        </div>
      )}
      {isDelivered && (
        <div className="p-2 text-xs bg-green-500/20 text-green-800 flex items-center gap-2 font-medium">
          <Users className="h-4 w-4" />
          <span>Pedido entregue</span>
        </div>
      )}
      <CardHeader>
        <CardTitle className="font-headline">{promotion.name}</CardTitle>
        <CardDescription className="line-clamp-2 h-[40px]">{promotion.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
            {imageUrl ? (
              <Image src={imageUrl} alt={promotion.name} fill className="object-cover" data-ai-hint={promotion.aiHint}/>
            ) : (
              <Package className="w-16 h-16 text-muted-foreground"/>
            )}
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
            {renderJoinButton()}
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
