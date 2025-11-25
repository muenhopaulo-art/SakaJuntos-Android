
import { getLojistaProfile } from '../actions';
import { notFound } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Phone, ShoppingBag, Briefcase, UserCircle, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

async function getProfile(id: string) {
    try {
        const profile = await getLojistaProfile(id);
        return profile;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
};

export default async function LojistaProfilePage({ params }: { params: { id: string } }) {
    const profile = await getProfile(params.id);

    if (!profile) {
        return (
             <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>Não foi possível carregar o perfil do vendedor.</AlertDescription>
                </Alert>
            </div>
        )
    }

    const { lojista, products } = profile;

    if (!lojista) {
        notFound();
    }

    const services = products.filter(p => p.productType === 'service');
    const normalProducts = products.filter(p => p.productType === 'product');

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Perfil Header */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary">
                            <AvatarFallback className="text-4xl">{getInitials(lojista.name)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl font-bold font-headline">{lojista.name}</h1>
                            <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>{lojista.province || 'Localização não definida'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4" />
                                    <span>Novo Vendedor</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2 justify-center md:justify-start">
                                <Button asChild>
                                    <a href={`tel:${lojista.phone}`}>
                                        <Phone className="mr-2 h-4 w-4" />
                                        Ligar
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Secção de Produtos */}
            <section>
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><ShoppingBag/> Produtos</h2>
                {normalProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {normalProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Este vendedor ainda não tem produtos à venda.</p>
                )}
            </section>

            <Separator />
            
            {/* Secção de Serviços */}
            <section>
                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Briefcase/> Serviços</h2>
                {services.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {services.map(service => (
                           <ProductCard key={service.id} product={service} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Este vendedor não oferece serviços de momento.</p>
                )}
            </section>
        </div>
    );
}
