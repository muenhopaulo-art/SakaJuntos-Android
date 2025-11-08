
'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetTrigger, SheetClose } from './ui/sheet';
import { Menu, User, LogOut, LayoutDashboard, Shield, Package, ShoppingBag, Bell } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { CartSheetContent } from './cart-sheet-content';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from './ui/avatar';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUser, setUserOnlineStatus, type User as AppUser } from '@/services/user-service';
import { CartSheet } from './cart-sheet';
import { Logo } from './Logo';
import { NotificationsSheet } from './notifications-sheet';


export function SiteHeader() {
  const { totalItems } = useCart();
  const [user, loading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getUser(user.uid).then(setAppUser);
    } else {
      setAppUser(null);
    }
  }, [user]);

  const handleLogout = async () => {
    if (user) {
      await setUserOnlineStatus(user.uid, false);
    }
    await auth.signOut();
    router.push('/login');
  }

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
  }

  const navLinks = [
    { href: '/', label: 'Início'},
    { href: '/minishopping', label: 'MiniShopping'},
    { href: '/grupos', label: 'Grupos'},
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo />
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {link.label}
                </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between w-full">
            <Link href="/" className="flex items-center space-x-2">
                <Logo />
            </Link>
            <div className="flex items-center">
                {loading ? (
                    <div className='h-8 w-8 bg-muted animate-pulse rounded-full' />
                ) : user && appUser ? (
                    <>
                    <NotificationsSheet />
                    <CartSheet />
                    </>
                ) : (
                    <Button asChild size="sm">
                        <Link href="/login">Login</Link>
                    </Button>
                )}
                 <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" className="px-2 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <CartSheetContent side="right" className="pr-0" isSheet={true}>
                        <div className='flex flex-col h-full'>
                        <Link href="/" className="mb-4 flex items-center space-x-2">
                            <SheetClose asChild>
                            <Logo />
                            </SheetClose>
                        </Link>
                        <div className="flex flex-col space-y-3">
                            {navLinks.map((link) => (
                                <SheetClose asChild key={link.href}>
                                <Link href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                                    {link.label}
                                </Link>
                                </SheetClose>
                            ))}
                             {user && appUser ? (
                                <>
                                 {appUser.role !== 'courier' && (
                                    <SheetClose asChild>
                                    <Link href={appUser.role === 'admin' ? '/admin' : '/lojista'} className="transition-colors hover:text-foreground/80 text-foreground/60">
                                        Mudar para Vendedor
                                    </Link>
                                    </SheetClose>
                                )}
                                <SheetClose asChild>
                                    <Link href="/my-orders" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                        Meus Pedidos
                                    </Link>
                                 </SheetClose>
                                 <button onClick={handleLogout} className="text-left transition-colors hover:text-foreground/80 text-foreground/60">
                                    Sair
                                </button>
                                </>
                             ) : (
                                 <SheetClose asChild>
                                    <Link href="/login" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                        Login
                                    </Link>
                                </SheetClose>
                             )}
                        </div>
                        </div>
                    </CartSheetContent>
                </Sheet>
            </div>
        </div>

        <div className="hidden w-full flex-1 md:flex md:items-center md:justify-end">
          <nav className="flex items-center">
            {loading ? (
                <div className='h-8 w-20 bg-muted animate-pulse rounded-md' />
            ) : user && appUser ? (
                <>
                <NotificationsSheet />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(appUser.name || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{appUser.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                      {appUser.role !== 'courier' && (
                        <DropdownMenuItem asChild>
                          <Link href={appUser.role === 'admin' ? '/admin' : '/lojista'}>
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              <span>Mudar para Vendedor</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/my-orders">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Meus Pedidos</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <CartSheet />
                </>
            ) : (
                <Button asChild>
                    <Link href="/login">Login</Link>
                </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
