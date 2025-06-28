
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Calculator, ArrowDownToLine, Star } from 'lucide-react';

interface StoreStatsProps {
  storeMoney: number;
  dailySales: number;
  totalProfit: number;
  customerSatisfaction: number;
  currentCustomers: number;
  maxCustomers: number;
  products: any[];
  onAddCapital: () => void;
  onWithdrawCapital: () => void;
  onPromotions: () => void;
  onAccountSummary: () => void;
  onShowBestSellers: () => void;
}

const StoreStats = ({
  storeMoney,
  dailySales,
  totalProfit,
  customerSatisfaction,
  currentCustomers,
  maxCustomers,
  products,
  onAddCapital,
  onWithdrawCapital,
  onPromotions,
  onAccountSummary,
  onShowBestSellers
}: StoreStatsProps) => {
  // Calculate best sellers for display
  const getBestSellers = () => {
    return products
      .filter(p => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 3);
  };

  const bestSellers = getBestSellers();
  const hasLowStock = products.some(p => p.stock <= 2 && p.sold > 0);
  const totalItemsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">🏪 ทุนร้าน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-indigo-600">
            {storeMoney.toLocaleString()} บาท
          </div>
          <div className="text-xs text-gray-500">
            ทุนคงที่ (ไม่รวมยอดขาย)
          </div>
          <div className="space-y-1">
            <Button 
              onClick={onAddCapital}
              className="w-full text-xs bg-indigo-500 hover:bg-indigo-600"
              size="sm"
            >
              เพิ่มทุน
            </Button>
            <Button 
              onClick={onWithdrawCapital}
              className="w-full text-xs bg-red-500 hover:bg-red-600"
              size="sm"
              disabled={storeMoney < 5}
            >
              <ArrowDownToLine className="w-3 h-3 mr-1" />
              ถอนทุน (20%)
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">💰 ยอดขายวันนี้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
            {dailySales.toLocaleString()} บาท
          </div>
          <div className="text-xs text-gray-500">
            จะเพิ่มทุนเมื่อสรุปบัญชี
          </div>
          {bestSellers.length > 0 && (
            <Button 
              onClick={onShowBestSellers}
              className="w-full text-xs bg-yellow-500 hover:bg-yellow-600"
              size="sm"
            >
              <Star className="w-3 h-3 mr-1" />
              สินค้าขายดี ({bestSellers.length})
            </Button>
          )}
          {hasLowStock && (
            <div className="text-xs text-red-600">
              ⚠️ สินค้าเหลือน้อย
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">📈 กำไรสะสม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
            {totalProfit.toLocaleString()} บาท
          </div>
          <div className="text-xs text-gray-500">
            → เงินสะสมเมื่อสรุปบัญชี
          </div>
          {totalProfit > 0 && (
            <div className="text-xs text-green-600">
              💎 +{totalProfit.toLocaleString()} เงินสะสม
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">⭐ ความพึงพอใจ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
            {customerSatisfaction.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">
            ส่งผลต่อยอดขาย
          </div>
          <Button 
            onClick={onPromotions}
            className="w-full text-xs bg-pink-500 hover:bg-pink-600"
            size="sm"
          >
            <TrendingUp className="w-3 h-3 mr-1" />
            จัดโปรโมชั่น
          </Button>
          <div className="text-xs text-center">
            สต็อกรวม: {totalItemsInStock} ชิ้น
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm">👥 ลูกค้าปัจจุบัน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-pink-600">
            {currentCustomers}/{maxCustomers}
          </div>
          <div className="text-xs text-gray-500">
            ขึ้นอยู่กับทุน+ความนิยม
          </div>
          <Button 
            onClick={onAccountSummary}
            className="w-full text-xs bg-green-500 hover:bg-green-600"
            size="sm"
            disabled={totalProfit <= 0 && dailySales <= 0}
          >
            <Calculator className="w-3 h-3 mr-1" />
            สรุปบัญชี
          </Button>
          {(totalProfit > 0 || dailySales > 0) && (
            <div className="text-xs text-green-600 text-center">
              พร้อมสรุปบัญชี
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreStats;
