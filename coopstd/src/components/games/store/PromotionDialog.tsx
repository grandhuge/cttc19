
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Gift, Users, Megaphone } from 'lucide-react';

interface PromotionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  storeMoney: number;
  hasActivePromotion?: boolean;
  onSelectPromotion: (promotion: any) => void;
}

const PromotionDialog = ({ 
  isOpen, 
  onClose, 
  storeMoney, 
  hasActivePromotion = false,
  onSelectPromotion 
}: PromotionDialogProps) => {
  const promotions = [
    {
      id: 'flash_sale',
      name: '⚡ Flash Sale',
      description: 'ลดราคาสินค้า 20% ดึงดูดลูกค้าเพิ่ม 80%',
      cost: 200,
      effect: { sales: 1.8, duration: 60000 },
      icon: TrendingUp
    },
    {
      id: 'free_gift',
      name: '🎁 ของแถม',
      description: 'ซื้อครบ 50 บาท แถมของขวัญ เพิ่มความพึงพอใจ',
      cost: 300,
      effect: { sales: 1.4, satisfaction: 10, duration: 90000 },
      icon: Gift
    },
    {
      id: 'member_day',
      name: '👥 วันสมาชิก',
      description: 'ส่วนลดพิเศษสำหรับสมาชิก เพิ่มความนิยม',
      cost: 250,
      effect: { sales: 1.5, popularity: 5, duration: 120000 },
      icon: Users
    },
    {
      id: 'grand_opening',
      name: '📢 ประชาสัมพันธ์',
      description: 'โฆษณาร้านค้า ดึงดูดลูกค้าใหม่',
      cost: 400,
      effect: { sales: 2.0, maxCustomers: 3, duration: 180000 },
      icon: Megaphone
    }
  ];

  const handleSelectPromotion = (promotion) => {
    onSelectPromotion(promotion);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            🎪 เลือกโปรโมชั่นส่งเสริมการขาย
          </DialogTitle>
          {hasActivePromotion && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ มีโปรโมชั่นกำลังดำเนินการอยู่แล้ว รอให้เสร็จสิ้นก่อนเลือกโปรโมชั่นใหม่
            </div>
          )}
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {promotions.map((promotion) => {
            const IconComponent = promotion.icon;
            const canAfford = storeMoney >= promotion.cost && !hasActivePromotion;
            
            return (
              <Card 
                key={promotion.id} 
                className={`cursor-pointer transition-all ${
                  canAfford ? 'hover:shadow-lg hover:scale-105' : 'opacity-50'
                } ${hasActivePromotion ? 'border-gray-300' : ''}`}
              >
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{promotion.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    {promotion.description}
                  </p>
                  <div className="text-center mb-4">
                    <div className="text-lg font-bold text-red-600">
                      ค่าใช้จ่าย: {promotion.cost.toLocaleString()} บาท
                    </div>
                    <div className="text-sm text-gray-500">
                      ระยะเวลา: {promotion.effect.duration / 1000} วินาที
                    </div>
                    {promotion.effect.sales && (
                      <div className="text-xs text-green-600">
                        เพิ่มยอดขาย: +{Math.round((promotion.effect.sales - 1) * 100)}%
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => {
                      if (canAfford) {
                        handleSelectPromotion(promotion);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    disabled={!canAfford}
                  >
                    {hasActivePromotion 
                      ? 'รอโปรโมชั่นเสร็จสิ้น' 
                      : canAfford 
                        ? 'เลือกโปรโมชั่นนี้' 
                        : `ทุนไม่เพียงพอ (ต้องการ ${promotion.cost.toLocaleString()} บาท)`
                    }
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>💡 เคล็ดลับ: ผลของโปรโมชั่นจะมีผลทันทีและคงอยู่ตลอดระยะเวลาที่กำหนด</p>
          <p>ทุนร้านปัจจุบัน: <span className="font-semibold text-green-600">{storeMoney.toLocaleString()} บาท</span></p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionDialog;
