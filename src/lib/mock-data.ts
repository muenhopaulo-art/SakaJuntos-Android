

import type { Product, GroupPromotion } from './types';

export const products: Omit<Product, 'id' | 'createdAt'>[] = [
  {
    name: 'Café de Angola',
    description: 'Grãos de café arábica de alta qualidade, cultivados nas terras altas de Angola.',
    price: 1500,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    category: 'Bebidas',
    stock: 100,
    isPromoted: 'active',
  },
  {
    name: 'Ginguba Torrada',
    description: 'Amendoim torrado e salgado, um snack perfeito para qualquer hora do dia.',
    price: 500,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    category: 'Snacks',
    stock: 200,
    isPromoted: 'inactive',
  },
  {
    name: 'Sabão Azul',
    description: 'Tradicional sabão azul para lavagem de roupa, eficaz e económico.',
    price: 300,
    imageUrl: 'https://picsum.photos/400/400?random=3',
    category: 'Limpeza',
    stock: 50,
    isPromoted: 'active',
  },
  {
    name: 'Óleo de Palma',
    description: 'Óleo de palma puro, essencial na culinária angolana.',
    price: 2500,
    imageUrl: 'https://picsum.photos/400/400?random=4',
    category: 'Culinária',
    stock: 30,
    isPromoted: 'inactive',
  },
  {
    name: 'Farinha de Milho',
    description: 'Farinha de milho amarela para um funge perfeito.',
    price: 800,
    imageUrl: 'https://picsum.photos/400/400?random=5',
    category: 'Mercearia',
    stock: 80,
    isPromoted: 'active',
  },
  {
    name: 'Pano Samakaka',
    description: 'Tecido tradicional com padrões vibrantes.',
    price: 5000,
    imageUrl: 'https://picsum.photos/400/400?random=6',
    category: 'Têxteis',
    stock: 15,
    isPromoted: 'active',
  },
];

export const groupPromotions: Omit<GroupPromotion, 'id'| 'members' | 'joinRequests' | 'groupCart' | 'contributions'>[] = [
  {
    name: 'Caixa de Sumos Compal',
    description: 'Compre uma caixa com 24 unidades de sumo Compal (sabores variados) a um preço reduzido.',
    price: 4500,
    imageUrl: 'https://picsum.photos/600/400?random=7',
    participants: 7,
    target: 10,
    creatorId: 'user_abc', // Example creator
    status: 'active',
    category: 'Bebidas',
    stock: 10, // Stock para promoções de grupo também
    isPromoted: 'active',
  },
  {
    name: 'Saco de Arroz 25kg',
    description: 'Garanta o arroz para a família com este saco de 25kg de alta qualidade.',
    price: 18000,
    imageUrl: 'https://picsum.photos/600/400?random=8',
    participants: 3,
    target: 5,
    creatorId: 'user_def', // Example creator
    status: 'active',
    category: 'Mercearia',
    stock: 20,
    isPromoted: 'active',
  },
  {
    name: 'Kit de Limpeza',
    description: 'Um kit completo com lava-loiça, lixívia, e multi-usos para a sua casa.',
    price: 3500,
    imageUrl: 'https://picsum.photos/600/400?random=9',
    participants: 12,
    target: 20,
    creatorId: 'user_abc', // Example creator,
    status: 'active',
    category: 'Limpeza',
    stock: 15,
    isPromoted: 'active',
  },
];
