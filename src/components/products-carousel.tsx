
'use client';

import * as React from 'react';
import { ProductCard } from '@/components/product-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Product } from '@/lib/types';
import Autoplay from 'embla-carousel-autoplay';

interface ProductsCarouselProps {
    products: Product[];
}

export function ProductsCarousel({ products }: ProductsCarouselProps) {
    const plugin = React.useRef(
        Autoplay({ delay: 2000, stopOnInteraction: false })
    );
    
    return (
        <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[plugin.current]}
            className="w-full"
            >
            <CarouselContent className="-ml-4">
                {products.map(product => (
                <CarouselItem key={product.id} className="basis-1/2 md:basis-1/3 lg:basis-1/4 pl-4">
                    <div className="p-1 h-full">
                    <ProductCard product={product} />
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex opacity-50 hover:opacity-100" />
            <CarouselNext className="hidden md:flex opacity-50 hover:opacity-100" />
        </Carousel>
    )
}
