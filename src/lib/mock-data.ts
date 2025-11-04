

import type { Product, GroupPromotion } from './types';

export const products: Omit<Product, 'id' | 'createdAt'>[] = [
  {
    name: 'Café de Angola',
    description: 'Grãos de café arábica de alta qualidade, cultivados nas terras altas de Angola.',
    price: 1500,
    imageUrls: ['https://picsum.photos/400/400?random=1'],
    aiHint: 'coffee beans',
    category: 'produto',
  },
  {
    name: 'Ginguba Torrada',
    description: 'Amendoim torrado e salgado, um snack perfeito para qualquer hora do dia.',
    price: 500,
    imageUrls: ['https://picsum.photos/400/400?random=2'],
    aiHint: 'roasted peanuts',
    category: 'produto',
  },
  {
    name: 'Sabão Azul',
    description: 'Tradicional sabão azul para lavagem de roupa, eficaz e económico.',
    price: 300,
    imageUrls: ['https://picsum.photos/400/400?random=3'],
    aiHint: 'soap bar',
    category: 'produto',
  },
  {
    name: 'Óleo de Palma',
    description: 'Óleo de palma puro, essencial na culinária angolana.',
    price: 2500,
    imageUrls: ['https://picsum.photos/400/400?random=4'],
    aiHint: 'palm oil',
    category: 'produto',
  },
  {
    name: 'Farinha de Milho',
    description: 'Farinha de milho amarela para um funge perfeito.',
    price: 800,
    imageUrls: ['https://picsum.photos/400/400?random=5'],
    aiHint: 'corn flour',
    category: 'produto',
  },
  {
    name: 'Pano Samakaka',
    description: 'Tecido tradicional com padrões vibrantes.',
    price: 5000,
    imageUrls: ['https://picsum.photos/400/400?random=6'],
    aiHint: 'african fabric',
    category: 'produto',
  },
];

export const groupPromotions: Omit<GroupPromotion, 'id'| 'members' | 'joinRequests' | 'groupCart' | 'contributions'>[] = [
  {
    name: 'Caixa de Sumos Compal',
    description: 'Compre uma caixa com 24 unidades de sumo Compal (sabores variados) a um preço reduzido.',
    price: 4500,
    imageUrl: 'https://picsum.photos/600/400?random=7',
    aiHint: 'juice box',
    participants: 7,
    target: 10,
    creatorId: 'user_abc', // Example creator
    status: 'active',
  },
  {
    name: 'Saco de Arroz 25kg',
    description: 'Garanta o arroz para a família com este saco de 25kg de alta qualidade.',
    price: 18000,
    imageUrl: 'https://picsum.photos/600/400?random=8',
    aiHint: 'rice sack',
    participants: 3,
    target: 5,
    creatorId: 'user_def', // Example creator
    status: 'active',
  },
  {
    name: 'Kit de Limpeza',
    description: 'Um kit completo com lava-loiça, lixívia, e multi-usos para a sua casa.',
    price: 3500,
    imageUrl: 'https://picsum.photos/600/400?random=9',
    aiHint: 'cleaning supplies',
    participants: 12,
    target: 20,
    creatorId: 'user_abc', // Example creator,
    status: 'active',
  },
];
