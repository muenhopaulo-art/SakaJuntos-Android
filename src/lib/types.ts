export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  aiHint?: string;
  createdAt?: number;
}

export interface GroupPromotion extends Product {
  participants: number;
  target: number;
  creatorId?: string; // Add creatorId to track who created the group
}

export interface CartItem {
  product: Product | GroupPromotion;
  quantity: number;
}
