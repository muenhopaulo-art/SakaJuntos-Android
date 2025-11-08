
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getUser } from './user-service';
import { createNotification } from './notification-service';

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
        
        const docRef = await addDoc(serviceRequestsCol, {
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
        
        // Notify the lojista
        await createNotification({
            userId: data.lojistaId,
            title: "Novo Pedido de Serviço",
            message: `Recebeu um novo pedido de agendamento de ${user.name}.`,
            link: '/lojista/agendamentos'
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating service request:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateServiceRequestStatus(requestId: string, newStatus: 'confirmado' | 'concluído' | 'cancelado') {
     try {
        const requestRef = doc(db, 'serviceRequests', requestId);
        await updateDoc(requestRef, { status: newStatus });
        
        const requestSnap = await getDoc(requestRef);
        const requestData = requestSnap.data();

        if (requestData) {
             await createNotification({
                userId: requestData.clientId,
                title: "Agendamento Atualizado",
                message: `O seu pedido de serviço foi atualizado para: ${newStatus}`,
                link: '/my-orders'
            });
        }

        return { success: true };
    } catch (error) {
        console.error("Error updating service request status:", error);
        return { success: false, message: (error as Error).message };
    }
}
