

'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, addDoc, getDoc, setDoc, deleteDoc, runTransaction, query, where, DocumentData, serverTimestamp, onSnapshot, DocumentSnapshot, Unsubscribe, orderBy, limit, startAt, endAt } from 'firebase/firestore';
import { products as mockProducts, groupPromotions as mockGroupPromotions } from '@/lib/mock-data';
import type { Product, GroupPromotion, GroupMember, JoinRequest, CartItem, Contribution, Geolocation, User } from '@/lib/types';
import { getUser, queryUserByPhone as queryUserByPhoneFromUserService } from './user-service';

const SHIPPING_COST_PER_MEMBER = 1000;

// Helper function to convert Firestore data to a plain object
const convertDocToProduct = (doc: DocumentSnapshot): Product => {
  const data = doc.data() as DocumentData;
  const product: Product = {
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
    promotionTier: data.promotionTier,
    promotionPaymentId: data.promotionPaymentId,
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
        status: data.status || 'active',
        description: data.description,
        price: data.price,
        imageUrls: data.imageUrls,
        participants: data.participants,
        target: data.target,
        creatorId: data.creatorId,
        members,
        joinRequests,
        groupCart,
        contributions,
        category: data.category,
        productType: data.productType || 'product',
        stock: data.stock,
        isPromoted: data.isPromoted,
    };

    if (data.createdAt && data.createdAt instanceof Timestamp) {
        promotion.createdAt = data.createdAt.toMillis();
    }

    return promotion;
}

export async function getProducts(searchTerm?: string): Promise<Product[]> {
  const productsCollection = collection(db, 'products');
  const q = query(productsCollection, orderBy("createdAt", "desc"));
  const productSnapshot = await getDocs(q);
  let productList = productSnapshot.docs.map(convertDocToProduct);
  
  if (searchTerm) {
    const lowercasedTerm = searchTerm.toLowerCase();
    productList = productList.filter(p => 
        (p.name?.toLowerCase() || '').includes(lowercasedTerm) ||
        (p.category?.toLowerCase() || '').includes(lowercasedTerm)
    );
  }
  
  return productList;
}

export async function getGroupPromotions(searchTerm?: string): Promise<GroupPromotion[]> {
    let q = query(collection(db, 'groupPromotions'), orderBy("name"));

    const promotionSnapshot = await getDocs(q);
    let promotionList = await Promise.all(promotionSnapshot.docs.map(doc => convertDocToGroupPromotion(doc.id, doc.data())));

    if (searchTerm && searchTerm.trim() !== '') {
      const normalizedSearch = searchTerm.toLowerCase();
      promotionList = promotionList.filter(p => p.name.toLowerCase().includes(normalizedSearch));
    }
    
    return promotionList;
}

interface CreateGroupData {
    name: string;
    target: number;
    creatorId: string;
    creatorName: string;
    description: string;
    price: number;
    imageUrls?: string[];
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
            status: 'active',
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
            const plainProduct: Product = {
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrls: product.imageUrls,
                lojistaId: product.lojistaId,
                category: product.category,
                productType: product.productType,
                stock: product.stock,
                isPromoted: product.isPromoted,
            };

            if (change === 'add') {
                if (itemSnap.exists()) {
                    const currentQuantity = itemSnap.data().quantity || 0;
                    transaction.update(cartItemRef, { quantity: currentQuantity + 1 });
                } else {
                    transaction.set(cartItemRef, { product: plainProduct, quantity: 1 });
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
            
            const cartColRef = collection(db, 'groupPromotions', groupId, 'groupCart');
            const cartSnapshot = await getDocs(query(cartColRef));
            const groupCart: CartItem[] = cartSnapshot.docs.map(d => d.data() as CartItem);
            
            if (groupCart.length === 0) throw new Error("Cannot contribute to an empty cart.");

            const membersColRef = collection(db, 'groupPromotions', groupId, 'members');
            const membersSnapshot = await getDocs(query(membersColRef));
            const totalMembers = membersSnapshot.size;

            if (totalMembers === 0) throw new Error("Group has no members to divide contribution.");

            const groupCartTotal = groupCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
            const productsValuePerMember = groupCartTotal / totalMembers;
            const contributionAmount = productsValuePerMember + SHIPPING_COST_PER_MEMBER;

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

        return { success: true };

    } catch (error) {
        console.error("Error making contribution:", error);
        return { success: false, message: (error as Error).message };
    }
}


export async function seedDatabase() {
  try {
    const batch = writeBatch(db);
    const productsCol = collection(db, 'products');
    
    // Check for existing products before seeding
    const productsSnapshot = await getDocs(productsCol);
    if (!productsSnapshot.empty) {
        return { success: true, message: 'A base de dados já contém produtos. Nenhuma ação foi tomada.' };
    }

    mockProducts.forEach(product => {
      const docRef = doc(collection(db, "products"));
      batch.set(docRef, { 
          ...product, 
          name_lowercase: product.name.toLowerCase(),
          createdAt: serverTimestamp(), 
        });
    });

    const promotionsCol = collection(db, 'groupPromotions');
    mockGroupPromotions.forEach(promotion => {
        const docRef = doc(collection(db, "groupPromotions"));
        batch.set(docRef, { ...promotion, status: 'active', createdAt: serverTimestamp() });
    });

    await batch.commit();
    return { success: true, message: 'Base de dados populada com sucesso!' };
  } catch (error) {
    console.error("Error seeding database:", error);
    return { success: false, message: `Ocorreu um erro: ${(error as Error).message}` };
  }
}
