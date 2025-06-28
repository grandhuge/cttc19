
import React from 'react';
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
import { usePromotionTimer } from './hooks/usePromotionTimer';
import { useAvailableProducts } from './hooks/useAvailableProducts';
import { useProductRestock } from './hooks/useProductRestock';
import { useStoreDialogs } from './hooks/useStoreDialogs';
import { calculateMaxCustomers, calculateCurrentCustomers } from './utils/storeCalculations';
import { createStoreActions } from './utils/storeActions';

const StoreGameLogic = ({ gameState, updateGameState, onBack }) => {
  const storeData = gameState.storeData;
  const { storeMoney, dailySales, totalProfit, customerSatisfaction, currentCustomers, activePromotion } = storeData;

  const maxCustomers = calculateMaxCustomers(storeMoney, activePromotion);
  
  // Custom hooks for managing different aspects
  const promotionTimeLeft = usePromotionTimer(activePromotion, gameState, updateGameState);
  const getAvailableProducts = useAvailableProducts(gameState);
  const { showPromotions, showBestSellers, setShowPromotions, setShowBestSellers } = useStoreDialogs();
  const { restockAmount, restockProduct, handleRestockAmountChange } = useProductRestock(gameState, updateGameState, getAvailableProducts);

  const calculateCurrentCustomersWrapper = () => {
    return calculateCurrentCustomers(currentCustomers, maxCustomers, gameState.storePopularity);
  };

  const { handleSelectPromotion } = useStorePromotion(activePromotion, gameState, updateGameState);
  const { simulateCustomerPurchase } = useStorePurchase(gameState, updateGameState, () => getAvailableProducts, calculateCurrentCustomersWrapper);
  const { addCapitalToStore, withdrawCapital, handleAccountSummary } = createStoreActions(gameState, updateGameState);

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
                    {promotionTimeLeft} วินาที
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
            products={getAvailableProducts}
            onAddCapital={addCapitalToStore}
            onWithdrawCapital={withdrawCapital}
            onPromotions={() => setShowPromotions(true)}
            onAccountSummary={handleAccountSummary}
            onShowBestSellers={() => setShowBestSellers(true)}
          />

          <ProductGrid
            products={getAvailableProducts}
            restockAmount={restockAmount}
            storeMoney={storeMoney}
            onRestockAmountChange={handleRestockAmountChange}
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
          products={getAvailableProducts}
        />
      </div>
    </div>
  );
};

export default StoreGameLogic;
