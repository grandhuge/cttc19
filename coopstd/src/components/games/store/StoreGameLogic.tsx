
import React, { useState } from 'react';
import GameHeader from '@/components/GameHeader';
import StoreHeader from './StoreHeader';
import StoreStats from './StoreStats';
import StoreLayout from './StoreLayout';
import ProductGrid from './ProductGrid';
import PromotionDialog from './PromotionDialog';
import BestSellersDialog from './BestSellersDialog';
import StorePromotionBanner from './components/StorePromotionBanner';
import { useStorePromotion } from './hooks/useStorePromotion';
import { useStorePurchase } from './hooks/useStorePurchase';
import { usePromotionTimer } from './hooks/usePromotionTimer';
import { useStoreProducts } from './hooks/useStoreProducts';
import { calculateMaxCustomers, calculateCurrentCustomers } from './utils/storeCalculations';
import { createStoreActions } from './utils/storeActions';

const StoreGameLogic = ({ gameState, updateGameState, onBack }) => {
  const [restockAmount, setRestockAmount] = useState({});
  const [showPromotions, setShowPromotions] = useState(false);
  const [showBestSellers, setShowBestSellers] = useState(false);

  const storeData = gameState.storeData;
  const { storeMoney, dailySales, totalProfit, customerSatisfaction, currentCustomers, activePromotion } = storeData;

  const maxCustomers = calculateMaxCustomers(storeMoney, activePromotion);
  const promotionTimeLeft = usePromotionTimer(activePromotion, updateGameState, gameState);
  const { getAvailableProducts } = useStoreProducts(gameState);

  const calculateCurrentCustomersWrapper = () => {
    return calculateCurrentCustomers(currentCustomers, maxCustomers, gameState.storePopularity);
  };

  const { handleSelectPromotion } = useStorePromotion(activePromotion, gameState, updateGameState);
  const { simulateCustomerPurchase } = useStorePurchase(gameState, updateGameState, getAvailableProducts, calculateCurrentCustomersWrapper);
  const { addCapitalToStore, withdrawCapital, handleAccountSummary } = createStoreActions(gameState, updateGameState);

  const restockProduct = (productId) => {
    const availableProducts = getAvailableProducts();
    const product = availableProducts.find(p => p.id === productId);
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

    const isSpecialItem = [21, 22, 23].includes(productId);
    
    let updatedProducts;
    if (isSpecialItem) {
      const existingSpecialIndex = gameState.storeData.products.findIndex(p => p.id === productId);
      if (existingSpecialIndex >= 0) {
        updatedProducts = gameState.storeData.products.map(p => 
          p.id === productId 
            ? { ...p, stock: p.stock + quantity }
            : p
        );
      } else {
        updatedProducts = [...gameState.storeData.products, { ...product, stock: quantity }];
      }
    } else {
      updatedProducts = gameState.storeData.products.map(p => 
        p.id === productId 
          ? { ...p, stock: p.stock + quantity }
          : p
      );
    }
    
    updateGameState({
      storeData: {
        ...storeData,
        products: updatedProducts,
        storeMoney: storeMoney - totalCost
      }
    });
    
    setRestockAmount(prev => ({ ...prev, [productId]: '' }));
    alert(`เติมสต็อกสำเร็จ! ${product.name} เพิ่ม ${quantity} ชิ้น`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <GameHeader gameState={gameState} />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <StoreHeader onBack={onBack} />
        
        <StorePromotionBanner 
          activePromotion={activePromotion} 
          promotionTimeLeft={promotionTimeLeft} 
        />

        <div className="space-y-4 sm:space-y-6">
          <StoreLayout currentCustomers={currentCustomers} maxCustomers={maxCustomers} />

          <StoreStats
            storeMoney={storeMoney}
            dailySales={dailySales}
            totalProfit={totalProfit}
            customerSatisfaction={customerSatisfaction}
            currentCustomers={currentCustomers}
            maxCustomers={maxCustomers}
            products={getAvailableProducts()}
            onAddCapital={addCapitalToStore}
            onWithdrawCapital={withdrawCapital}
            onPromotions={() => setShowPromotions(true)}
            onAccountSummary={handleAccountSummary}
            onShowBestSellers={() => setShowBestSellers(true)}
          />

          <ProductGrid
            products={getAvailableProducts()}
            restockAmount={restockAmount}
            storeMoney={storeMoney}
            onRestockAmountChange={(productId, value) => 
              setRestockAmount(prev => ({ ...prev, [productId]: value }))
            }
            onRestockProduct={restockProduct}
          />
        </div>

        <PromotionDialog
          isOpen={showPromotions}
          onClose={() => setShowPromotions(false)}
          storeMoney={storeMoney}
          hasActivePromotion={!!activePromotion && promotionTimeLeft > 0}
          onSelectPromotion={handleSelectPromotion}
        />

        <BestSellersDialog
          isOpen={showBestSellers}
          onClose={() => setShowBestSellers(false)}
          products={getAvailableProducts()}
        />
      </div>
    </div>
  );
};

export default StoreGameLogic;
