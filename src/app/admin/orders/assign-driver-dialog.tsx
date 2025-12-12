
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getOnlineDeliveryDrivers, assignDriverToOrder } from '../actions';
import type { Order, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Bike, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}


export function AssignDriverDialog({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchDrivers = async () => {
        setLoadingDrivers(true);
        try {
          const onlineDrivers = await getOnlineDeliveryDrivers();
          setDrivers(onlineDrivers);
        } catch (error) {
          toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível carregar os entregadores.' });
        }
        setLoadingDrivers(false);
      };
      fetchDrivers();
    }
  }, [open, toast]);

  const handleAssign = async () => {
    if (!selectedDriver) {
      toast({ variant: 'destructive', title: 'Erro!', description: 'Por favor, selecione um entregador.' });
      return;
    }
    setAssigning(true);
    const result = await assignDriverToOrder(order.id, selectedDriver);
    setAssigning(false);

    if (result.success) {
      toast({ title: 'Entregador Atribuído!', description: `O entregador ${selectedDriver.name} foi atribuído ao pedido.` });
      setOpen(false);
      // This will trigger a re-render of the page, fetching fresh data.
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };

  // Only show the button if the order is ready for pickup
  if (order.status !== 'pronto para recolha') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Bike className="mr-2 h-4 w-4" />
            Atribuir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atribuir Entregador</DialogTitle>
          <DialogDescription>
            Selecione um entregador online para o pedido #{order.id.substring(0, 6)}.
          </DialogDescription>
        </DialogHeader>
        <Command>
            <CommandInput placeholder="Procurar entregador..." />
            <CommandList>
                <CommandEmpty>
                    {loadingDrivers ? 'A carregar...' : 'Nenhum entregador online encontrado.'}
                </CommandEmpty>
                {loadingDrivers ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <CommandGroup>
                        {drivers.map((driver) => (
                        <CommandItem
                            key={driver.uid}
                            value={driver.name}
                            onSelect={() => {
                                setSelectedDriver(driver);
                            }}
                            className={selectedDriver?.uid === driver.uid ? 'bg-accent' : ''}
                        >
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{driver.name}</p>
                                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                                </div>
                            </div>
                        </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </Command>
        {selectedDriver && (
            <div className="text-sm p-2 bg-muted rounded-md text-center">
                Entregador selecionado: <strong>{selectedDriver.name}</strong>
            </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleAssign} disabled={!selectedDriver || assigning}>
            {assigning ? <Loader2 className="animate-spin mr-2" /> : null}
            Confirmar Atribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
