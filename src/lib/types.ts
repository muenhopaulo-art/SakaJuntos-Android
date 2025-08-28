export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  aiHint?: string;
  createdAt?: number;
}

export interface GroupMember {
    uid: string;
    name: string;
    joinedAt: number;
}

export interface JoinRequest {
    uid: string;
    name:string;
    requestedAt: number;
}

export interface ChatMessage {
    id: string;
    text?: string;
    audioSrc?: string;
    senderId: string;
    senderName: string;
    createdAt: number;
}


export interface GroupPromotion extends Omit<Product, 'image'> {
  participants: number;
  target: number;
  creatorId: string;
  members: GroupMember[];
  joinRequests: JoinRequest[];
  groupCart: CartItem[];
  contributions: Contribution[];
}

export interface CartItem {
  product: Product; // Keep it simple: always a Product
  quantity: number;
}

export interface Geolocation {
  latitude: number;
  longitude: number;
}

export interface Contribution {
    userId: string;
    userName: string;
    amount: number;
    location: Geolocation;
    createdAt: number;
}

export interface Order {
  id: string;
  groupId: string;
  groupName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'Pendente' | 'A caminho' | 'Entregue';
  createdAt?: number;
  contributions: Contribution[];
}

export interface User {
    uid: string;
    name: string;
    phone: string;
    email: string;
    // role: UserRole;
    createdAt: number;
    // wantsToBeLojista?: boolean;
    // storeStatus?: StoreStatus;
}
