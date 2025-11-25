
import { getLojistas } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search, User } from 'lucide-react';
import type { User as Lojista } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

function getErrorMessage(error: any): string {
    return error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
};

export default async function VendedoresPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const searchTerm = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  let lojistas: Lojista[] = [];
  let error: string | null = null;

  try {
    lojistas = await getLojistas(searchTerm);
  } catch (e) {
    error = getErrorMessage(e);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-2 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Nossos Vendedores</h1>
        <p className="text-xl text-muted-foreground">
          Explore as lojas e descubra os produtos dos nossos parceiros.
        </p>
      </div>

      <form className="relative w-full max-w-lg mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input type="search" name="q" placeholder="Pesquisar por vendedor..." className="pl-10 h-12 text-base" defaultValue={searchTerm} />
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Vendedores</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : lojistas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {lojistas.map((lojista) => (
            <Link key={lojista.uid} href={`/vendedores/${lojista.uid}`}>
              <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="text-2xl">{getInitials(lojista.name)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{lojista.name}</p>
                  <p className="text-sm text-muted-foreground">{lojista.province}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 font-semibold">Nenhum vendedor encontrado.</p>
          <p className="text-muted-foreground">Não há vendedores registados ou a sua pesquisa não retornou resultados.</p>
        </div>
      )}
    </div>
  );
}
