
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const LojistaDashboardContent = dynamic(
  () => import('@/components/lojista-dashboard-content').then(mod => mod.LojistaDashboardContent),
    { 
        ssr: false,
            loading: () => (
                  <>
                          <div className="flex items-center justify-between">
                                      <div className="space-y-1">
                                                      <Skeleton className="h-8 w-64" />
                                                                      <Skeleton className="h-5 w-80" />
                                                                                  </div>
                                                                                              <Skeleton className="h-10 w-48" />
                                                                                                      </div>
                                                                                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                                                                                                            {Array.from({length: 4}).map((_, i) => (
                                                                                                                                            <Card key={i}>
                                                                                                                                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                                                                                                                                                        <Skeleton className="h-5 w-2/3" />
                                                                                                                                                                                                                <Skeleton className="h-4 w-4" />
                                                                                                                                                                                                                                    </CardHeader>
                                                                                                                                                                                                                                                        <CardContent>
                                                                                                                                                                                                                                                                                <Skeleton className="h-8 w-1/2 mb-2" />
                                                                                                                                                                                                                                                                                                        <Skeleton className="h-4 w-full" />
                                                                                                                                                                                                                                                                                                                            </CardContent>
                                                                                                                                                                                                                                                                                                                                            </Card>
                                                                                                                                                                                                                                                                                                                                                        ))}
                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                            <div className="space-y-4">
                                                                                                                                                                                                                                                                                                                                                                                        <Skeleton className="h-40 w-full" />
                                                                                                                                                                                                                                                                                                                                                                                                    <Skeleton className="h-40 w-full" />
                                                                                                                                                                                                                                                                                                                                                                                                                <Skeleton className="h-40 w-full" />
                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                </>
                                                                                                                                                                                                                                                                                                                                                                                                                                    )
                                                                                                                                                                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                                                                                                      
export default function LojistaPage() {
    return <LojistaDashboardContent />;
}
