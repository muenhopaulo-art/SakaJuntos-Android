
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { Loader2, ShoppingCart, Phone, CalendarClock, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/cart-context';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle } from '@/components/ui/alert';

const ProductSkeleton = () => (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="grid gap-4">
            <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-4">
                <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
                <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
                <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
                <div className="aspect-square w-full bg-muted rounded-lg animate-pulse" />
            </div>
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isScheduling, setIsScheduling] = useState(false);
    
    const { addItem } = useCart();
    const { toast } = useToast();

    useEffect(() => {
        if (typeof id === 'string') {
            const fetchProduct = async () => {
                setLoading(true);
                setError(null);
                try {
                    const productRef = doc(db, 'products', id);
                    const productSnap = await getDoc(productRef);
                    if (productSnap.exists()) {
                        setProduct({ id: productSnap.id, ...productSnap.data() } as Product);
                        setSelectedImage(0);
                    } else {
                        setError('Produto ou serviço não encontrado.');
                    }
                } catch (e) {
                    console.error("Error fetching product:", e);
                    setError('Ocorreu um erro ao buscar os detalhes.');
                }
                setLoading(false);
            };
            fetchProduct();
        }
    }, [id]);

    const handleAddToCart = () => {
        if (product) {
            addItem(product);
        }
    };
    
    const handleCall = () => {
        if (product?.contactPhone) {
            window.location.href = `tel:${product.contactPhone}`;
        } else {
            toast({ variant: 'destructive', title: 'Contacto indisponível.'});
        }
    };

    const handleSchedule = () => {
        // Here you would typically handle the scheduling logic, e.g., send a notification to the seller.
        // For now, we'll just simulate it.
        setIsScheduling(true);
        setTimeout(() => {
            toast({ title: 'Pedido de Agendamento Enviado!', description: 'O prestador de serviço entrará em contacto consigo em breve.' });
            setIsScheduling(false);
        }, 1500);
    };

    if (loading) {
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                <div className="grid gap-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                        {hasImages ? (
                            <Image src={product.imageUrls[selectedImage]} alt={product.name} fill className="object-contain" />
                        ) : (
                            <Package className="h-32 w-32 text-muted-foreground"/>
                        )}
                    </div>
                    {hasImages && product.imageUrls.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {product.imageUrls.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={cn(
                                        "relative aspect-square w-full overflow-hidden rounded-lg bg-muted border-2",
                                        selectedImage === index ? 'border-primary' : 'border-transparent'
                                    )}
                                >
                                    <Image src={url} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                    <Card className="flex-grow">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold font-headline">{product.name}</CardTitle>
                             <CardDescription>
                                {product.category === 'produto' ? 'Produto' : 'Serviço'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-3xl font-bold">
                                {product.category === 'serviço' && product.price > 0 && 'A partir de '}
                                {product.price > 0 
                                    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)
                                    : 'Preço sob consulta'
                                }
                            </p>
                            <div className="text-muted-foreground space-y-2">
                                <h3 className="font-semibold text-foreground">Descrição</h3>
                                <p className="whitespace-pre-wrap">{product.description}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {product.category === 'produto' ? (
                                <Button size="lg" className="w-full" onClick={handleAddToCart}>
                                    <ShoppingCart className="mr-2" />
                                    Adicionar ao Carrinho
                                </Button>
                            ) : (
                                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <Button size="lg" variant="outline" onClick={handleCall} disabled={!product.contactPhone}>
                                        <Phone className="mr-2" />
                                        Ligar
                                    </Button>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="lg">
                                                <CalendarClock className="mr-2" />
                                                Agendar Serviço
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Agendar Serviço: {product.name}</DialogTitle>
                                                <DialogDescription>
                                                    Envie uma mensagem ao prestador com detalhes sobre o que precisa. Eles entrarão em contacto consigo para confirmar.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4">
                                                <Textarea placeholder="Ex: Preciso de uma reparação urgente no cano da cozinha. Qual a vossa disponibilidade?" />
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleSchedule} disabled={isScheduling}>
                                                    {isScheduling && <Loader2 className="mr-2 animate-spin"/>}
                                                    Enviar Pedido
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
