import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 text-center bg-card rounded-lg shadow-md">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  SakaJuntos: O seu ponto de encontro para compras.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl mx-auto">
                  Descubra uma nova forma de comprar. Sozinho ou em grupo, encontre tudo o que precisa com a facilidade de um clique.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Link href="/grupos">Compras em Grupo</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/minishopping">Compras Individuais</Link>
                </Button>
              </div>
            </div>
            <Image
              src="https://picsum.photos/600/400"
              data-ai-hint="happy shoppers"
              width={600}
              height={400}
              alt="Hero"
              className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              priority
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            <Link href="/minishopping" className="group">
              <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-2">
                <CardHeader className="flex flex-row items-center gap-4">
                  <ShoppingBag className="w-10 h-10 text-primary" />
                  <div>
                    <CardTitle className="font-headline text-2xl">MiniShopping</CardTitle>
                    <CardDescription>
                      Explore uma variedade de produtos e compre individualmente com toda a conveniência.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Image
                    src="https://picsum.photos/550/310"
                    data-ai-hint="market stall"
                    alt="MiniShopping"
                    width={550}
                    height={310}
                    className="rounded-lg object-cover w-full aspect-video"
                  />
                </CardContent>
              </Card>
            </Link>
            <Link href="/grupos" className="group">
              <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-2">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Users className="w-10 h-10 text-accent-foreground" />
                  <div>
                    <CardTitle className="font-headline text-2xl">Grupos</CardTitle>
                    <CardDescription>
                      Junte-se a outros e aproveite promoções exclusivas em compras coletivas.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Image
                    src="https://picsum.photos/550/311"
                    data-ai-hint="community people"
                    alt="Grupos"
                    width={550}
                    height={311}
                    className="rounded-lg object-cover w-full aspect-video"
                  />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
