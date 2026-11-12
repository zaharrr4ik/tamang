import type { ShopItem } from '@/types';

/**
 * Мок-товары магазина.
 * Покупка в каркасе не реализована: товары с ownedByDefault уже «выданы» игроку
 * (их можно надеть/снять), остальные показываются с пометкой «скоро».
 */
export const shopItems: ShopItem[] = [
  {
    id: 'item-hat',
    title: 'Шляпа',
    description: 'Тёплая шляпа для прогулок',
    emoji: '🎩',
    price: 30,
    category: 'outfit',
    ownedByDefault: true,
  },
  {
    id: 'item-scarf',
    title: 'Шарф',
    description: 'Мягкий шарф в полоску',
    emoji: '🧣',
    price: 40,
    category: 'accessory',
    ownedByDefault: true,
  },
  {
    id: 'item-fish',
    title: 'Рыбка',
    description: 'Любимое лакомство питомца',
    emoji: '🐟',
    price: 15,
    category: 'food',
    ownedByDefault: true,
  },
  {
    id: 'item-crown',
    title: 'Корона',
    description: 'Королевский вид для особых случаев',
    emoji: '👑',
    price: 120,
    category: 'accessory',
  },
  {
    id: 'item-glasses',
    title: 'Очки',
    description: 'Серьёзный взгляд на учёбу',
    emoji: '🕶️',
    price: 80,
    category: 'accessory',
  },
  {
    id: 'item-sweater',
    title: 'Свитер',
    description: 'Тёплый свитер с узором',
    emoji: '🧥',
    price: 90,
    category: 'outfit',
  },
  {
    id: 'item-cookie',
    title: 'Печенье',
    description: 'Хрустящее печенье к чаю',
    emoji: '🍪',
    price: 20,
    category: 'food',
  },
];
