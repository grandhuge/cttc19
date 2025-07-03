
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import GameHeader from '@/components/GameHeader';
import StoreHeader from './StoreHeader';
import StoreStats from './StoreStats';
import StoreLayout from './StoreLayout';
import ProductGrid from './ProductGrid';
import PromotionDialog from './PromotionDialog';
import BestSellersDialog from './BestSellersDialog';
import { useStorePromotion } from './hooks/useStorePromotion';
import { useStorePurchase } from './hooks/useStorePurchase';
import { calculateMaxCustomers, calculateCurrentCustomers } from './utils/storeCalculations';
import { createStoreActions } from './utils/storeActions';

const StoreGameLogic = ({ gameState, updateGameState, onBack }) => {
  const [restockAmount, setRestockAmount] = useState({});
  const [showPromotions, setShowPromotions] = useState(false);
  const [showBestSellers, setShowBestSellers] = useState(false);
  const [promotionTimeLeft, setPromotionTimeLeft] = useState(0);

  const storeData = gameState.storeData;
  const { products, storeMoney, dailySales, totalProfit, customerSatisfaction, currentCustomers, activePromotion } = storeData;

  const maxCustomers = calculateMaxCustomers(storeMoney, activePromotion);

  // Timer for promotion countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activePromotion && activePromotion.startTime) {
      const updateTimer = () => {
        const elapsed = Date.now() - activePromotion.startTime;
        const remaining = Math.max(0, activePromotion.effect.duration - elapsed);
        setPromotionTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          // Clear promotion immediately when time is up
          updateGameState({
            storeData: {
              ...gameState.storeData,
              activePromotion: null
            }
          });
          setPromotionTimeLeft(0);
          clearInterval(timer);
        }
      };
      
      // Update immediately
      updateTimer();
      
      // Then update every second
      timer = setInterval(updateTimer, 1000);
    } else {
      setPromotionTimeLeft(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activePromotion, gameState.storeData, updateGameState]);

  const getAvailableProducts = () => {
    let availableProducts = [...products];
    
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

    // แก้ไขบัค special items - ตรวจสอบว่าเป็น special item หรือไม่
    const isSpecialItem = [21, 22, 23].includes(productId);
    
    let updatedProducts;
    if (isSpecialItem) {
      // สำหรับ special items - อัปเดตหรือเพิ่มใหม่
      const existingSpecialIndex = products.findIndex(p => p.id === productId);
      if (existingSpecialIndex >= 0) {
        // อัปเดต special item ที่มีอยู่
        updatedProducts = products.map(p => 
          p.id === productId 
            ? { ...p, stock: p.stock + quantity }
            : p
        );
      } else {
        // เพิ่ม special item ใหม่
        updatedProducts = [...products, { ...product, stock: quantity }];
      }
    } else {
      // สำหรับ regular items
      updatedProducts = products.map(p => 
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

        {activePromotion && promotionTimeLeft > 0 && (
          <Card className="mb-4 sm:mb-6 border-yellow-400 bg-yellow-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center">
                  <span className="text-xl sm:text-2xl mr-2 sm:mr-3">🎪</span>
                  <div>
                    <div className="font-semibold text-yellow-800 text-sm sm:text-base">
                      โปรโมชั่นกำลังดำเนินการ!
                    </div>
                    <div className="text-yellow-700 text-xs sm:text-sm">
                      {activePromotion.name}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs sm:text-sm text-yellow-600">เหลือเวลา</div>
                  <div className="text-lg sm:text-xl font-bold text-yellow-800">
                    {promotionTimeLeft} วินาท
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
