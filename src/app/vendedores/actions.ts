
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import type { User, Product } from '@/lib/types';
import { getUser } from '@/services/user-service';

export async function getLojistas(searchTerm?: string): Promise<User[]> {
    try {
        const usersCol = collection(db, 'users');
        // A consulta foi simplificada para filtrar apenas por 'role'. A ordenação será feita no lado do servidor.
        let q = query(usersCol, where('role', '==', 'lojista'));

        const lojistaSnapshot = await getDocs(q);
        
        let lojistaList = lojistaSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                province: data.province,
                role: data.role,
                createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            } as User;
        });
        
        // Ordenar os resultados aqui no servidor em vez de na consulta
        lojistaList.sort((a, b) => a.name.localeCompare(b.name));

        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            lojistaList = lojistaList.filter(l => l.name.toLowerCase().includes(lowercasedTerm));
        }

        return lojistaList;

    } catch (error) {
        console.error("Error fetching lojistas:", error);
        throw new Error("Não foi possível carregar os vendedores.");
    }
}

export async function getLojistaProfile(id: string): Promise<{ lojista: User | null; products: Product[] }> {
    try {
        const lojista = await getUser(id);
        if (!lojista || lojista.role !== 'lojista') {
            throw new Error('Vendedor não encontrado.');
        }

        const productsCol = collection(db, 'products');
        const q = query(productsCol, where('lojistaId', '==', id), orderBy('createdAt', 'desc'));
        const productsSnapshot = await getDocs(q);
        
        const products = productsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.name,
                description: data.description,
                price: data.price,
                category: data.category,
                productType: data.productType || 'product',
                stock: data.stock,
                isPromoted: data.isPromoted,
                imageUrls: data.imageUrls,
                lojistaId: data.lojistaId,
                createdAt: (data.createdAt as Timestamp)?.toMillis(),
            } as Product;
        });

        return { lojista, products };
    } catch (error) {
        console.error("Error fetching lojista profile:", error);
        throw new Error("Não foi possível carregar o perfil do vendedor.");
    }
}
