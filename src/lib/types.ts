

export interface Product {
  id: string;
  name: string;
  name_lowercase?: string;
  description: string;
  price: number;
  category: string;
  productType: 'product' | 'service';
  stock: number;
  isPromoted: 'active' | 'inactive';
  imageUrls?: string[];
  createdAt?: number;
  lojistaId?: string;
  promotionTier?: string;
  promotionPaymentId?: string; 
  aiHint?: string;
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
    createdAt: any;
}

export type GroupStatus = 'active' | 'finalized' | 'delivered';

// A promoção de grupo é um tipo de produto, mas com campos adicionais
export interface GroupPromotion extends Product {
  participants: number;
  target: number;
  creatorId: string;
  members: GroupMember[];
  joinRequests: JoinRequest[];
  groupCart: CartItem[];
  contributions: Contribution[];
  status: GroupStatus;
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
    address: string;
    location: Geolocation | null;
    createdAt: number;
}

export type OrderStatus =
  | 'pendente'
  | 'a aguardar lojista'
  | 'pronto para recolha'
  | 'a caminho'
  | 'aguardando confirmação' // Client needs to confirm receipt
  | 'entregue pelo vendedor' // Intermediate status for lojista delivery
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
  address?: string;
  deliveryLocation?: Geolocation;
  pickupLocation?: Geolocation;
  platformFee?: number;
  courierEarning?: number;
  paymentId?: string;
}

export type UserRole = 'client' | 'lojista' | 'admin' | 'courier';

export interface User {
    uid: string;
    name: string;
    phone: string;
    email: string;
    province?: string;
    role: UserRole;
    createdAt: number;
    ownerLojistaId?: string; // ID of the lojista this courier works for
    online?: boolean;
}

export type ServiceRequestStatus = 'pendente' | 'confirmado' | 'concluído' | 'cancelado';

export interface ServiceRequest {
    id: string;
    serviceId: string;
    serviceName: string;
    clientId: string;
    clientName: string;
    clientPhone: string;
    lojistaId: string;
    requestedDate: number;
    requestedPeriod: 'manha' | 'tarde';
    address: string;
    location?: Geolocation;
    notes?: string;
    status: ServiceRequestStatus;
    createdAt: number;
}


export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: number;
}

export type PromotionPaymentStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface PromotionPayment {
    id: string;
    lojistaId: string;
    lojistaName: string;
    productId: string;
    productName: string;
    tier: string;
    amount: number;
    referenceCode: string;
    status: PromotionPaymentStatus;
    createdAt: number;
    paymentPhoneNumber: string; // The number to pay to
    userName: string; // The name of the user making the payment
}
