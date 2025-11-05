

export interface Product {
  id: string;
  name: string;
  name_lowercase?: string; // For case-insensitive search
  description: string;
  price: number;
  productType: 'product' | 'service';
  imageUrl?: string;
  aiHint?: string;
  createdAt?: number;
  lojistaId?: string;
  serviceContactPhone?: string;
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

// A promoção de grupo é um tipo de produto, mas com campos adicionais
export interface GroupPromotion extends Omit<Product, 'productType' | 'serviceContactPhone' | 'name_lowercase'> {
  participants: number;
  target: number;
  creatorId: string;
  members: GroupMember[];
  joinRequests: JoinRequest[];
  groupCart: CartItem[];
  contributions: Contribution[];
  status: GroupStatus;
  productType: 'product'; // Grupos são sempre produtos
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
  | 'pendente'
  | 'a aguardar lojista'
  | 'pronto para recolha'
  | 'a caminho'
  | 'entregue'
  | 'cancelado';

export type OrderType = 'individual' | 'group';

// This represents the structure of the `items` array inside an Order document
export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    lojistaId?: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderType: OrderType;
  groupName?: string;
  groupId?: string;
  createdAt?: number;
  updatedAt?: number;
  completedAt?: number;
  contributions?: Contribution[];
  lojistaId?: string;
  courierId?: string;
  courierName?: string;
  deliveryLocation?: Geolocation;
  pickupLocation?: Geolocation;
  platformFee?: number;
  courierEarning?: number;
  paymentId?: string;
}

export type UserRole = 'client' | 'lojista' | 'admin' | 'courier';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'none';

export interface User {
    uid: string;
    name: string;
    phone: string;
    email: string;
    province?: string;
    role: UserRole;
    createdAt: number;
    verificationStatus?: VerificationStatus;
    wantsToBecomeLojista?: boolean; // Keep for compatibility if needed
    ownerLojistaId?: string; // ID of the lojista this courier works for
    online?: boolean;
}
