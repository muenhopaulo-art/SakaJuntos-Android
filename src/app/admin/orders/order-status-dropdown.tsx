'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateOrderStatus } from './actions';
import type { Order } from '@/lib/types';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusOptions: Order['status'][] = ['Pendente', 'A caminho', 'Entregue'];

const statusColors: Record<Order['status'], string> = {
    Pendente: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
    'A caminho': 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
    Entregue: 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
};


export function OrderStatusDropdown({ order }: { order: Order }) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: Order['status']) => {
    if (newStatus === currentStatus) return;
    
    setIsLoading(true);
    const result = await updateOrderStatus(order.id, newStatus);
    setIsLoading(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      toast({ title: 'Status Atualizado!', description: `O pedido #${order.id.substring(0, 6)} foi atualizado para "${newStatus}".` });
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível atualizar o status do pedido.' });
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="outline"
                className={cn("w-36 justify-between", statusColors[currentStatus])}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="animate-spin" /> : currentStatus}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        {statusOptions.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => handleStatusChange(status)}
            className="flex justify-between"
          >
            {status}
            {currentStatus === status && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
