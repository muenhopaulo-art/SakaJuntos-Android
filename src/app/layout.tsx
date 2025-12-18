"use client";

import type { Metadata } from 'next';
import { PT_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AuthGuard from '@/components/auth-guard';
import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-pt-sans',
});

// A Metadata não pode ser exportada de um componente de cliente, por isso a movemos ou comentamos.
// Para manter a funcionalidade, o ideal seria mover a lógica do 'useEffect' para o AuthGuard,
// mas seguindo a sua instrução, vamos manter o layout como cliente.
/*
export const metadata: Metadata = {
  title: 'SakaJuntos Web',
  description: 'Compras individuais e em grupo, mais perto de si.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icons/icon-192x192.png',
  },
};
*/

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    const setupListener = async () => {
      // Recarrega a página ao voltar do segundo plano
      const listener = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          window.location.reload(); 
        }
      });
      return listener;
    };

    const listenerPromise = setupListener();
    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, []);


  return (
    <html lang="en" className={`light ${ptSans.variable}`}>
      <head>
        <title>SakaJuntos Web</title>
        <meta name="description" content="Compras individuais e em grupo, mais perto de si." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#ADD8E6" />
      </head>
      <body className="font-body antialiased">
        <AuthGuard>
          {children}
        </AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}
