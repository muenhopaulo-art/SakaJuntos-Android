

'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, doc, collectionGroup } from 'firebase/firestore';
import type { User, Product } from '@/lib/types';
import { getUser } from '@/services/user-service';

export async function getLojistas(searchTerm?: string): Promise<User[]> {
    try {
        // Step 1: Get all products to find unique seller IDs
        const productsCol = collection(db, 'products');
        const productsSnapshot = await getDocs(productsCol);
        
        const lojistaIds = new Set<string>();
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.lojistaId) {
                lojistaIds.add(data.lojistaId);
            }
        });

        if (lojistaIds.size === 0) {
            return [];
        }

        // Step 2: Fetch user profiles for these unique IDs
        const lojistaPromises = Array.from(lojistaIds).map(id => getUser(id));
        let lojistaList = (await Promise.all(lojistaPromises)).filter(user => user !== null) as User[];
        
        // Sort the results alphabetically by name
        lojistaList.sort((a, b) => a.name.localeCompare(b.name));

        // Step 3: If there's a search term, filter the results
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
        if (!lojista) { // We no longer check for role, just if the user exists
            throw new Error('Vendedor não encontrado.');
        }

        const productsCol = collection(db, 'products');
        // A consulta é simplificada para apenas filtrar; a ordenação é feita depois.
        const q = query(productsCol, where('lojistaId', '==', id));
        const productsSnapshot = await getDocs(q);
        
        let products = productsSnapshot.docs.map(doc => {
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
        
        // Ordena os produtos pela data de criação (mais recentes primeiro) no servidor.
        products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        return { lojista, products };
    } catch (error) {
        console.error("Error fetching lojista profile:", error);
        throw new Error("Não foi possível carregar o perfil do vendedor.");
    }
}
