'use client';

import { ProductCard } from '@/components/product-card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import type { Product } from '@/lib/types';
import Autoplay from "embla-carousel-autoplay";

interface ProductsCarouselProps {
    products: Product[];
}

export function ProductsCarousel({ products }: ProductsCarouselProps) {
    return (
        <Carousel
            opts={{ align: "start", loop: true, watchDrag: false }}
            plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                }),
            ]}
            className="w-full"
            >
            <CarouselContent className="-ml-4">
                {products.map(product => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4 pl-4">
                    <div className="p-1 h-full">
                    <ProductCard product={product} />
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
    )
}
