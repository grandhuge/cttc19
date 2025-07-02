
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OverviewTab from './help/OverviewTab';
import ProductionTab from './help/ProductionTab';
import SavingsTab from './help/SavingsTab';
import StoreTab from './help/StoreTab';
import WelfareTab from './help/WelfareTab';
import ChampionTab from './help/ChampionTab';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog = ({ isOpen, onClose }: HelpDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🏫 คู่มือการเล่นเกมจำลองสหกรณ์นักเรียน
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            เรียนรู้วิธีการเล่นและเป้าหมายสู่การเป็นแชมป์สหกรณ์นักเรียน
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="production">การผลิต</TabsTrigger>
            <TabsTrigger value="savings">ออมทรัพย์</TabsTrigger>
            <TabsTrigger value="store">ร้านค้า</TabsTrigger>
            <TabsTrigger value="welfare">สวัสดิการ</TabsTrigger>
            <TabsTrigger value="champion">เป้าหมายแชมป์</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <ProductionTab />
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <SavingsTab />
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            <StoreTab />
          </TabsContent>

          <TabsContent value="welfare" className="space-y-4">
            <WelfareTab />
          </TabsContent>

          <TabsContent value="champion" className="space-y-4">
            <ChampionTab />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
            เข้าใจแล้ว เริ่มเป็นแชมป์กันเลย! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
