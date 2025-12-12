

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Product, User } from '@/lib/types';
import { Loader2, ShoppingCart, Phone, Package, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/cart-context';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Timestamp } from 'firebase/firestore';
import { ScheduleServiceDialog } from '@/components/schedule-service-dialog';
import { getUser } from '@/services/user-service';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getProducts } from '@/services/product-service';

const ProductSkeleton = () => (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="grid gap-4">
            <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-6">
            <div className="h-10 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-8 w-1/4 bg-muted rounded animate-pulse" />
            <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-12 w-full bg-muted rounded-lg animate-pulse" />
        </div>
    </div>
);

export default function ProductDetailPage() {
    const params = useParams();
    const { id } = params;
    const [product, setProduct] = useState<Product | null>(null);
    const [lojista, setLojista] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const { addItem } = useCart();
    const [user, authLoading] = useAuthState(auth);

    useEffect(() => {
        if (typeof id !== 'string') return;
        
        const fetchProductAndLojista = async () => {
            setLoading(true);
            setError(null);
            try {
                const productRef = doc(db, 'products', id);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                    const data = productSnap.data();
                    const productData: Product = {
                        id: productSnap.id,
                        name: data.name,
                        description: data.description,
                        price: data.price,
                        category: data.category,
                        productType: data.productType || 'product',
                        stock: data.stock,
                        isPromoted: data.isPromoted,
                        imageUrls: data.imageUrls,
                        createdAt: (data.createdAt as Timestamp)?.toMillis(),
                        lojistaId: data.lojistaId,
                    };
                    setProduct(productData);

                    if (productData.lojistaId) {
                        const lojistaData = await getUser(productData.lojistaId);
                        setLojista(lojistaData);
                    }

                } else {
                    setError('Produto não encontrado.');
                }
            } catch (e) {
                console.error("Error fetching product:", e);
                setError('Ocorreu um erro ao buscar os detalhes.');
            }
            setLoading(false);
        };
        fetchProductAndLojista();
    }, [id]);

    const isOwner = !!(user && product?.lojistaId === user.uid);

    const handleAddToCart = () => {
        if (product && !isOwner) {
            addItem(product, 1, user?.uid);
        }
    };
    
    if (loading || authLoading) {
        return <div className="container mx-auto px-4 py-8"><ProductSkeleton /></div>;
    }

    if (error) {
        return (
             <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            </div>
        );
    }
    
    if (!product) {
        return null;
    }

    const hasImages = product.imageUrls && product.imageUrls.length > 0;
    const isService = product.productType === 'service';

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="grid gap-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        {hasImages ? (
                            <Carousel
                                opts={{ align: "start", loop: true, watchDrag: true }}
                                className="w-full h-full"
                            >
                                <CarouselContent>
                                    {product.imageUrls!.map((url, index) => (
                                        <CarouselItem key={index}>
                                            <div className="relative w-full h-full aspect-square">
                                                <Image src={url} alt={`${product.name} - Imagem ${index + 1}`} fill className="object-contain" />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
                                <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
                            </Carousel>
                        ) : (
                            <Package className="h-32 w-32 text-muted-foreground"/>
                        )}
                         {isOwner && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">Seu Produto</div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col">
                    <Card className={cn("flex-grow flex flex-col", isOwner && "bg-muted/30")}>
                        <CardHeader>
                            <p className='text-sm text-muted-foreground capitalize'>{product.category}</p>
                            <CardTitle className="text-3xl font-bold font-headline">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 flex-grow">
                            <p className="text-3xl font-bold">
                                {product.price > 0 
                                    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)
                                    : 'Preço sob consulta'
                                }
                            </p>
                            <div className="text-muted-foreground space-y-2">
                                <h3 className="font-semibold text-foreground">Descrição</h3>
                                <p className="whitespace-pre-wrap">{product.description}</p>
                            </div>
                             {!isService && (
                                <div className="text-sm text-muted-foreground">
                                    Stock: {product.stock > 0 ? `${product.stock} unidades` : 'Indisponível'}
                                </div>
                             )}
                              {lojista && (
                                <div className="text-sm text-muted-foreground">
                                    Vendido por: <span className="font-medium text-foreground">{lojista.name}</span>
                                </div>
                             )}
                        </CardContent>
                        <CardFooter className="mt-auto">
                            {isService ? (
                                <div className="w-full flex flex-col sm:flex-row gap-2">
                                     <Button size="lg" className="w-full" asChild disabled={isOwner}>
                                        <a href={`tel:${lojista?.phone}`}>
                                            <Phone className="mr-2" />
                                            Ligar
                                        </a>
                                    </Button>
                                    <ScheduleServiceDialog product={product}>
                                        <Button size="lg" className="w-full" variant="outline" disabled={isOwner}>
                                            <Calendar className="mr-2" />
                                            Agendar
                                        </Button>
                                    </ScheduleServiceDialog>
                                </div>
                            ) : (
                                <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={product.stock === 0 || isOwner}>
                                    <ShoppingCart className="mr-2" />
                                    {isOwner ? 'Este é seu produto' : product.stock === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
