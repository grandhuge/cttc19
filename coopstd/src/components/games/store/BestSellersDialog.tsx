
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp, Award } from 'lucide-react';

interface BestSellersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
}

const BestSellersDialog = ({ isOpen, onClose, products }: BestSellersDialogProps) => {
  const getBestSellers = () => {
    return products
      .filter(p => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  };

  const getRecommendations = () => {
    const lowStockProducts = products
      .filter(p => p.stock > 0 && p.stock <= 5 && p.sold > 0)
      .sort((a, b) => b.sold - a.sold);
    
    return lowStockProducts.slice(0, 3);
  };

  const bestSellers = getBestSellers();
  const recommendations = getRecommendations();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center">
            <Star className="w-6 h-6 mr-2 text-yellow-500" />
            สินค้าขายดีและแนะนำ
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Best Sellers Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              🏆 อันดับสินค้าขายดี
            </h3>
            <div className="space-y-2">
              {bestSellers.length > 0 ? bestSellers.map((product, index) => (
                <Card key={product.id} className={`${index === 0 ? 'border-yellow-400 bg-yellow-50' : index === 1 ? 'border-gray-400 bg-gray-50' : index === 2 ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-500' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-600">
                            ขาย {product.sold} ชิ้น | กำไรต่อชิ้น {product.sellPrice - product.cost} บาท
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {((product.sellPrice - product.cost) * product.sold).toLocaleString()} บาท
                        </div>
                        <div className="text-xs text-gray-500">กำไรรวม</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <div className="text-center text-gray-500 py-8">
                  ยังไม่มีข้อมูลการขาย
                </div>
              )}
            </div>
          </div>

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                💡 แนะนำให้เติมสต็อก
              </h3>
              <div className="space-y-2">
                {recommendations.map((product) => (
                  <Card key={product.id} className="border-blue-200 bg-blue-50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-blue-600">
                            เหลือเพียง {product.stock} ชิ้น | ขายได้ {product.sold} ชิ้น
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-blue-700">
                            ต้นทุน {product.cost} บาท
                          </div>
                          <div className="text-xs text-gray-600">ต่อชิ้น</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BestSellersDialog;
