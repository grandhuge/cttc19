
export const useStoreProducts = (gameState: any) => {
  const getAvailableProducts = () => {
    let availableProducts = [...gameState.storeData.products];
    
    if (gameState.achievements?.specialItemsUnlocked) {
      const specialProducts = [
        { id: 21, name: '⭐ สมุดพิเศษ', cost: 50, sellPrice: 80, stock: 3, sold: 0 },
        { id: 22, name: '🌟 ปากกาทอง', cost: 100, sellPrice: 150, stock: 2, sold: 0 },
        { id: 23, name: '💎 เครื่องเขียนเพชร', cost: 200, sellPrice: 350, stock: 1, sold: 0 }
      ];
      
      specialProducts.forEach(special => {
        const existingProduct = availableProducts.find(p => p.id === special.id);
        if (!existingProduct) {
          availableProducts.push(special);
        }
      });
    }
    
    return availableProducts;
  };

  return { getAvailableProducts };
};
