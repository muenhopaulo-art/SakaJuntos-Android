'use client';

import Link from 'next/link';
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Briefcase,
  Bike,
  User,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { NotificationsSheet } from '../notifications-sheet';

export function LojistaHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  const handleLogout = async () => {
    if (user) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { online: false });
    }
    await auth.signOut();
    router.push('/login');
  };

  const navLinks = [
    { href: '/lojista/produtos', label: 'Produtos', icon: Package },
    { href: '/lojista/pedidos', label: 'Pedidos', icon: ShoppingCart },
    { href: '/lojista/agendamentos', label: 'Agendamentos', icon: Briefcase },
    { href: '/lojista/entregadores', label: 'Entregadores', icon: Bike },
    { href: '/lojista/perfil', label: 'Perfil', icon: User },
  ];

  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/lojista/produtos"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <span className="font-bold text-green-600 font-headline tracking-tighter">SakaJuntos</span>
          <span className="sr-only">SakaJuntos</span>
        </Link>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'transition-colors hover:text-foreground',
              pathname.startsWith(link.href) ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      
      {/* Mobile Header */}
      <div className="flex w-full items-center md:hidden">
        <Sheet>
            <SheetTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="shrink-0"
            >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
            </Button>
            </SheetTrigger>
            <SheetContent side="left">
            <SheetHeader>
                <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-6 text-lg font-medium">
                <Link
                href="/lojista/produtos"
                className="flex items-center gap-2 text-lg font-semibold"
                >
                <span className="font-bold text-green-600 font-headline tracking-tighter">SakaJuntos</span>
                <span className="sr-only">SakaJuntos</span>
                </Link>
                {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                    'transition-colors hover:text-foreground',
                    pathname.startsWith(link.href) ? 'text-foreground' : 'text-muted-foreground'
                    )}
                >
                    {link.label}
                </Link>
                ))}
            </nav>
            </SheetContent>
        </Sheet>

        <div className="flex-1 text-center">
            <Link
                href="/lojista/produtos"
                className="flex items-center justify-center gap-2 text-lg font-semibold"
                >
                <span className="font-bold text-green-600 font-headline tracking-tighter">SakaJuntos</span>
                <span className="sr-only">SakaJuntos</span>
            </Link>
        </div>
        <div className="w-8 shrink-0"></div>
      </div>
      
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <NotificationsSheet />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link href="/">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    <span>Mudar para Cliente</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/lojista/perfil">Configurações</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Suporte</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
