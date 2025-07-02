import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SavingsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl text-blue-600">💰 กิจกรรมออมทรัพย์</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">🏦 ระบบออมทรัพย์</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>ฝากเงินเข้าบัญชีออมทรัพย์ (ขั้นต่ำ 10 บาท)</li>
              <li>รับดอกเบี้ย 1% ทุก 30 วินาที</li>
              <li>ดอกเบี้ยทบต้นแบบอัตโนมัติ</li>
              <li>ถอนเงินได้ตามต้องการทุกเมื่อ</li>
              <li>ได้รับประสบการณ์จากการฝาก-ถอน</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">📊 การจัดการ</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>ดูประวัติการทำรายการทั้งหมด</li>
              <li>ติดตามดอกเบี้ยที่สะสมในแต่ละช่วง</li>
              <li>วางแผนการออมระยะยาว</li>
              <li>เงินในบัญชีเพิ่มขึ้นต่อเนื่องแม้ออฟไลน์</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">💡 การคำนวณดอกเบี้ย</h4>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>ตัวอย่าง:</strong> ฝากเงิน 1,000 บาท
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-700">
              <li>หลัง 30 วินาที: 1,000 + (1,000 × 1%) = 1,010 บาท</li>
              <li>หลัง 60 วินาที: 1,010 + (1,010 × 1%) = 1,020.10 บาท</li>
              <li>หลัง 90 วินาท: 1,020.10 + (1,020.10 × 1%) = 1,030.30 บาท</li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">🎯 วัตถุประสงค์</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>สร้างนิสัยการออมเงินที่ดี</li>
            <li>เรียนรู้เรื่องดอกเบี้ยทบต้น</li>
            <li>เตรียมเงินทุนสำหรับการลงทุนครั้งใหญ่</li>
            <li>สร้างความมั่นคงทางการเงิน</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2">💡 เคล็ดลับ</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>ฝากเงินส่วนหนึ่งทันทีที่มีรายได้</li>
            <li>ปล่อยเงินสะสมนานๆ เพื่อให้ดอกเบี้ยทบต้น</li>
            <li>ใช้เงินออมเป็นเงินสำรองสำหรับลงทุนใหญ่</li>
            <li>ตั้งเป้าการออมเป็นเปอร์เซ็นต์จากรายได้</li>
            <li>ติดตามอัตราเติบโตของเงินออมเป็นประจำ</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsTab;
