import type { Product, GroupPromotion } from './types';

export const products: Product[] = [
  {
    id: 'prod_001',
    name: 'Café de Angola',
    description: 'Grãos de café arábica de alta qualidade, cultivados nas terras altas de Angola.',
    price: 1500,
    image: 'https://picsum.photos/400/400',
    aiHint: 'coffee beans',
  },
  {
    id: 'prod_002',
    name: 'Ginguba Torrada',
    description: 'Amendoim torrado e salgado, um snack perfeito para qualquer hora do dia.',
    price: 500,
    image: 'https://picsum.photos/400/401',
    aiHint: 'roasted peanuts',
  },
  {
    id: 'prod_003',
    name: 'Sabão Azul',
    description: 'Tradicional sabão azul para lavagem de roupa, eficaz e económico.',
    price: 300,
    image: 'https://picsum.photos/400/402',
    aiHint: 'soap bar',
  },
  {
    id: 'prod_004',
    name: 'Óleo de Palma',
    description: 'Óleo de palma puro, essencial na culinária angolana.',
    price: 2500,
    image: 'https://picsum.photos/400/403',
    aiHint: 'palm oil',
  },
  {
    id: 'prod_005',
    name: 'Farinha de Milho',
    description: 'Farinha de milho amarela para um funge perfeito.',
    price: 800,
    image: 'https://picsum.photos/400/404',
    aiHint: 'corn flour',
  },
  {
    id: 'prod_006',
    name: 'Pano Samakaka',
    description: 'Tecido tradicional com padrões vibrantes.',
    price: 5000,
    image: 'https://picsum.photos/400/405',
    aiHint: 'african fabric',
  },
];

export const groupPromotions: GroupPromotion[] = [
  {
    id: 'promo_001',
    name: 'Caixa de Sumos Compal',
    description: 'Compre uma caixa com 24 unidades de sumo Compal (sabores variados) a um preço reduzido.',
    price: 4500,
    image: 'https://picsum.photos/400/406',
    aiHint: 'juice box',
    participants: 7,
    target: 10,
    creatorId: 'user_abc', // Example creator
  },
  {
    id: 'promo_002',
    name: 'Saco de Arroz 25kg',
    description: 'Garanta o arroz para a família com este saco de 25kg de alta qualidade.',
    price: 18000,
    image: 'https://picsum.photos/400/407',
    aiHint: 'rice sack',
    participants: 3,
    target: 5,
    creatorId: 'user_def', // Example creator
  },
  {
    id: 'promo_003',
    name: 'Kit de Limpeza',
    description: 'Um kit completo com lava-loiça, lixívia, e multi-usos para a sua casa.',
    price: 3500,
    image: 'https://picsum.photos/400/408',
    aiHint: 'cleaning supplies',
    participants: 12,
    target: 20,
    creatorId: 'user_abc', // Example creator
  },
];
