
import React from 'react';
import { Button } from '@/components/ui/button';
import { Store } from 'lucide-react';

interface StoreHeaderProps {
  onBack: () => void;
}

const StoreHeader = ({ onBack }: StoreHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold text-gray-800 flex items-center">
        <Store className="mr-3 text-purple-600" />
        ร้านค้าสหกรณ์
      </h1>
      <Button onClick={onBack} variant="outline" className="px-6">
        กลับหน้าหลัก
      </Button>
    </div>
  );
};

export default StoreHeader;
