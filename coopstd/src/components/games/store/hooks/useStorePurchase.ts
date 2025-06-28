
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
    const purchaseChance = Math.max(0.3, customerSatisfaction / 120); // ปรับ base chance ให้สมเหตุสมผล

    if (Math.random() < purchaseChance) {
      const quantity = Math.min(Math.floor(Math.random() * 2) + 1, product.stock); // ลดจำนวนการซื้อต่อครั้ง
      const revenue = product.sellPrice * quantity;
      const profit = (product.sellPrice - product.cost) * quantity;
      
      const updatedProducts = getAvailableProducts().map(p => 
        p.id === product.id 
          ? { ...p, stock: Math.max(0, p.stock - quantity), sold: p.sold + quantity }
          : p
      );
      
      // ปรับการคำนวณความพึงพอใจให้สมจริงมากขึ้น
      const stockLevels = updatedProducts.map(p => {
        const totalItems = Math.max(p.stock + p.sold + 1, 1);
        return p.stock / totalItems;
      });
      const avgStockLevel = stockLevels.reduce((a, b) => a + b) / stockLevels.length;
      
      let newSatisfaction = customerSatisfaction;
      if (avgStockLevel > 0.8) {
        newSatisfaction = Math.min(100, customerSatisfaction + 0.5); // ลดการเพิ่มขึ้น
      } else if (avgStockLevel > 0.5) {
        newSatisfaction = Math.min(100, customerSatisfaction + 0.2);
      } else if (avgStockLevel < 0.3) {
        newSatisfaction = Math.max(10, customerSatisfaction - 0.8); // ลดการลดลง
      }

      // ปรับผลกระทบจากโปรโมชั่น
      if (activePromotion && activePromotion.effect.satisfaction) {
        newSatisfaction = Math.min(100, newSatisfaction + (activePromotion.effect.satisfaction * 0.05));
      }

      // ปรับการให้ประสบการณ์
      let experienceBonus = Math.max(1, Math.floor(quantity * 1.5));
      if (product.name.includes('⭐') || product.name.includes('🌟') || product.name.includes('💎')) {
        experienceBonus *= 2; // ลดโบนัสจากสินค้าพิเศษ
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // เพิ่มการตรวจสอบว่าอยู่ในหน้าร้านค้าหรือไม่
    const isInStore = window.location.pathname === '/' && gameState.currentGame !== 'store';
    
    // ปรับความถี่ในการขาย - ถ้าไม่อยู่ในหน้าร้านค้าจะขายช้าลง
    const baseInterval = isInStore ? 4000 : 3000; // 4 วินาทีถ้าไม่อยู่ในหน้า, 3 วินาทีถ้าอยู่ในหน้า
    
    interval = setInterval(() => {
      const satisfactionFactor = Math.max(0.2, customerSatisfaction / 120);
      let baseSalesChance = (satisfactionFactor * currentCustomers * 0.015); // ลดโอกาสการขาย
      
      if (activePromotion && activePromotion.effect.sales) {
        baseSalesChance *= Math.min(activePromotion.effect.sales, 1.5); // จำกัดผลกระทบจากโปรโมชั่น
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
    }, baseInterval);

    return () => clearInterval(interval);
  }, [products, activePromotion, customerSatisfaction, gameState.storePopularity, currentCustomers, gameState.storeData.storeMoney]);

  return { simulateCustomerPurchase };
};
