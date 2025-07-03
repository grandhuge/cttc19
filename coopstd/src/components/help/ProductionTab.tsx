
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProductionTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-green-600">🌱 กิจกรรมการผลิตและอาชีพ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">🏭 ประเภทการผลิต</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><strong>ปลูกผัก:</strong> ต้นทุน 20 บาท ใช้เวลา 45 วินาที กำไร 8 บาท (40%)</li>
              <li><strong>เลี้ยงสัตว์:</strong> ต้นทุน 50 บาท ใช้เวลา 90 วินาที กำไร 20 บาท (40%)</li>
              <li><strong>ปลูกผลไม้:</strong> ต้นทุน 35 บาท ใช้เวลา 60 วินาที กำไร 14 บาท (40%)</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🏭 การแปรรูปผลผลิต</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li><strong>สลัดผัก:</strong> ใช้ผัก 2 ชิ้น เวลา 30 วินาที ได้ 45 บาท</li>
              <li><strong>ไส้กรอก:</strong> ใช้เนื้อสัตว์ 1 ชิ้น เวลา 50 วินาที ได้ 85 บาท</li>
              <li><strong>น้ำผลไม้:</strong> ใช้ผลไม้ 3 ชิ้น เวลา 40 วินาที ได้ 75 บาท</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">⚡ ระบบอัพเกรด</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>การอัพเกรดเพิ่มผลผลิตและลดเวลาการทำงาน</li>
            <li>ต้นทุนอัพเกรด: ระดับ × 200 บาท</li>
            <li>ได้ประสบการณ์ 15 แต้มต่อการอัพเกรด</li>
            <li>การอัพเกรดไม่เพิ่มประสบการณ์จากการผลิต</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">📦 ระบบวัตถุดิบ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>ทุกการผลิตจะได้วัตถุดิบ 1 ชิ้น</li>
            <li>วัตถุดิบใช้สำหรับการแปรรูปเป็นสินค้าที่มีมูลค่าสูง</li>
            <li>การแปรรูปให้ประสบการณ์และรายได้เพิ่มเติม</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">💰 ระบบรายได้</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>รายได้จากการผลิตไปเป็นเงินส่วนตัวเท่านั้น</li>
            <li>ไม่เพิ่มเงินสะสมโดยตรง</li>
            <li>ประสบการณ์ = รายได้ ÷ 20 (การผลิต) หรือ ÷ 25 (การแปรรูป)</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">💡 เคล็ดลับ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
            <li>เริ่มจากการปลูกผักเพื่อสร้างทุนเริ่มต้น</li>
            <li>เก็บวัตถุดิบสำหรับการแปรรูปให้ได้รายได้สูงขึ้น</li>
            <li>อัพเกรดเมื่อมีเงินเพียงพอเพื่อเพิ่มประสิทธิภาพ</li>
            <li>ทำหลายกิจกรรมพร้อมกันเพื่อเพิ่มรายได้</li>
            <li>เก็บผลผลิตทันทีเมื่อเสร็จเพื่อเริ่มรอบใหม่</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductionTab;
