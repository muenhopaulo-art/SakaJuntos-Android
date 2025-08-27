export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
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
    name: string;
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


export interface GroupPromotion extends Product {
  participants: number;
  target: number;
  creatorId: string;
  members: GroupMember[];
  joinRequests: JoinRequest[];
}

export interface CartItem {
  product: Product | GroupPromotion;
  quantity: number;
}

export interface Geolocation {
  latitude: number;
  longitude: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  groupId: string;
  groupName: string;
  items: CartItem[];
  totalAmount: number;
  location: Geolocation;
  status: 'Pendente' | 'A caminho' | 'Entregue';
  createdAt?: number;
}
