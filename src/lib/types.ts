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
  creatorId: string;
}

export interface CartItem {
  product: Product | GroupPromotion;
  quantity: number;
}
