
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: number;
  name: string;
  cost: number;
  sellPrice: number;
  stock: number;
  sold: number;
}

interface ProductGridProps {
  products: Product[];
  restockAmount: { [key: number]: string };
  storeMoney: number;
  onRestockAmountChange: (productId: number, value: string) => void;
  onRestockProduct: (productId: number) => void;
}

const ProductGrid = ({
  products,
  restockAmount,
  storeMoney,
  onRestockAmountChange,
  onRestockProduct
}: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-center">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>ต้นทุน:</span>
                <span className="text-red-600">{product.cost} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>ราคาขาย:</span>
                <span className="text-green-600">{product.sellPrice} บาท</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>คงเหลือ:</span>
                <Badge variant={product.stock > 5 ? "secondary" : "destructive"}>
                  {product.stock} ชิ้น
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>ขายแล้ว:</span>
                <span className="text-blue-600">{product.sold} ชิ้น</span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="จำนวน"
                    value={restockAmount[product.id] || ''}
                    onChange={(e) => onRestockAmountChange(product.id, e.target.value)}
                    className="text-sm"
                  />
                </div>
                <Button 
                  onClick={() => onRestockProduct(product.id)}
                  className="w-full mt-2 bg-purple-500 hover:bg-purple-600"
                  size="sm"
                  disabled={!restockAmount[product.id]}
                >
                  เติมสต็อก
                </Button>
                <div className="text-xs text-gray-500 text-center mt-1">
                  ต้นทุน: {product.cost * (parseInt(restockAmount[product.id]) || 0)} บาท
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProductGrid;
