
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Eye } from 'lucide-react';

interface StoreLayoutProps {
  currentCustomers: number;
  maxCustomers: number;
}

const StoreLayout = ({ currentCustomers, maxCustomers }: StoreLayoutProps) => {
  const customerPositions = Array.from({ length: currentCustomers }, (_, i) => ({
    id: i,
    x: Math.random() * 80 + 10,
    y: Math.random() * 60 + 20
  }));

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center">
          <Eye className="mr-2" />
          แผนผังร้าน
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 h-64 overflow-hidden">
          {/* ชั้นวางสินค้า */}
          <div className="absolute top-4 left-4 w-16 h-12 bg-amber-200 rounded border-2 border-amber-400 flex items-center justify-center text-xs font-bold">
            📝📚
          </div>
          <div className="absolute top-4 right-4 w-16 h-12 bg-green-200 rounded border-2 border-green-400 flex items-center justify-center text-xs font-bold">
            🍪🥛
          </div>
          <div className="absolute bottom-4 left-4 w-16 h-12 bg-pink-200 rounded border-2 border-pink-400 flex items-center justify-center text-xs font-bold">
            ✏️✂️
          </div>
          
          {/* เคาน์เตอร์ */}
          <div className="absolute bottom-4 right-4 w-20 h-16 bg-gray-300 rounded border-2 border-gray-500 flex items-center justify-center text-xs font-bold">
            💰 เคาน์เตอร์
          </div>
          
          {/* ลูกค้า */}
          {customerPositions.map((customer) => (
            <div
              key={customer.id}
              className="absolute w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs animate-pulse"
              style={{
                left: `${customer.x}%`,
                top: `${customer.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              👤
            </div>
          ))}
          
          {/* สถิติลูกค้า */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white/90 px-3 py-1 rounded-full border shadow-sm">
            <div className="flex items-center text-sm font-semibold">
              <Users className="w-4 h-4 mr-1 text-blue-600" />
              <span className="text-blue-600">{currentCustomers}</span>
              <span className="text-gray-500">/{maxCustomers}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreLayout;
