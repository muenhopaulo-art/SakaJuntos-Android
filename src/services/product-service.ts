'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, addDoc, getDoc, setDoc, deleteDoc, runTransaction, query, where } from 'firebase/firestore';
import { products as mockProducts, groupPromotions as mockGroupPromotions } from '@/lib/mock-data';
import type { Product, GroupPromotion, GroupMember, JoinRequest } from '@/lib/types';
import { getUser } from './user-service';

// Helper function to convert Firestore data to a plain object
const convertDocToProduct = (doc: any): Product => {
  const data = doc.data();
  const product: Product = {
    id: doc.id,
    name: data.name,
    description: data.description,
    price: data.price,
    image: data.image,
    aiHint: data.aiHint,
  };

  // Convert Timestamp to string if it exists
  if (data.createdAt && data.createdAt instanceof Timestamp) {
    // You can also use .toDate().toISOString() or just send seconds
    product.createdAt = data.createdAt.toMillis();
  }

  return product;
}

async function getSubCollection<T extends {uid: string}>(groupId: string, subCollectionName: string): Promise<T[]> {
    const subCollectionRef = collection(db, 'groupPromotions', groupId, subCollectionName);
    const snapshot = await getDocs(subCollectionRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            uid: doc.id,
            // Convert Timestamps
            ...(data.joinedAt && { joinedAt: (data.joinedAt as Timestamp).toMillis() }),
            ...(data.requestedAt && { requestedAt: (data.requestedAt as Timestamp).toMillis() }),
        } as T;
    });
}


const convertDocToGroupPromotion = async (doc: any): Promise<GroupPromotion> => {
    const data = doc.data();

    // Fetch subcollections
    const members = await getSubCollection<GroupMember>(doc.id, 'members');
    const joinRequests = await getSubCollection<JoinRequest>(doc.id, 'joinRequests');


    const promotion: GroupPromotion = {
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        aiHint: data.aiHint,
        participants: data.participants,
        target: data.target,
        creatorId: data.creatorId,
        members,
        joinRequests,
    };

    if (data.createdAt && data.createdAt instanceof Timestamp) {
        promotion.createdAt = data.createdAt.toMillis();
    }

    return promotion;
}

export async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  const productList = productSnapshot.docs.map(convertDocToProduct);
  return productList;
}

export async function getGroupPromotions(): Promise<GroupPromotion[]> {
    const promotionsCol = collection(db, 'groupPromotions');
    const promotionSnapshot = await getDocs(promotionsCol);
    // Use Promise.all to handle asynchronous conversion
    const promotionList = await Promise.all(promotionSnapshot.docs.map(convertDocToGroupPromotion));
    return promotionList;
}

export async function createGroupPromotion(
    groupData: Omit<GroupPromotion, 'id' | 'createdAt' | 'participants' | 'members' | 'joinRequests'> & { creatorName: string }
): Promise<{ success: boolean; id?: string; message?: string }> {
    try {
        const { creatorName, ...restOfGroupData } = groupData;
        const promotionsCol = collection(db, 'groupPromotions');
        const docRef = await addDoc(promotionsCol, {
            ...restOfGroupData,
            participants: 1, // The creator is the first participant
            createdAt: new Date(),
        });

        // Add the creator as the first member in the 'members' subcollection
        const memberRef = doc(db, 'groupPromotions', docRef.id, 'members', groupData.creatorId);
        await setDoc(memberRef, {
            name: creatorName,
            joinedAt: new Date(),
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating group promotion:", error);
        const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { success: false, message };
    }
}

export async function requestToJoinGroup(groupId: string, userId: string) {
    try {
        const user = await getUser(userId);
        const requestRef = doc(db, 'groupPromotions', groupId, 'joinRequests', userId);
        await setDoc(requestRef, {
            name: user.name,
            requestedAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error requesting to join group:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function approveJoinRequest(groupId: string, userId: string) {
     try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const requestRef = doc(db, 'groupPromotions', groupId, 'joinRequests', userId);
            const memberRef = doc(db, 'groupPromotions', groupId, 'members', userId);

            const requestSnap = await transaction.get(requestRef);
            if (!requestSnap.exists()) {
                throw new Error("Join request does not exist.");
            }

            const groupSnap = await transaction.get(groupRef);
             if (!groupSnap.exists()) {
                throw new Error("Group does not exist.");
            }

            // Add to members
            transaction.set(memberRef, {
                name: requestSnap.data().name,
                joinedAt: new Date(),
            });

            // Remove from joinRequests
            transaction.delete(requestRef);

            // Increment participant count
            const newParticipantCount = (groupSnap.data().participants || 0) + 1;
            transaction.update(groupRef, { participants: newParticipantCount });

        });
        return { success: true };
    } catch (error) {
        console.error("Error approving join request:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function removeMember(groupId: string, userId: string, isCreator: boolean) {
    if (isCreator) {
        return { success: false, message: "Cannot remove the creator of the group." };
    }
    try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const memberRef = doc(db, 'groupPromotions', groupId, 'members', userId);

            const memberSnap = await transaction.get(memberRef);
             if (!memberSnap.exists()) {
                // To be safe, let's still decrement the count if the user is not in the subcollection for some reason
                console.warn("Attempted to remove a member that doesn't exist in subcollection, but proceeding to decrement count.");
            } else {
                 transaction.delete(memberRef);
            }

            const groupSnap = await transaction.get(groupRef);
             if (!groupSnap.exists()) {
                throw new Error("Group does not exist.");
            }
           
            const newParticipantCount = Math.max(0, (groupSnap.data().participants || 0) - 1);
            transaction.update(groupRef, { participants: newParticipantCount });
        });
        return { success: true };

    } catch (error) {
        console.error("Error removing member:", error);
        return { success: false, message: (error as Error).message };
    }
}

async function deleteSubcollection(d: typeof db, collectionPath: string) {
    const q = query(collection(d, collectionPath));
    const snapshot = await getDocs(q);
    const batch = writeBatch(d);
    snapshot.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}


export async function deleteGroup(groupId: string) {
    try {
        const groupRef = doc(db, 'groupPromotions', groupId);

        // Delete all subcollections first
        await deleteSubcollection(db, `groupPromotions/${groupId}/members`);
        await deleteSubcollection(db, `groupPromotions/${groupId}/joinRequests`);
        await deleteSubcollection(db, `groupPromotions/${groupId}/messages`);
        
        // Finally, delete the group document itself
        await deleteDoc(groupRef);

        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false, message: (error as Error).message };
    }
}


export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    // Seed products
    const productsCol = collection(db, 'products');
    mockProducts.forEach(product => {
      const { id, ...data } = product;
      const docRef = doc(productsCol, id);
      batch.set(docRef, { ...data, createdAt: new Date() });
    });

    // Seed group promotions
    const promotionsCol = collection(db, 'groupPromotions');
    mockGroupPromotions.forEach(promotion => {
        const { id, ...data } = promotion;
        const docRef = doc(promotionsCol, id);
        batch.set(docRef, { ...data, createdAt: new Date() });
    });

    await batch.commit();
    return { success: true, message: 'Base de dados populada com sucesso!' };
  } catch (error) {
    console.error("Error seeding database:", error);
    if (error instanceof Error) {
        return { success: false, message: `Ocorreu um erro: ${error.message}` };
    }
    return { success: false, message: 'Ocorreu um erro desconhecido.' };
  }
}
