

'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, addDoc, getDoc, setDoc, deleteDoc, runTransaction, query, where, DocumentData, serverTimestamp, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { products as mockProducts, groupPromotions as mockGroupPromotions } from '@/lib/mock-data';
import type { Product, GroupPromotion, GroupMember, JoinRequest, CartItem, Contribution, Geolocation, User } from '@/lib/types';
import { getUser, queryUserByPhone as queryUserByPhoneFromUserService } from './user-service';
import { createFinalOrder, cleanupGroup } from './order-service';


// Helper function to convert Firestore data to a plain object
const convertDocToProduct = (doc: DocumentSnapshot): Product => {
  const data = doc.data() as DocumentData;
  const product: Product = {
    id: doc.id,
    name: data.name,
    description: data.description,
    price: data.price,
    aiHint: data.aiHint,
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    product.createdAt = data.createdAt.toMillis();
  }

  return product;
}

export async function queryUserByPhone(phone: string): Promise<{user?: User, error?: string}> {
    return queryUserByPhoneFromUserService(phone);
}

async function getSubCollection<T extends {uid?: string, id?: string}>(groupId: string, subCollectionName: string): Promise<T[]> {
    const subCollectionRef = collection(db, 'groupPromotions', groupId, subCollectionName);
    const snapshot = await getDocs(subCollectionRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Create a plain object
        const plainData: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value instanceof Timestamp) {
                    plainData[key] = value.toMillis();
                } else {
                    plainData[key] = value;
                }
            }
        }
        plainData.id = doc.id;
        plainData.uid = doc.id;
        return plainData as T;
    });
}


export async function convertDocToGroupPromotion(id: string, data: DocumentData): Promise<GroupPromotion> {
    if (!data) {
        throw new Error("Document data not found for ID: " + id);
    }

    const [members, joinRequests, groupCart, contributions] = await Promise.all([
        getSubCollection<GroupMember>(id, 'members'),
        getSubCollection<JoinRequest>(id, 'joinRequests'),
        getSubCollection<CartItem>(id, 'groupCart'),
        getSubCollection<Contribution>(id, 'contributions')
    ]);

    const promotion: GroupPromotion = {
        id: id,
        name: data.name,
        description: data.description,
        price: data.price,
        aiHint: data.aiHint,
        participants: data.participants,
        target: data.target,
        creatorId: data.creatorId,
        members,
        joinRequests,
        groupCart,
        contributions
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
    const promotionList = await Promise.all(promotionSnapshot.docs.map(doc => convertDocToGroupPromotion(doc.id, doc.data())));
    return promotionList;
}

interface CreateGroupData {
    name: string;
    target: number;
    creatorId: string;
    creatorName: string;
    description: string;
    price: number;
    aiHint: string;
}


export async function createGroupPromotion(
    groupData: CreateGroupData
): Promise<{ success: boolean; id?: string; message?: string }> {
    try {
        const { creatorName, ...restOfGroupData } = groupData;
        const promotionsCol = collection(db, 'groupPromotions');
        const docRef = await addDoc(promotionsCol, {
            ...restOfGroupData,
            participants: 1, 
            createdAt: serverTimestamp(),
        });

        const memberRef = doc(db, 'groupPromotions', docRef.id, 'members', groupData.creatorId);
        await setDoc(memberRef, { name: creatorName, joinedAt: serverTimestamp() });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating group promotion:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function requestToJoinGroup(groupId: string, userId: string) {
    try {
        const user = await getUser(userId);
        if (!user || !user.name) {
             throw new Error("User profile not found or name is missing.");
        }
        const requestRef = doc(db, 'groupPromotions', groupId, 'joinRequests', userId);
        await setDoc(requestRef, { name: user.name, requestedAt: serverTimestamp() });
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
                // This might happen if the request was cancelled or handled in another session.
                // We don't need to throw an error, we can just log it and return.
                console.warn(`Join request for user ${userId} in group ${groupId} not found. It might have been handled already.`);
                return;
            }

            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) throw new Error("Group does not exist.");

            transaction.set(memberRef, { name: requestSnap.data().name, joinedAt: serverTimestamp() });
            transaction.delete(requestRef);

            const newParticipantCount = (groupSnap.data().participants || 0) + 1;
            transaction.update(groupRef, { participants: newParticipantCount });
        });
        return { success: true };
    } catch (error) {
        console.error("Error approving join request:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function addMember(groupId: string, userId: string, userName: string) {
     try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const memberRef = doc(db, 'groupPromotions', groupId, 'members', userId);
            
            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) throw new Error("O grupo não existe.");

            const memberSnap = await transaction.get(memberRef);
            if (memberSnap.exists()) throw new Error("Este utilizador já é membro do grupo.");

            const groupData = groupSnap.data();
            if (groupData.participants >= groupData.target) {
                throw new Error("O grupo já atingiu o número máximo de membros.");
            }

            transaction.set(memberRef, { name: userName, joinedAt: serverTimestamp() });
            transaction.update(groupRef, { participants: groupData.participants + 1 });
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding member:", error);
        return { success: false, message: (error as Error).message };
    }
}


