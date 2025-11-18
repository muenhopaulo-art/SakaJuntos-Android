'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

const LojistaProductsList = dynamic(
  () => import('@/components/lojista/lojista-products-list').then(mod => mod.LojistaProductsList),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-8">
            <div className="space-y-2">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-48" />
        </div>
        <Card>
            <CardContent>
                <Skeleton className="h-96 w-full" />
            </CardContent>
        </Card>
      </div>
    ),
  }
);

export default function LojistaProductsPage() {
  return <LojistaProductsList />;
}
