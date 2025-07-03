
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, Award, Crown } from 'lucide-react';

interface CompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playerName?: string;
}

const CompletionDialog = ({ isOpen, onClose, playerName = "นักเรียน" }: CompletionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="text-center py-8">
          {/* Header with animated crown */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              🏆 ยินดีด้วย! 🏆
            </h1>
            <p className="text-xl text-gray-700">
              คุณ{playerName}ผ่านการทดสอบแล้ว!
            </p>
          </div>

          {/* Achievement cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800">แชมป์สหกรณ์</h3>
                <p className="text-sm text-blue-600">ผู้นำด้านการจัดการ</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">ผู้เชี่ยวชาญ</h3>
                <p className="text-sm text-green-600">เข้าใจหลักการสหกรณ์</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800">นักพัฒนา</h3>
                <p className="text-sm text-purple-600">สร้างสรรค์กิจกรรม</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
              <CardContent className="p-4 text-center">
                <Crown className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <h3 className="font-semibold text-pink-800">ผู้นำ</h3>
                <p className="text-sm text-pink-600">แบบอย่างที่ดี</p>
              </CardContent>
            </Card>
          </div>

          {/* Completion message */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              🎓 การรับรองความสำเร็จ
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              คุณได้แสดงให้เห็นถึงความเข้าใจในหลักการและวิธีการดำเนินงานของสหกรณ์นักเรียนอย่างครบถ้วน 
              ผ่านการจัดการร้านค้า การออมทรัพย์ การผลิต และการจัดกิจกรรมสวัสดิการ
            </p>
            <div className="bg-white rounded-lg p-4 border-2 border-yellow-300">
              <p className="text-lg font-semibold text-gray-800">
                ✨ คุณสมบัติการผ่านเกม: สมบูรณ์ ✨
              </p>
              <p className="text-sm text-gray-600 mt-1">
                สามารถนำความรู้ไปประยุกต์ใช้ในการดำเนินงานสหกรณ์จริงได้
              </p>
            </div>
          </div>

          {/* Sparkle animation */}
          <div className="text-6xl mb-4 animate-bounce">
            ✨🌟✨
          </div>

          <Button 
            onClick={onClose}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 text-lg"
          >
            ปิดหน้าต่าง
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletionDialog;
