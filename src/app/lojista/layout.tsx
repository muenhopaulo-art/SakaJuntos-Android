
'use client';

import { LojistaHeader } from "@/components/lojista/lojista-header";

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <LojistaHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
