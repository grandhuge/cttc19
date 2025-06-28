
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpDialog = ({ isOpen, onClose }: HelpDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🏫 คู่มือการเล่นเกมจำลองสหกรณ์นักเรียน
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="production">การผลิต</TabsTrigger>
            <TabsTrigger value="savings">ออมทรัพย์</TabsTrigger>
            <TabsTrigger value="store">ร้านค้า</TabsTrigger>
            <TabsTrigger value="welfare">สวัสดิการ</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-600">🎯 ภาพรวมของเกม</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  เกมจำลองสหกรณ์นักเรียนนี้ออกแบบมาเพื่อให้ผู้เล่นได้เรียนรู้การทำงานของสหกรณ์ 
                  ผ่านกิจกรรม 4 หมวดหลัก ได้แก่ การผลิต การออมทรัพย์ ร้านค้า และสวัสดิการ
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-600">💡 เป้าหมายของเกม</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>เรียนรู้หลักการทำงานของสหกรณ์</li>
                      <li>พัฒนาทักษะการจัดการเงิน</li>
                      <li>ฝึกการวางแผนและตัดสินใจ</li>
                      <li>เข้าใจความสำคัญของการช่วยเหลือสังคม</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-600">⭐ ระบบการเล่น</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>ระบบประสบการณ์และการเลื่อนระดับ</li>
                      <li>ความสำเร็จและไอเทมพิเศษ</li>
                      <li>การเล่นต่อเนื่องข้ามเกม</li>
                      <li>เป้าหมายสู่การเป็น "แชมป์สหกรณ์นักเรียน"</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-800 mb-2">🎮 วิธีการเล่น</h4>
                  <p className="text-sm text-yellow-700">
                    แต่ละเกมจะทำงานแยกอิสระแต่เชื่อมโยงกัน ผู้เล่นสามารถสลับไปมาระหว่างเกมได้ตลอดเวลา 
                    และกิจกรรมบางอย่างจะดำเนินต่อไปแม้ไม่ได้อยู่ในหน้านั้น
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="production" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-green-600">🏠 กิจกรรมการผลิตและอาชีพ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">🌱 ประเภทการผลิต</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>ปลูกผัก:</strong> ต้นทุนต่ำ ใช้เวลา 45 วินาที</li>
                      <li><strong>เลี้ยงไก่:</strong> ต้นทุนกลาง ใช้เวลา 60 วินาที</li>
                      <li><strong>เลี้ยงปลา:</strong> ต้นทุนสูง ใช้เวลา 90 วินาที</li>
                      <li><strong>เพาะเห็ด:</strong> ต้นทุนสูงสุด ใช้เวลา 120 วินาที</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">⚡ คุณสมบัติพิเศษ</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>สามารถทำหลายกิจกรรมพร้อมกัน</li>
                      <li>ระบบแปรรูปผลผลิตเพิ่มมูลค่า</li>
                      <li>เหตุการณ์สุ่มเพิ่มความท้าทาย</li>
                      <li>ความเสี่ยงและผลตอบแทนแตกต่างกัน</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">💡 เคล็ดลับ</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                    <li>เริ่มจากการปลูกผักเพื่อสร้างทุนเริ่มต้น</li>
                    <li>ดูอัตราผลตอบแทนต่อเวลาก่อนลงทุน</li>
                    <li>เก็บผลผลิตทันทีเมื่อเสร็จสิ้นเพื่อเริ่มรอบใหม่</li>
                    <li>ใช้การแปรรูปเมื่อมีทุนเพียงพอ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="savings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-600">💰 กิจกรรมออมทรัพย์</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">🏦 ระบบออมทรัพย์</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>ฝากเงินเข้าบัญชีออมทรัพย์</li>
                      <li>รับดอกเบี้ย 1% ทุก 30 วินาที</li>
                      <li>ดอกเบี้ยทบต้นแบบอัตโนมัติ</li>
                      <li>ถอนเงินได้ตามต้องการทุกเมื่อ</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">📊 การจัดการ</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>ดูประวัติการทำรายการทั้งหมด</li>
                      <li>ติดตามดอกเบี้ยที่สะสม</li>
                      <li>วางแผนการออมระยะยาว</li>
                      <li>เงินในบัญชีเพิ่มขึ้นต่อเนื่อง</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 เคล็ดลับ</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                    <li>ฝากเงินส่วนหนึ่งทันทีที่มีรายได้</li>
                    <li>ให้เงินสะสมในบัญชีนานๆ เพื่อดอกเบี้ยทบต้น</li>
                    <li>ใช้เงินออมเป็นเงินสำรองสำหรับลงทุนใหญ่</li>
                    <li>ติดตามยอดเงินออมเป็นประจำ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-purple-600">🏪 ร้านค้าสหกรณ์</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">📦 การจัดการสินค้า</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>จัดการสต็อกสินค้า 20 รายการ</li>
                      <li>เติมสินค้าเมื่อหมด (Auto-Restock)</li>
                      <li>ลูกค้าซื้อสินค้าโดยอัตโนมัติ</li>
                      <li>ปรับราคาและจัดการกำไร</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">💼 การเงินร้านค้า</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>เพิ่มทุนร้านเพื่อขยายธุรกิจ</li>
                      <li>ถอนทุนได้สูงสุด 20%</li>
                      <li>ลูกค้าสูงสุดขึ้นอยู่กับทุนร้าน</li>
                      <li>การสรุปบัญชี: ยอดขาย - ต้นทุน = กำไร</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">🎯 ระบบโปรโมชั่น</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>ลดราคา 10%:</strong> เพิ่มลูกค้า 20% เป็นเวลา 2 นาที</li>
                      <li><strong>ซื้อ 2 แถม 1:</strong> เพิ่มลูกค้า 30% เป็นเวลา 90 วินาที</li>
                      <li><strong>Flash Sale:</strong> เพิ่มลูกค้า 50% เป็นเวลา 1 นาที</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">💡 เคล็ดลับ</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-purple-700">
                      <li>จัดการสต็อกให้เหมาะสม ไม่มากเกินไปหรือน้อยเกินไป</li>
                      <li>ใช้โปรโมชั่นอย่างชาญฉลาดเพื่อเพิ่มยอดขาย</li>
                      <li>เพิ่มทุนร้านเมื่อมีเงินเหลือเพื่อเพิ่มลูกค้า</li>
                      <li>ติดตามความพึงพอใจลูกค้าและความนิยมร้าน</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="welfare" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-orange-600">📚 การศึกษาและสวัสดิการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">🏛️ คณะกรรมการ</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>สมาชิกคณะกรรมการ 5 คน</li>
                      <li>จัดประชุมเพื่อพิจารณาโครงการ</li>
                      <li>ประชุมฉุกเฉินเมื่อจำเป็น (100 บาท)</li>
                      <li>ติดตามผลการดำเนินงาน</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">🎯 ความต้องการสมาชิก</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li>ช่วยเหลือทางการเงิน (เร่งด่วน)</li>
                      <li>สุขภาพและการดูแล (ปานกลาง)</li>
                      <li>ประสบการณ์การเรียนรู้ (ปานกลาง)</li>
                      <li>กีฬาและนันทนาการ (ไม่เร่งด่วน)</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">🚀 โครงการสวัสดิการ</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                      <li><strong>ทุนการศึกษา:</strong> 2,000 บาท, 60 วินาที, +15% ความนิยม</li>
                      <li><strong>ตรวจสุขภาพ:</strong> 1,500 บาท, 45 วินาที, +10% ความนิยม</li>
                      <li><strong>ทัศนศึกษา:</strong> 3,000 บาท, 90 วินาที, +20% ความนิยม</li>
                      <li><strong>อุปกรณ์กีฬา:</strong> 1,000 บาท, 30 วินาที, +8% ความนิยม</li>
                      <li><strong>หนังสือห้องสมุด:</strong> 800 บาท, 40 วินาที, +12% ความนิยม</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-800 mb-2">✨ ระบบโบนัส</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
                      <li>เมื่อโครงการตรงกับความต้องการสมาชิก จะได้โบนัสพิเศษ</li>
                      <li>โบนัสความพึงพอใจลูกค้า และความนิยมร้านเพิ่มเติม</li>
                      <li>โครงการดำเนินต่อเนื่องแม้สลับไปเล่นเกมอื่น</li>
                      <li>ความต้องการสมาชิกปรากฏสุ่มและมีเวลาจำกัด</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">💡 เคล็ดลับ</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    <li>เฝ้าดูความต้องการสมาชิกและตอบสนองอย่างรวดเร็ว</li>
                    <li>สมดุลระหว่างการสร้างรายได้และการช่วยเหลือสังคม</li>
                    <li>ใช้ประชุมฉุกเฉินเมื่อต้องการเพิ่มความนิยมอย่างรวดเร็ว</li>
                    <li>วางแผนงบประมาณให้เหมาะสมกับโครงการ</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8">
            เข้าใจแล้ว เริ่มเล่น!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HelpDialog;
