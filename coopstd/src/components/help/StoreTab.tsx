
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StoreTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-purple-600">🏪 ร้านค้าสหกรณ์</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">📦 การจัดการสินค้า</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>จัดการสินค้า 20 รายการ (อาหาร เครื่องดื่ม เครื่องเขียน)</li>
              <li>เติมสต็อกด้วยเงินทุนร้าน (ราคาต้นทุน)</li>
              <li>ลูกค้าซื้อสินค้าอัตโนมัติตลอดเวลา</li>
              <li>สินค้าพิเศษปลดล็อกเมื่อบรรลุเงื่อนไข</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">💼 การเงินร้านค้า</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>เพิ่มทุนร้านจากเงินส่วนตัว</li>
              <li>ถอนทุนได้สูงสุด 20% ของทุนปัจจุบัน</li>
              <li>ลูกค้าสูงสุด = (ทุนร้าน ÷ 100) + 5</li>
              <li>กำไรสะสมจากการขาย</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">👥 ระบบลูกค้า</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>จำนวนลูกค้าขึ้นอยู่กับทุนร้านและโปรโมชั่น</li>
            <li>ความพึงพอใจลูกค้าส่งผลต่อโอกาสซื้อสินค้า</li>
            <li>สต็อกสินค้าที่เพียงพอช่วยเพิ่มความพึงพอใจ</li>
            <li>สินค้าหมดลดความพึงพอใจลูกค้า</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🎯 ระบบโปรโมชั่น</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li><strong>ลดราคา 10%:</strong> เพิ่มลูกค้า 20% (2 นาที) ค่าใช้จ่าย 200 บาท</li>
            <li><strong>ซื้อ 2 แถม 1:</strong> เพิ่มลูกค้า 30% (90 วินาที) ค่าใช้จ่าย 300 บาท</li>
            <li><strong>Flash Sale:</strong> เพิ่มลูกค้า 50% (1 นาที) ค่าใช้จ่าย 500 บาท</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">📊 การสรุปบัญชี</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>นำยอดขายทั้งหมดไปเพิ่มทุนร้าน</li>
            <li>กำไรสะสมไปเป็นเงินสะสมส่วนตัว</li>
            <li>ได้ประสบการณ์จากกำไรที่ทำได้</li>
            <li>รีเซ็ตยอดขายและกำไรหลังสรุปบัญชี</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">⭐ สินค้าพิเศษ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li><strong>สมุดพิเศษ:</strong> ต้นทุน 50 บาท ขาย 80 บาท</li>
            <li><strong>ปากกาทอง:</strong> ต้นทุน 100 บาท ขาย 150 บาท</li>
            <li><strong>เครื่องเขียนเพชร:</strong> ต้นทุน 200 บาท ขาย 350 บาท</li>
          </ul>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-purple-800 mb-2">💡 เคล็ดลับ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
            <li>เฝ้าดูสต็อกและเติมทันทีเมื่อจำเป็น</li>
            <li>ใช้โปรโมชั่นอย่างชาญฉลาดเพื่อเพิ่มยอดขาย</li>
            <li>เพิ่มทุนร้านเมื่อมีเงินเหลือเพื่อรองรับลูกค้า</li>
            <li>ติดตามความพึงพอใจลูกค้าอย่างต่อเนื่อง</li>
            <li>สรุปบัญชีเป็นประจำเพื่อเพิ่มเงินสะสม</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreTab;
