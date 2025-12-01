
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';
import { errorEmitter, FirestorePermissionError, type SecurityRuleContext } from './error-service';


interface UserProfileData {
    name: string;
    phone: string;
    province: string;
    role: UserRole;
    ownerLojistaId?: string;
    photoURL?: string;
}

export async function createUser(uid: string, data: UserProfileData) {
    const userRef = doc(db, 'users', uid);
    
    const userData = {
        ...data,
        email: `+244${data.phone}@sakajuntos.com`,
        createdAt: serverTimestamp(),
        ownerLojistaId: data.ownerLojistaId || null,
        online: false,
        photoURL: data.photoURL || null,
    };

    setDoc(userRef, userData)
      .then(() => {
        // Success
        return { success: true, uid };
      })
      .catch(async (serverError) => {
        console.error("Error creating user profile in Firestore:", serverError);

        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'create',
            requestResourceData: userData,
        } satisfies SecurityRuleContext);

        errorEmitter.emit('permission-error', permissionError);

        // Retornar uma falha para a UI, se necessário, embora o erro principal seja tratado pelo listener.
        // A lógica do lado do cliente provavelmente não receberá isto diretamente devido à natureza assíncrona
        // e o facto de ser uma Server Action. O importante é o evento ser emitido.
      });

    // Como a operação agora é "fire-and-forget" com tratamento de erro, retornamos sucesso imediato
    // para a chamada inicial, e o erro será tratado pelo listener de eventos global.
    return { success: true, uid };
}


export async function getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error(`User not found in Firestore for UID: ${uid}`);
        return null;
    }

    const data = userSnap.data();

    return {
        uid: userSnap.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        province: data.province,
        role: data.role || 'client',
        createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
        ownerLojistaId: data.ownerLojistaId,
        online: data.online || false,
        photoURL: data.photoURL,
    };
}

export async function queryUserByPhone(phone: string): Promise<{user?: User, error?: string}> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("phone", "==", phone), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { error: "Nenhum utilizador encontrado com este número de telefone." };
        }

        const userDoc = querySnapshot.docs[0];
        const userData = await getUser(userDoc.id);
        
        if (!userData) {
            return { error: "Não foi possível carregar os dados do utilizador." };
        }

        return { user: userData };

    } catch(error) {
        console.error("Error querying user by phone:", error);
        return { error: "Ocorreu um erro ao procurar o utilizador." };
    }
}

export async function setUserOnlineStatus(userId: string, online: boolean) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { online });
        return { success: true };
    } catch (error) {
        console.error(`Error setting user ${userId} online status to ${online}:`, error);
        return { success: false, message: 'Failed to update online status.' };
    }
}
