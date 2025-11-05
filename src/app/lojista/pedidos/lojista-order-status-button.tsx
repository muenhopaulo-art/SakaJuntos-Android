
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCheck } from 'lucide-react';
import { updateLojistaOrderStatus } from './actions';
import type { Order } from '@/lib/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    'a aguardar lojista': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    'pronto para recolha': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    'a caminho': 'bg-indigo-500/20 text-indigo-700',
    'entregue': 'bg-green-500/20 text-green-700',
    'cancelado': 'bg-red-500/20 text-red-700',
    'pendente': 'bg-gray-500/20 text-gray-700'
};


export function LojistaOrderStatusButton({ order }: { order: Order }) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleMarkAsReady = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Utilizador não autenticado.' });
        return;
    }
    setIsLoading(true);
    const result = await updateLojistaOrderStatus(order.id, 'pronto para recolha', user.uid);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Pedido Pronto!', description: 'O administrador foi notificado que o pedido está pronto para recolha.' });
      // The page will re-render automatically due to revalidatePath on the server action
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message || 'Não foi possível atualizar o estado do pedido.' });
    }
  };

  // Lojista can only action orders assigned to them that are awaiting their action
  if (order.status !== 'a aguardar lojista') {
    return <Badge variant="outline" className={cn("capitalize", statusColors[order.status])}>{order.status}</Badge>;
  }

  return (
    <Button
        variant="outline"
        size="sm"
        onClick={handleMarkAsReady}
        disabled={isLoading}
    >
      {isLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCheck className="mr-2" />}
      Marcar como Pronto
    </Button>
  );
}
