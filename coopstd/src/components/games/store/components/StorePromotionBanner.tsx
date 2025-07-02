
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StorePromotionBannerProps {
  activePromotion: any;
  promotionTimeLeft: number;
}

const StorePromotionBanner = ({ activePromotion, promotionTimeLeft }: StorePromotionBannerProps) => {
  if (!activePromotion || promotionTimeLeft <= 0) return null;

  return (
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
  );
};

export default StorePromotionBanner;
