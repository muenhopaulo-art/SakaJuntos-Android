'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { products as mockProducts, groupPromotions as mockGroupPromotions } from '@/lib/mock-data';
import type { Product, GroupPromotion } from '@/lib/types';

export async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const productSnapshot = await getDocs(productsCol);
  const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  return productList;
}

export async function getGroupPromotions(): Promise<GroupPromotion[]> {
    const promotionsCol = collection(db, 'groupPromotions');
    const promotionSnapshot = await getDocs(promotionsCol);
    const promotionList = promotionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupPromotion));
    return promotionList;
}

export async function seedDatabase() {
  try {
    const batch = writeBatch(db);

    // Seed products
    const productsCol = collection(db, 'products');
    mockProducts.forEach(product => {
      const { id, ...data } = product;
      const docRef = doc(productsCol, id);
      batch.set(docRef, data);
    });

    // Seed group promotions
    const promotionsCol = collection(db, 'groupPromotions');
    mockGroupPromotions.forEach(promotion => {
        const { id, ...data } = promotion;
        const docRef = doc(promotionsCol, id);
        batch.set(docRef, data);
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
