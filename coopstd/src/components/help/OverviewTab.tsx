
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const OverviewTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-blue-600">🏫 ภาพรวมเกมจำลองสหกรณ์นักเรียน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">🎯 วัตถุประสงค์ของเกม</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>เรียนรู้หลักการสหกรณ์และการประกอบอาชีพ</li>
              <li>ฝึกทักษะการจัดการเงิน การออม และการลงทุน</li>
              <li>พัฒนาความเข้าใจเรื่องการดำเนินธุรกิจ</li>
              <li>สร้างประสบการณ์การทำงานร่วมกันในสหกรณ์</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">📊 ระบบคะแนน</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><strong>เงินส่วนตัว:</strong> เงินสดจากการทำงาน</li>
              <li><strong>เงินสะสม:</strong> เงินออมจากกำไรร้านค้า</li>
              <li><strong>ประสบการณ์:</strong> แต้มที่ได้จากการทำกิจกรรม</li>
              <li><strong>ระดับ:</strong> คำนวณจากประสบการณ์ที่สะสม</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🎮 กิจกรรมหลัก 4 ด้าน</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl mb-2">🌱</div>
              <div className="text-sm font-semibold text-green-800">การผลิตและอาชีพ</div>
              <div className="text-xs text-green-600">สร้างรายได้จากการทำงาน</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-semibold text-blue-800">ออมทรัพย์</div>
              <div className="text-xs text-blue-600">เก็บเงินได้ดอกเบี้ย</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl mb-2">🏪</div>
              <div className="text-sm font-semibold text-purple-800">ร้านค้าสหกรณ์</div>
              <div className="text-xs text-purple-600">ดำเนินธุรกิจร้านค้า</div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl mb-2">🎁</div>
              <div className="text-sm font-semibold text-orange-800">สวัสดิการ</div>
              <div className="text-xs text-orange-600">จัดสิทธิประโยชน์ให้สมาชิก</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-purple-800 mb-2">🚀 วิธีเริ่มเล่น</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700">
            <li>เริ่มจากกิจกรรมการผลิต เพื่อสร้างรายได้เริ่มต้น</li>
            <li>เก็บเงินส่วนหนึ่งไว้ในออมทรัพย์ เพื่อได้ดอกเบี้ย</li>
            <li>ใช้เงินที่เหลือลงทุนเปิดร้านค้าสหกรณ์</li>
            <li>ขยายธุรกิจและรับสวัสดิการต่างๆ</li>
            <li>มุ่งสู่การเป็นแชมป์สหกรณ์นักเรียน</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverviewTab;
