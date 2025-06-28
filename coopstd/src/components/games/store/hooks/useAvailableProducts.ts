
import { useMemo } from 'react';

export const useAvailableProducts = (gameState: any) => {
  const products = gameState.storeData.products;

  const getAvailableProducts = useMemo(() => {
    let availableProducts = [...products];
    
    if (gameState.achievements?.specialItemsUnlocked) {
      const specialProducts = [
        { id: 21, name: '⭐ สมุดพิเศษ', cost: 50, sellPrice: 80, stock: 3, sold: 0 },
        { id: 22, name: '🌟 ปากกาทอง', cost: 100, sellPrice: 150, stock: 2, sold: 0 },
        { id: 23, name: '💎 เครื่องเขียนเพชร', cost: 200, sellPrice: 350, stock: 1, sold: 0 }
      ];
      
      specialProducts.forEach(special => {
        if (!availableProducts.find(p => p.id === special.id)) {
          availableProducts.push(special);
        }
      });
    }
    
    return availableProducts;
  }, [products, gameState.achievements?.specialItemsUnlocked]);

  return getAvailableProducts;
};
