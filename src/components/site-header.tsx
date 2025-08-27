'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetTrigger, SheetClose } from './ui/sheet';
import { Menu, ShoppingCart, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { CartSheetContent } from './cart-sheet-content';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
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
import { getUser, type User as AppUser } from '@/services/user-service';

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
    { href: '/cart', label: 'Carrinho' },
  ];

  const desktopNavLinks: { href: string; label: string }[] = [];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">SakaJuntos</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {desktopNavLinks.map(link => (
                <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                    {link.label}
                </Link>
            ))}
          </nav>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <CartSheetContent side="left" className="pr-0" isSheet={true}>
            <div className='flex flex-col h-full'>
            <Link href="/" className="mb-4 flex items-center space-x-2">
                <SheetClose asChild>
                  <ShoppingCart className="h-6 w-6" />
                </SheetClose>
                <span className="font-bold font-headline">SakaJuntos</span>
            </Link>
            <div className="flex flex-col space-y-3">
                {navLinks.map(link => (
                    <SheetClose asChild key={link.href}>
                      <Link href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                          {link.label}
                      </Link>
                    </SheetClose>
                ))}
                 {!user && (
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
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can go here */}
          </div>
          <nav className="flex items-center">
             {loading ? (
                <div className='h-8 w-20 bg-muted animate-pulse rounded-md' />
             ) : user && appUser ? (
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
                          {appUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem asChild>
                        <Link href="/">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Painel</span>
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                     <DropdownMenuItem onClick={handleLogout}>
                       <LogOut className="mr-2 h-4 w-4" />
                       <span>Sair</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
