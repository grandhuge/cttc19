
import { useState } from 'react';

export const useProductRestock = (gameState: any, updateGameState: any, getAvailableProducts: any) => {
  const [restockAmount, setRestockAmount] = useState({});
  const { products, storeMoney } = gameState.storeData;

  const restockProduct = (productId: number) => {
    const product = getAvailableProducts.find((p: any) => p.id === productId);
    const quantity = parseInt(restockAmount[productId]) || 0;
    
    if (quantity <= 0) {
      alert('กรุณาใส่จำนวนที่ต้องการเติมสต็อก');
      return;
    }
    
    const totalCost = product.cost * quantity;
    
    if (totalCost > storeMoney) {
      alert(`ทุนร้านไม่พอ! ต้องใช้เงิน ${totalCost.toLocaleString()} บาท (มีอยู่ ${storeMoney.toLocaleString()} บาท)`);
      return;
    }

    const updatedProducts = products.map((p: any) => 
      p.id === productId 
        ? { ...p, stock: p.stock + quantity }
        : p
    );
    
    updateGameState({
      storeData: {
        ...gameState.storeData,
        products: updatedProducts,
        storeMoney: storeMoney - totalCost
      }
    });
    
    setRestockAmount(prev => ({ ...prev, [productId]: '' }));
    alert(`เติมสต็อกสำเร็จ! ${product.name} เพิ่ม ${quantity} ชิ้น`);
  };

  const handleRestockAmountChange = (productId: number, value: string) => {
    setRestockAmount(prev => ({ ...prev, [productId]: value }));
  };

  return {
    restockAmount,
    restockProduct,
    handleRestockAmountChange
  };
};
