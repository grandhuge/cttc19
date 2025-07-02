
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChampionTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-yellow-600">🏆 เป้าหมายสู่การเป็นแชมป์สหกรณ์นักเรียน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-300">
          <h4 className="font-semibold text-yellow-800 mb-2">🎯 เกณฑ์การเป็นแชมป์</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium text-yellow-700 mb-2">📊 เกณฑ์พื้นฐาน</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>ระดับ 15 ขึ้นไป</li>
                <li>เงินสะสม 20,000 บาทขึ้นไป</li>
                <li>ทุนร้านค้า 10,000 บาทขึ้นไป</li>
                <li>จัดให้มีสวัสดิการครบทุกประเภท</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-yellow-700 mb-2">⭐ เกณฑ์พิเศษ</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                <li>กำไรสะสมจากร้านค้า 50,000+ บาท</li>
                <li>การผลิตครบทุกประเภทและอัพเกรดสูงสุด</li>
                <li>ปลดล็อกสินค้าพิเศษทั้งหมด</li>
                <li>ดำเนินธุรกิจต่อเนื่องอย่างน้อย 30 นาที</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🚀 แผนการก้าวสู่แชมป์</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h5 className="font-medium text-green-800">สร้างรายได้เริ่มต้น</h5>
                <p className="text-sm text-green-700">เริ่มจากการผลิตผัก → สร้างเงินทุน → ออมเงินส่วนหนึ่ง</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h5 className="font-medium text-blue-800">ขยายการผลิต</h5>
                <p className="text-sm text-blue-700">อัพเกรดการผลิต → เพิ่มประเภทการผลิต → แปรรูปผลผลิต</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h5 className="font-medium text-purple-800">เปิดร้านค้า</h5>
                <p className="text-sm text-purple-700">ลงทุนเปิดร้าน → เติมสต็อก → ใช้โปรโมชั่น → สรุปบัญช</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h5 className="font-medium text-orange-800">ใช้สวัสดิการ</h5>
                <p className="text-sm text-orange-700">ใช้สวัสดิการทุกประเภท → เพิ่มประสบการณ์ → ปลดล็อกสิ่งใหม่</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
              <div>
                <h5 className="font-medium text-yellow-800">บรรลุเป้าหมาย</h5>
                <p className="text-sm text-yellow-700">ครบตามเกณฑ์ทั้งหมด → รับการยอมรับเป็นแชมป์สหกรณ์นักเรียน</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">💎 สิทธิพิเศษแชมป์</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>ได้รับตำแหน่งแชมป์สหกรณ์นักเรียนอย่างเป็นทางการ</li>
            <li>ปลดล็อกสินค้าพิเศษในร้านค้า (สมุดพิเศษ ปากกาทอง เครื่องเขียนเพชร)</li>
            <li>โบนัสประสบการณ์เพิ่มเติมจากทุกกิจกรรม</li>
            <li>สิทธิในการเป็นผู้นำสหกรณ์</li>
            <li>เป็นแบบอย่างให้สมาชิกท่านอื่น</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">📊 ติดตามความก้าวหน้า</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">ตรวจสอบความก้าวหน้าของคุณในหน้าสถิติ:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>ระดับปัจจุบันและประสบการณ์ที่ต้องการ</li>
              <li>จำนวนเงินสะสมและทุนร้านค้า</li>
              <li>สวัสดิการที่ใช้ไปแล้ว</li>
              <li>ความสำเร็จที่ปลดล็อกแล้ว</li>
            </ul>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 rounded-lg border border-yellow-400">
          <h4 className="font-semibold text-orange-800 mb-2">🌟 เคล็ดลับสำคัญ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            <li>วางแผนการเงินให้ดี - แบ่งเงินระหว่างการลงทุน การออม และการใช้สวัสดิการ</li>
            <li>สร้างสมดุลระหว่างการทำกำไรระยะสั้นและการลงทุนระยะยาว</li>
            <li>ใช้สวัสดิการอย่างมีแผน - ไม่ใช้ทีเดียวทั้งหมด</li>
            <li>ติดตามสถิติของตัวเองเป็นประจำ</li>
            <li>อดทน - การเป็นแชมป์ต้องใช้เวลาและความมุ่งมั่น</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChampionTab;
