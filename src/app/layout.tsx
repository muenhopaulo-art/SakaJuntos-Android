import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/contexts/cart-context';
import AuthGuard from '@/components/auth-guard';


const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'SakaJuntos Web',
  description: 'Compras individuais e em grupo, mais perto de si.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`light ${ptSans.variable}`}>
      <body className="font-body antialiased">
        <AuthGuard>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </AuthGuard>
      </body>
    </html>
  );
}
