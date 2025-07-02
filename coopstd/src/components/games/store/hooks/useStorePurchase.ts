
import { useEffect } from 'react';
import { playSound } from '../utils/storeCalculations';

export const useStorePurchase = (
  gameState: any,
  updateGameState: any,
  getAvailableProducts: () => any[],
  calculateCurrentCustomers: () => number
) => {
  const { products, activePromotion, customerSatisfaction, currentCustomers } = gameState.storeData;

  const simulateCustomerPurchase = () => {
    const availableProducts = getAvailableProducts().filter(p => p.stock > 0);
    if (availableProducts.length === 0) return;

    const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
    const purchaseChance = Math.max(0.4, customerSatisfaction / 100);

    if (Math.random() < purchaseChance) {
      const quantity = Math.min(Math.floor(Math.random() * 3) + 1, product.stock);
      const revenue = product.sellPrice * quantity;
      const profit = (product.sellPrice - product.cost) * quantity;
      
      const updatedProducts = getAvailableProducts().map(p => 
        p.id === product.id 
          ? { ...p, stock: Math.max(0, p.stock - quantity), sold: p.sold + quantity }
          : p
      );
      
      const stockLevels = updatedProducts.map(p => {
        const totalItems = Math.max(p.stock + p.sold + 1, 1);
        return p.stock / totalItems;
      });
      const avgStockLevel = stockLevels.reduce((a, b) => a + b) / stockLevels.length;
      
      let newSatisfaction = customerSatisfaction;
      if (avgStockLevel > 0.7) {
        newSatisfaction = Math.min(100, customerSatisfaction + 0.8);
      } else if (avgStockLevel > 0.4) {
        newSatisfaction = Math.min(100, customerSatisfaction + 0.3);
      } else if (avgStockLevel < 0.2) {
        newSatisfaction = Math.max(20, customerSatisfaction - 1.2);
      }

      if (activePromotion && activePromotion.effect.satisfaction) {
        newSatisfaction = Math.min(100, newSatisfaction + (activePromotion.effect.satisfaction * 0.1));
      }

      let experienceBonus = quantity * 2;
      if (product.name.includes('⭐') || product.name.includes('🌟') || product.name.includes('💎')) {
        experienceBonus *= 3;
      }

      playSound('sale');

      updateGameState({
        experience: gameState.experience + experienceBonus,
        storeData: {
          ...gameState.storeData,
          products: updatedProducts,
          dailySales: gameState.storeData.dailySales + revenue,
          totalProfit: gameState.storeData.totalProfit + profit,
          customerSatisfaction: Math.round(newSatisfaction * 10) / 10
        }
      });
    }
  };

  // Store game continues running even when switching pages
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if we're currently in the store game
      const isInStoreGame = window.location.hash === '#store' || document.title.includes('ร้านค้า');
      
      const satisfactionFactor = Math.max(0.3, customerSatisfaction / 100);
      let baseSalesChance = (satisfactionFactor * currentCustomers * 0.02);
      
      if (activePromotion && activePromotion.effect.sales) {
        baseSalesChance *= activePromotion.effect.sales;
      }
      
      // Increase sales chance when actively in store game
      if (isInStoreGame) {
        baseSalesChance *= 1.5;
      }
      
      if (Math.random() < baseSalesChance && currentCustomers > 0) {
        simulateCustomerPurchase();
      }
      
      const newCustomerCount = calculateCurrentCustomers();
      if (newCustomerCount !== currentCustomers) {
        updateGameState({
          storeData: {
            ...gameState.storeData,
            currentCustomers: newCustomerCount,
            maxCustomers: gameState.storeData.maxCustomers
          }
        });
      }
    }, isInStoreGame ? 2500 : 5000); // Faster when in store, slower when away

    return () => clearInterval(interval);
  }, [products, activePromotion, customerSatisfaction, gameState.storePopularity, currentCustomers, gameState.storeData.storeMoney]);

  return { simulateCustomerPurchase };
};
