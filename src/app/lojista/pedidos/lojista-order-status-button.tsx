
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCheck, Send, Bike, Truck } from 'lucide-react';
import { updateLojistaOrderStatus, confirmLojistaDelivery } from './actions';
import type { Order } from '@/lib/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
    'a aguardar lojista': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
    'pronto para recolha': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
    'a caminho': 'bg-indigo-500/20 text-indigo-700',
    'entregue': 'bg-green-500/20 text-green-700',
    'cancelado': 'bg-red-500/20 text-red-700',
    'pendente': 'bg-gray-500/20 text-gray-700',
    'aguardando confirmação': 'bg-cyan-500/20 text-cyan-700',
};


export function LojistaOrderStatusButton({ order }: { order: Order }) {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (status: Order['status']) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Utilizador não autenticado.' });
        return;
    }
    setIsLoading(true);
    const result = await updateLojistaOrderStatus(order.id, status, user.uid);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Estado do Pedido Atualizado!', description: 'O estado do pedido foi atualizado com sucesso.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message || 'Não foi possível atualizar o estado do pedido.' });
    }
  };

  const handleConfirmDelivery = async () => {
    if (!user) return;
    setIsLoading(true);
    const result = await confirmLojistaDelivery(order.id, user.uid);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Entrega Confirmada!', description: 'A aguardar confirmação do cliente.' });
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };

  if (order.status === 'a aguardar lojista') {
     return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCheck className="mr-2" />}
                    Ações de Entrega
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleUpdate('pronto para recolha')}>
                    <Send className="mr-2 h-4 w-4" />
                    <span>Atribuir Entregador</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUpdate('a caminho')}>
                    <Bike className="mr-2 h-4 w-4" />
                    <span>Eu Mesmo Entrego</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
     )
  }

  // If the lojista is the one delivering, they see the "Confirm Delivery" button
  if (order.status === 'a caminho' && order.courierId === user?.uid) {
    return (
        <Button size="sm" onClick={handleConfirmDelivery} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Truck className="mr-2" />}
            Confirmar Entrega
        </Button>
    )
  }
  
  return <Badge variant="outline" className={cn("capitalize", statusColors[order.status])}>{order.status}</Badge>;
}
