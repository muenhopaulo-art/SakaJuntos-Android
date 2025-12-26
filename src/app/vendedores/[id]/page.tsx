'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { getLojistaProfile } from '../actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Phone, ShoppingBag, Briefcase, UserCircle, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User, Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';


const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
};

const ProfileSkeleton = () => (
    <div className="container mx-auto px-4 py-8 space-y-8">
        <Card>
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
                    <div className="space-y-3 text-center md:text-left">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-56" />
                        <Skeleton className="h-10 w-28" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
        </div>
    </div>
);


export default function LojistaProfilePage() {
    const params = useParams();
    const id = params.id as string;
    
    const [profile, setProfile] = useState<{ lojista: User | null; products: Product[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            getLojistaProfile(id)
                .then(data => {
                    if (!data?.lojista) {
                       notFound();
                    } else {
                       setProfile(data);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError("Não foi possível carregar o perfil do vendedor.");
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return <ProfileSkeleton />;
    }
    
    if (error) {
        return (
             <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    if (!profile) {
        return null; // or a not found component
    }

    const { lojista, products } = profile;
    
    const lojistasMap = new Map<string, User>();
    if (lojista) {
      lojistasMap.set(lojista.uid, lojista);
    }

    const services = products.filter(p => p.productType === 'service');
    const normalProducts = products.filter(p => p.productType !== 'service');

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Perfil Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary">
                            <AvatarImage src={lojista?.photoURL} alt={lojista?.name} />
                            <AvatarFallback className="text-4xl">{getInitials(lojista?.name || '')}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold font-headline">{lojista?.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{lojista?.province || 'Localização não definida'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    <span>Novo Vendedor</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-center md:justify-start">
                                <Button asChild>
                                    <a href={`tel:${lojista?.phone}`}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Ligar
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="products" className="w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold font-headline">Publicações</h2>
                     <TabsList>
                        <TabsTrigger value="products">
                            <ShoppingBag className="mr-2 h-4 w-4"/> Produtos ({normalProducts.length})
                        </TabsTrigger>
                        <TabsTrigger value="services">
                            <Briefcase className="mr-2 h-4 w-4"/> Serviços ({services.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="products">
                     {normalProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {normalProducts.map(product => (
                                <ProductCard key={product.id} product={product} lojistasMap={lojistasMap} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Este vendedor ainda não tem produtos à venda.</p>
                    )}
                </TabsContent>
                <TabsContent value="services">
                    {services.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {services.map(service => (
                            <ProductCard key={service.id} product={service} lojistasMap={lojistasMap} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">Este vendedor não oferece serviços de momento.</p>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
