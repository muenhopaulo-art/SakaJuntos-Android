'use client';

import { useState, useMemo } from 'react';
import { getLojistas } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Search, User, MapPin } from 'lucide-react';
import type { User as Lojista } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from 'use-debounce';

function getErrorMessage(error: any): string {
    return error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
};

const provinces = [
    "Todas as Províncias", "Bengo", "Benguela", "Bié", "Cabinda", "Quando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

// We create a new client component to contain the logic
function VendedorList({ allLojistas }: { allLojistas: Lojista[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedProvince, setSelectedProvince] = useState(searchParams.get('province') || 'Todas as Províncias');
    const [debouncedSearch] = useDebounce(searchTerm, 300);

    const filteredLojistas = useMemo(() => {
        return allLojistas.filter(lojista => {
            const matchesSearch = debouncedSearch
                ? lojista.name.toLowerCase().includes(debouncedSearch.toLowerCase())
                : true;
            const matchesProvince = selectedProvince !== 'Todas as Províncias'
                ? lojista.province === selectedProvince
                : true;
            return matchesSearch && matchesProvince;
        });
    }, [allLojistas, debouncedSearch, selectedProvince]);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleProvinceChange = (province: string) => {
        setSelectedProvince(province);
        const params = new URLSearchParams(searchParams.toString());
        if (province === 'Todas as Províncias') {
            params.delete('province');
        } else {
            params.set('province', province);
        }
        router.replace(`${pathname}?${params.toString()}`);
    };

     return (
        <>
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-lg mx-auto mb-8">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        name="q"
                        placeholder="Pesquisar por vendedor..."
                        className="pl-10 h-12 text-base"
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                     <Select value={selectedProvince} onValueChange={handleProvinceChange}>
                        <SelectTrigger className="w-full h-12 text-base pl-10">
                            <SelectValue placeholder="Filtrar por província" />
                        </SelectTrigger>
                        <SelectContent>
                            {provinces.map(province => (
                                <SelectItem key={province} value={province}>{province}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {filteredLojistas.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredLojistas.map((lojista) => (
                        <Link key={lojista.uid} href={`/vendedores/${lojista.uid}`}>
                            <Card className="h-full hover:shadow-md transition-shadow">
                                <CardContent className="p-6 flex flex-col items-center text-center">
                                    <Avatar className="h-20 w-20 mb-4">
                                        <AvatarImage src={lojista.photoURL} alt={lojista.name} />
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
                    <p className="text-muted-foreground">Tente ajustar a sua pesquisa ou o filtro de província.</p>
                </div>
            )}
        </>
    );
}


export default async function VendedoresPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  let lojistas: Lojista[] = [];
  let error: string | null = null;

  try {
    // We fetch all lojistas here, filtering will be done on the client
    lojistas = await getLojistas();
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

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Vendedores</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
         <VendedorList allLojistas={lojistas} />
      )}
    </div>
  );
}
