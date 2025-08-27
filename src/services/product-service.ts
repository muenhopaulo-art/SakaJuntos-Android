'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, Timestamp, addDoc } from 'firebase/firestore';
import { products as mockProducts, groupPromotions as mockGroupPromotions } from '@/lib/mock-data';
import type { Product, GroupPromotion } from '@/lib/types';

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

const convertDocToGroupPromotion = (doc: any): GroupPromotion => {
    const data = doc.data();
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
    const promotionList = promotionSnapshot.docs.map(convertDocToGroupPromotion);
    return promotionList;
}

export async function createGroupPromotion(
    groupData: Omit<GroupPromotion, 'id' | 'createdAt' | 'participants'>
): Promise<{ success: boolean; id?: string; message?: string }> {
    try {
        const promotionsCol = collection(db, 'groupPromotions');
        const docRef = await addDoc(promotionsCol, {
            ...groupData,
            participants: 1, // The creator is the first participant
            createdAt: new Date(),
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating group promotion:", error);
        const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
        return { success: false, message };
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
