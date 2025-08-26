'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { Sheet, SheetTrigger } from './ui/sheet';
import { Menu, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { CartSheetContent } from './cart-sheet-content';

export function SiteHeader() {
  const { totalItems } = useCart();

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/minishopping', label: 'MiniShopping' },
    { href: '/grupos', label: 'Grupos' },
    { href: '/cart', label: 'Carrinho' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block font-headline">SakaJuntos</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navLinks.slice(1,3).map(link => (
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
                <ShoppingCart className="h-6 w-6" />
                <span className="font-bold font-headline">SakaJuntos</span>
            </Link>
            <div className="flex flex-col space-y-3">
                {navLinks.map(link => (
                    <SheetTrigger asChild key={link.href}>
                      <Link href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60">
                          {link.label}
                      </Link>
                    </SheetTrigger>
                ))}
            </div>
            </div>
          </CartSheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search can go here */}
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                    {totalItems}
                  </span>
                )}
                <span className="sr-only">Abrir carrinho</span>
              </Button>
            </SheetTrigger>
            <CartSheetContent />
          </Sheet>
        </div>
      </div>
    </header>
  );
}
