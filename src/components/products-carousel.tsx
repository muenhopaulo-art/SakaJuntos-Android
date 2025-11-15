'use client';

import { ProductCard } from '@/components/product-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Product } from '@/lib/types';

interface ProductsCarouselProps {
    products: Product[];
}

export function ProductsCarousel({ products }: ProductsCarouselProps) {
    return (
        <Carousel
            opts={{ align: "start", loop: true, watchDrag: true }}
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
            <CarouselPrevious className="flex" />
            <CarouselNext className="flex" />
        </Carousel>
    )
}
