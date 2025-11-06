
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getUser } from './user-service';

interface ServiceRequestData {
    clientId: string;
    serviceId: string;
    lojistaId: string;
    requestedDate: Date;
    requestedPeriod: 'manha' | 'tarde';
    address: string;
    notes?: string;
}

export async function createServiceRequest(data: ServiceRequestData) {
    try {
        const user = await getUser(data.clientId);
        if (!user) {
            throw new Error("Utilizador não encontrado.");
        }

        const serviceRequestsCol = collection(db, 'serviceRequests');
        
        await addDoc(serviceRequestsCol, {
            serviceId: data.serviceId,
            clientId: data.clientId,
            clientName: user.name,
            clientPhone: user.phone,
            lojistaId: data.lojistaId,
            requestedDate: Timestamp.fromDate(data.requestedDate),
            requestedPeriod: data.requestedPeriod,
            address: data.address,
            notes: data.notes || '',
            status: 'pendente',
            createdAt: serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating service request:", error);
        return { success: false, message: (error as Error).message };
    }
}
