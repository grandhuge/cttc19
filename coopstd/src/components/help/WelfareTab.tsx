
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const WelfareTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-orange-600">🎁 กิจกรรมสวัสดิการ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">🏥 สวัสดิการสุขภาพ</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>ตรวจสุขภาพฟรี (เงื่อนไข: ระดับ 5+)</li>
              <li>ประกันสุขภาพ (เงื่อนไข: เงินส่วนตัว 5,000+ บาท)</li>
              <li>ค่าใช้จ่าย: 200-500 บาท</li>
              <li>ได้ประสบการณ์และโบนัสพิเศษ</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">🎓 สวัสดิการการศึกษา</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>ทุนการศึกษา (เงื่อนไข: ระดับ 8+)</li>
              <li>อุปกรณ์การเรียน (เงื่อนไข: เงินส่วนตัว 3,000+ บาท)</li>
              <li>ค่าใช้จ่าย: 300-800 บาท</li>
              <li>เพิ่มประสบการณ์และปลดล็อกสิ่งใหม่</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">💝 สวัสดิการพิเศษ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>โบนัสสมาชิกดีเด่น (เงื่อนไข: ระดับ 10+)</li>
            <li>รางวัลผู้ประกอบการรุ่นใหม่ (เงื่อนไข: กำไรร้านค้า 10,000+ บาท)</li>
            <li>สิทธิพิเศษสำหรับแชมป์สหกรณ์</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🎯 เงื่อนไขการจัดสวัสดิการ</h4>
          <div className="bg-orange-50 p-3 rounded-lg">
            <ul className="list-disc list-inside space-y-1 text-sm text-orange-800">
              <li>มีระดับและเงินส่วนตัวตามที่กำหนด</li>
              <li>จ่ายค่าใช้จ่ายตามสวัสดิการที่เลือก</li>
              <li>บางสวัสดิการใช้ได้เพียงครั้งเดียว</li>
              <li>สวัสดิการพิเศษต้องมีคุณสมบัติเฉพาะ</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">📈 ผลประโยชน์ที่ได้รับ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>เพิ่มประสบการณ์จากการจัดสวัสดิการ</li>
            <li>ปลดล็อกคุณสมบัติพิเศษ</li>
            <li>เพิ่มความก้าวหน้าสู่การเป็นแชมป์</li>
            <li>สร้างเครือข่ายความร่วมมือ</li>
          </ul>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2">💡 เคล็ดลับ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            <li>เช็คเงื่อนไขก่อนจัดสวัสดิการ</li>
            <li>วางแผนการจัดสวัสดิการให้เหมาะสมกับเป้าหมาย</li>
            <li>สวัสดิการที่จัดแล้วจะช่วยเพิ่มโอกาสเป็นแชมป์</li>
            <li>บางสวัสดิการมีผลต่อการปลดล็อกสิ่งใหม่</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelfareTab;