export async function removeMember(groupId: string, userId: string, isCreator: boolean) {
    if (isCreator) return { success: false, message: "Cannot remove the creator of the group." };
    try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const memberRef = doc(db, 'groupPromotions', groupId, 'members', userId);
            
            // Check if member exists before trying to delete
            const memberSnap = await transaction.get(memberRef);
            if (!memberSnap.exists()) {
                // If member doesn't exist in members, maybe they are in joinRequests
                const requestRef = doc(db, 'groupPromotions', groupId, 'joinRequests', userId);
                const requestSnap = await transaction.get(requestRef);
                if (requestSnap.exists()) {
                    transaction.delete(requestRef);
                }
                // If neither exist, just return, no need to throw error.
                return;
            }
            
            transaction.delete(memberRef);

            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) throw new Error("Group does not exist.");
            const currentParticipants = groupSnap.data().participants || 0;
            const newParticipantCount = Math.max(0, currentParticipants - 1);
            transaction.update(groupRef, { participants: newParticipantCount });
        });
        return { success: true };
    } catch (error) {
        console.error("Error removing member:", error);
        return { success: false, message: (error as Error).message };
    }
}

async function deleteSubcollection(collectionPath: string) {
    const q = query(collection(db, collectionPath));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}

export async function deleteGroup(groupId: string) {
    try {
        const groupRef = doc(db, 'groupPromotions', groupId);
        await deleteSubcollection(`groupPromotions/${groupId}/members`);
        await deleteSubcollection(`groupPromotions/${groupId}/joinRequests`);
        await deleteSubcollection(`groupPromotions/${groupId}/messages`);
        await deleteSubcollection(`groupPromotions/${groupId}/groupCart`);
        await deleteSubcollection(`groupPromotions/${groupId}/contributions`);
        await deleteDoc(groupRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting group:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function updateGroupCart(groupId: string, product: Product, change: 'add' | 'remove' | 'update', newQuantity?: number) {
    const cartItemRef = doc(db, 'groupPromotions', groupId, 'groupCart', product.id);
    try {
        await runTransaction(db, async (transaction) => {
            const itemSnap = await transaction.get(cartItemRef);
            if (change === 'add') {
                if (itemSnap.exists()) {
                    const currentQuantity = itemSnap.data().quantity || 0;
                    transaction.update(cartItemRef, { quantity: currentQuantity + 1 });
                } else {
                    transaction.set(cartItemRef, { product, quantity: 1 });
                }
            } else if (change === 'remove') {
                transaction.delete(cartItemRef);
            } else if (change === 'update' && newQuantity !== undefined) {
                if (newQuantity > 0) {
                    transaction.update(cartItemRef, { quantity: newQuantity });
                } else {
                    transaction.delete(cartItemRef);
                }
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error updating group cart:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function contributeToGroup(groupId: string, userId: string, location: Geolocation) {
    try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) throw new Error("Group does not exist.");
            const groupData = groupSnap.data();

            const cartColRef = collection(db, 'groupPromotions', groupId, 'groupCart');
            const cartSnapshot = await getDocs(query(cartColRef));
            const groupCart: CartItem[] = cartSnapshot.docs.map(d => d.data() as CartItem);
            
            if (groupCart.length === 0) throw new Error("Cannot contribute to an empty cart.");

            const membersColRef = collection(db, 'groupPromotions', groupId, 'members');
            const membersSnapshot = await getDocs(query(membersColRef));
            const totalMembers = membersSnapshot.size;

            if (totalMembers === 0) throw new Error("Group has no members to divide contribution.");

            const groupCartTotal = groupCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
            const contributionAmount = groupCartTotal / totalMembers;

            const user = await getUser(userId);
             if (!user || !user.name) {
                throw new Error("User profile not found or name is missing.");
            }
            const contributionRef = doc(db, 'groupPromotions', groupId, 'contributions', userId);
            transaction.set(contributionRef, {
                userId,
                userName: user.name,
                amount: contributionAmount,
                location,
                createdAt: serverTimestamp(),
            });
        });

        // Post-transaction: check if the order is complete
        const finalizationResult = await checkAndFinalizeOrder(groupId);

        return { success: true, orderFinalized: finalizationResult.orderCreated };

    } catch (error) {
        console.error("Error making contribution:", error);
        return { success: false, message: (error as Error).message };
    }
}

async function checkAndFinalizeOrder(groupId: string) {
    const groupRef = doc(db, 'groupPromotions', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found for finalization check.");
    
    const contributions = await getSubCollection<Contribution>(groupId, 'contributions');
    const members = await getSubCollection<GroupMember>(groupId, 'members');

    if (members.length > 0 && contributions.length === members.length) {
        const cart = await getSubCollection<CartItem>(groupId, 'groupCart');
        const totalAmount = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
        
        if (cart.length === 0) {
             console.log("Finalization check: Cart is empty, skipping order creation.");
             return { success: true, orderCreated: false };
        }

        const orderResult = await createFinalOrder({
            groupId: groupId,
            groupName: groupSnap.data().name,
            items: cart,
            totalAmount: totalAmount,
        }, contributions);

        if (orderResult.success) {
            await cleanupGroup(groupId);
            return { success: true, orderCreated: true };
        } else {
            // Handle failure to create order
            console.error("Failed to create final order:", orderResult.message);
            return { success: false, orderCreated: false, message: orderResult.message };
        }
    }
    return { success: true, orderCreated: false };
}

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    const productsCol = collection(db, 'products');
    mockProducts.forEach(product => {
      const { id, ...data } = product;
      const docRef = doc(productsCol, id);
      batch.set(docRef, { ...data, createdAt: serverTimestamp() });
    });

    const promotionsCol = collection(db, 'groupPromotions');
    mockGroupPromotions.forEach(promotion => {
        const { id, ...data } = promotion;
        const docRef = doc(promotionsCol, id);
        batch.set(docRef, { ...data, createdAt: serverTimestamp() });
    });

    await batch.commit();
    return { success: true, message: 'Base de dados populada com sucesso!' };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, message: `Ocorreu um erro: ${(error as Error).message}` };
  }
}
