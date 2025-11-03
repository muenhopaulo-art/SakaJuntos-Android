

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'produto' | 'serviço';
  imageUrl?: string; 
  aiHint?: string;
  createdAt?: number;
  lojistaId?: string;
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

export type GroupStatus = 'active' | 'finalized' | 'delivered';

export interface GroupPromotion extends Omit<Product, 'image' | 'category'> {
  participants: number;
  target: number;
  creatorId: string;
  members: GroupMember[];
  joinRequests: JoinRequest[];
  groupCart: CartItem[];
  contributions: Contribution[];
  status: GroupStatus;
  category: 'produto';
}

export interface CartItem {
  product: Product;
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

export type OrderStatus = 
  | 'Pendente' 
  | 'A aguardar lojista' 
  | 'Pronto para recolha' 
  | 'A caminho' 
  | 'Entregue' 
  | 'Cancelado';

export type OrderType = 'individual' | 'group';

export interface Order {
  id: string;
  creatorId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  groupName?: string;
  groupId?: string;
  creatorName: string;
  createdAt?: number;
  contributions?: Contribution[];
  lojistaId?: string;
  driverId?: string;
  driverName?: string;
}

export type UserRole = 'client' | 'lojista' | 'admin' | 'courier';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'none';

export interface User {
    uid: string;
    name: string;
    phone: string;
    email: string;
    province: string;
    role: UserRole;
    createdAt: number;
    verificationStatus?: VerificationStatus;
    ownerLojistaId?: string; // ID of the lojista this courier works for
    online?: boolean;
}
