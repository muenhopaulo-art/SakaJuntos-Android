
'use client';

import Link from 'next/link';
import {
  Bell,
  CircleUser,
  Home,
  LineChart,
  Menu,
  Package,
  ShoppingCart,
  Users,
  Briefcase,
  Bike,
  User,
  LogOut,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  AlertOctagon,
  CheckCircle,
  Headset,
  Settings,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { NotificationsSheet } from '@/components/notifications-sheet';
import { Logo } from '@/components/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { getUser, type User as AppUser } from '@/services/user-service';

function getInitials(name: string) {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}


const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/orders', label: 'Pedidos', icon: Package },
    { href: '/admin/products', label: 'Produtos', icon: ShoppingBag },
    { href: '/admin/promotions', label: 'Aprovações', icon: ShieldCheck },
    { href: '/admin/users', label: 'Utilizadores', icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (user) {
      getUser(user.uid).then(setAppUser);
    }
  }, [user]);

  const handleLogout = async () => {
    if (user) {
        await updateDoc(doc(db, "users", user.uid), { online: false });
    }
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
                href="/admin"
                className="flex items-center gap-2 text-lg font-semibold md:text-base mr-4"
            >
                <Logo />
            </Link>
            {navLinks.map((link) => (
            <Link
                key={link.href}
                href={link.href}
                className={cn(
                'transition-colors hover:text-foreground relative',
                pathname === link.href ? 'text-foreground font-semibold' : 'text-muted-foreground'
                )}
            >
                {link.label}
            </Link>
            ))}
        </nav>
        
        {/* Mobile Header */}
        <Sheet>
            <SheetTrigger asChild>
            <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
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
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
                >
                    <Logo />
                </Link>
                 {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                        'transition-colors hover:text-foreground flex items-center gap-2',
                        pathname === link.href ? 'text-foreground font-semibold' : 'text-muted-foreground'
                        )}
                    >
                       <link.icon className="h-5 w-5"/>
                        {link.label}
                    </Link>
                ))}
            </nav>
            </SheetContent>
        </Sheet>
        
        <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <NotificationsSheet />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                    {appUser ? (
                        <Avatar className="h-8 w-8">
                             <AvatarImage src={appUser.photoURL} alt={appUser.name} />
                             <AvatarFallback>{getInitials(appUser.name)}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <CircleUser className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Configurações</DropdownMenuItem>
                <DropdownMenuItem>Suporte</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        {children}
      </main>
    </div>
  );
}
