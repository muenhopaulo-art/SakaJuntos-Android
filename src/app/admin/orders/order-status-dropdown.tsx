
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateOrderStatus } from '../actions';
import type { Order, OrderStatus } from '@/lib/types';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const statusOptions: OrderStatus[] = [
    'Pendente', 
    'A aguardar lojista', 
    'Pronto para recolha', 
    'A caminho', 
    'Entregue', 
    'Cancelado'
];

const statusColors: Record<OrderStatus, string> = {
    'Pendente': 'bg-gray-500/20 text-gray-700 border-gray-500/30 hover:bg-gray-500/30',
    'A aguardar lojista': 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30 hover:bg-yellow-500/30',
    'Pronto para recolha': 'bg-blue-500/20 text-blue-700 border-blue-500/30 hover:bg-blue-500/30',
    'A caminho': 'bg-indigo-500/20 text-indigo-700 border-indigo-500/30 hover:bg-indigo-500/30',
    'Entregue': 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30',
    'Cancelado': 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30',
};


export function OrderStatusDropdown({ order }: { order: Order }) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (newStatus === currentStatus) return;
    
    setIsLoading(true);
    const result = await updateOrderStatus(order.id, newStatus);
    setIsLoading(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      toast({ title: 'Status Atualizado!', description: `O pedido #${order.id.substring(0, 6)} foi atualizado para "${newStatus}".` });
      // This will trigger a re-render of the page, fetching fresh data.
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message || 'Não foi possível atualizar o status do pedido.' });
    }
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button
                variant="outline"
                className={cn("w-48 justify-between", statusColors[currentStatus])}
                disabled={isLoading}
            >
                {isLoading ? <Loader2 className="animate-spin" /> : currentStatus}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
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
