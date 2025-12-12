
'use client';

import { LojistaHeader } from "@/components/lojista/lojista-header";

export default function LojistaLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <>
      <LojistaHeader />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40">
        {children}
      </main>
    </>
  );
}
