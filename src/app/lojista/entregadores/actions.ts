
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import type { User } from '@/lib/types';

const convertDocToUser = (doc: any): User => {
    const data = doc.data();
    return {
        uid: doc.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
        online: data.online || false,
    };
};

export async function getLojistaCouriers(lojistaId: string): Promise<User[]> {
    try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('role', '==', 'courier'), where('ownerLojistaId', '==', lojistaId));
        const courierSnapshot = await getDocs(q);
        return courierSnapshot.docs.map(convertDocToUser);
    } catch (error) {
        console.error("Error fetching lojista couriers:", error);
        throw new Error("Failed to fetch couriers.");
    }
}
