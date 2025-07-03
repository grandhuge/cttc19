
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { House, Sprout, Beef, Apple, Droplets, Sun, Clock, ArrowLeft, Factory, Star } from 'lucide-react';
import GameHeader from '@/components/GameHeader';

const ProductionGame = ({ gameState, updateGameState, onBack }) => {
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const intervalRef = useRef(null);

  // Sound effects utility
  const playSound = (frequency = 800, duration = 200, type = 'sine') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type as OscillatorType;
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.log('Sound not supported');
    }
  };

  const productions = [
    {
      id: 'vegetable',
      name: '🥬 ปลูกผัก',
      description: 'ปลูกผักสดใหม่',
      icon: Sprout,
      baseTime: 45,
      baseReward: 28,
      baseCost: 20,
      color: 'from-green-400 to-green-600'
    },
    {
      id: 'livestock',
      name: '🐄 เลี้ยงสัตว์',
      description: 'เลี้ยงสัตว์ให้ผลผลิต',
      icon: Beef,
      baseTime: 90,
      baseReward: 70,
      baseCost: 50,
      color: 'from-orange-400 to-orange-600'
    },
    {
      id: 'fruit',
      name: '🍎 ปลูกผลไม้',
      description: 'ปลูกผลไม้หวานๆ',
      icon: Apple,
      baseTime: 60,
      baseReward: 49,
      baseCost: 35,
      color: 'from-red-400 to-red-600'
    }
  ];

  const processingOptions = [
    {
      id: 'vegetable_salad',
      name: '🥗 สลัดผัก',
      description: 'แปรรูปผักเป็นสลัด',
      requiredItem: 'vegetable',
      requiredQuantity: 2,
      processingTime: 30,
      sellPrice: 45,
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      id: 'meat_sausage',
      name: '🌭 ไส้กรอก',
      description: 'แปรรูปเนื้อสัตว์เป็นไส้กรอก',
      requiredItem: 'livestock',
      requiredQuantity: 1,
      processingTime: 50,
      sellPrice: 85,
      color: 'from-amber-400 to-amber-600'
    },
    {
      id: 'fruit_juice',
      name: '🧃 น้ำผลไม้',
      description: 'แปรรูปผลไม้เป็นน้ำผลไม้',
      requiredItem: 'fruit',
      requiredQuantity: 3,
      processingTime: 40,
      sellPrice: 75,
      color: 'from-rose-400 to-rose-600'
    }
  ];

  const getProductionLevel = (id) => {
    const production = gameState.productions?.find(p => p.id === id);
    return production?.level || 1;
  };

  // ปรับสูตรให้สมจริง - กำไรไม่เกิน 40%
  const getProductionCost = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    return Math.floor(baseProduction.baseCost * Math.pow(1.2, level - 1));
  };

  const getProductionTime = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    return Math.max(15, baseProduction.baseTime - (level - 1) * 5);
  };

  // ปรับสูตรรายได้ให้สมจริง - กำไรไม่เกิน 40%
  const getProductionReward = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    const cost = getProductionCost(id);
    // กำไรสูงสุด 40% จากต้นทุน
    const maxProfit = cost * 0.4;
    const baseReward = cost + maxProfit;
    return Math.floor(baseReward * Math.pow(1.15, level - 1));
  };

  const getRawMaterialCount = (type) => {
    const materials = gameState.rawMaterials || {};
    return materials[type] || 0;
  };

  const startProduction = (productionType) => {
    const cost = getProductionCost(productionType.id);
    
    if (gameState.money < cost) {
      playSound(300, 300, 'sawtooth');
      alert('เงินไม่พอ! ต้องการ ' + cost + ' บาท');
      return;
    }

    playSound(800, 200, 'sine');
    
    const newProduction = {
      id: Date.now(),
      type: productionType.id,
      name: productionType.name,
      startTime: Date.now(),
      duration: getProductionTime(productionType.id) * 1000,
      reward: getProductionReward(productionType.id),
      cost: cost
    };

    updateGameState({
      money: gameState.money - cost,
      products: [...(gameState.products || []), newProduction]
    });

    setSelectedProduction(null);
  };

  const collectProduct = (product) => {
    playSound(1000, 300, 'triangle');
    
    const newMoney = gameState.money + product.reward;
    const newProducts = gameState.products.filter(p => p.id !== product.id);
    // ลดค่า EXP ที่ได้รับ - ไม่เฟ้อ
    const experienceGain = Math.floor(product.reward / 20);

    // เพิ่มวัตถุดิบ
    const newRawMaterials = { ...(gameState.rawMaterials || {}) };
    newRawMaterials[product.type] = (newRawMaterials[product.type] || 0) + 1;

    // รายได้ไปยังเงินส่วนตัวเท่านั้น ไม่เพิ่มในเงินสะสม
    updateGameState({
      money: newMoney,
      products: newProducts,
      experience: gameState.experience + experienceGain,
      rawMaterials: newRawMaterials
    });
  };

  const startProcessing = (processingOption) => {
    const requiredCount = getRawMaterialCount(processingOption.requiredItem);
    
    if (requiredCount < processingOption.requiredQuantity) {
      playSound(300, 300, 'sawtooth');
      alert(`วัตถุดิบไม่พอ! ต้องการ ${processingOption.requiredQuantity} ชิ้น (มีอยู่ ${requiredCount} ชิ้น)`);
      return;
    }

    playSound(900, 250, 'triangle');

    const newProcessing = {
      id: Date.now(),
      type: processingOption.id,
      name: processingOption.name,
      startTime: Date.now(),
      duration: processingOption.processingTime * 1000,
      sellPrice: processingOption.sellPrice,
      requiredItem: processingOption.requiredItem,
      requiredQuantity: processingOption.requiredQuantity
    };

    // ลดวัตถุดิบ
    const newRawMaterials = { ...(gameState.rawMaterials || {}) };
    newRawMaterials[processingOption.requiredItem] -= processingOption.requiredQuantity;

    updateGameState({
      processingProducts: [...(gameState.processingProducts || []), newProcessing],
      rawMaterials: newRawMaterials
    });
  };

  const collectProcessedProduct = (product) => {
    playSound(1200, 350, 'triangle');
    
    const newMoney = gameState.money + product.sellPrice;
    const newProcessingProducts = gameState.processingProducts.filter(p => p.id !== product.id);
    // ลดค่า EXP ที่ได้รับจากการแปรรูป
    const experienceGain = Math.floor(product.sellPrice / 25);

    // รายได้ไปยังเงินส่วนตัวเท่านั้น ไม่เพิ่มในเงินสะสม
    updateGameState({
      money: newMoney,
      processingProducts: newProcessingProducts,
      experience: gameState.experience + experienceGain
    });
  };

  const upgradeProduction = (productionId) => {
    const currentProductions = gameState.productions || [];
    const existingProduction = currentProductions.find(p => p.id === productionId);
    const currentLevel = existingProduction?.level || 1;
    
    // Limit maximum level to 5 to prevent inflation
    if (currentLevel >= 5) {
      playSound(300, 300, 'sawtooth');
      alert('ระดับการผลิตสูงสุดคือ Lv.5 แล้ว!');
      return;
    }
    
    const upgradeCost = currentLevel * 200; // เพิ่มต้นทุนอัพเกรด

    if (gameState.money < upgradeCost) {
      playSound(300, 300, 'sawtooth');
      alert('เงินไม่พอ! ต้องการ ' + upgradeCost + ' บาท');
      return;
    }

    playSound(1200, 400, 'triangle');

    const newProductions = existingProduction
      ? currentProductions.map(p => 
          p.id === productionId 
            ? { ...p, level: p.level + 1 }
            : p
        )
      : [...currentProductions, { id: productionId, level: 2 }];

    // การอัพเกรดให้ EXP เท่าเดิม - ไม่เฟ้อ
    updateGameState({
      money: gameState.money - upgradeCost,
      productions: newProductions,
      experience: gameState.experience + 15
    });
  };

  const getProgress = (product) => {
    const elapsed = Date.now() - product.startTime;
    return Math.min(100, (elapsed / product.duration) * 100);
  };

  const isReady = (product) => {
    return getProgress(product) >= 100;
  };

  // Update products progress
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      updateGameState({ 
        products: gameState.products,
        processingProducts: gameState.processingProducts 
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState.products, gameState.processingProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <GameHeader gameState={gameState} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
            <House className="mr-3 text-green-600" />
            กิจกรรมการผลิตและอาชีพ
          </h1>
          <Button 
            onClick={onBack} 
            variant="outline" 
            className="px-6 border-green-500 text-green-600 hover:bg-green-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>
        </div>

        {/* แสดงวัตถุดิบที่มี */}
        <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center">
              <Factory className="mr-2" />
              คลังวัตถุดิบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl mb-1">🥬</div>
                <div className="text-sm text-gray-600">ผัก</div>
                <div className="font-bold text-green-600">{getRawMaterialCount('vegetable')} ชิ้น</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-1">🥩</div>
                <div className="text-sm text-gray-600">เนื้อสัตว์</div>
                <div className="font-bold text-orange-600">{getRawMaterialCount('livestock')} ชิ้น</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl mb-1">🍎</div>
                <div className="text-sm text-gray-600">ผลไม้</div>
                <div className="font-bold text-red-600">{getRawMaterialCount('fruit')} ชิ้น</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Production Options */}
          <div className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <Button 
                onClick={() => setShowProcessing(false)}
                className={`${!showProcessing ? 'bg-green-500' : 'bg-gray-300'} text-white`}
              >
                🌱 การผลิต
              </Button>
              <Button 
                onClick={() => setShowProcessing(true)}
                className={`${showProcessing ? 'bg-purple-500' : 'bg-gray-300'} text-white`}
              >
                🏭 การแปรรูป
              </Button>
            </div>

            {!showProcessing ? (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">🏭 กิจกรรมการผลิต</h2>
                {productions.map(production => {
                  const IconComponent = production.icon;
                  const level = getProductionLevel(production.id);
                  const cost = getProductionCost(production.id);
                  const time = getProductionTime(production.id);
                  const reward = getProductionReward(production.id);
                  const profit = reward - cost;
                  const isMaxLevel = level >= 5; // Check if at maximum level
                  
                  return (
                    <Card key={production.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 bg-gradient-to-r ${production.color} rounded-xl flex items-center justify-center shadow-lg`}>
                              <IconComponent className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-800">{production.name}</h3>
                              <p className="text-gray-600 text-sm">{production.description}</p>
                            </div>
                          </div>
                          <Badge className={`font-bold ${isMaxLevel ? 'bg-gradient-to-r from-gold-500 to-yellow-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white`}>
                            Lv.{level} {isMaxLevel && '⭐ MAX'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <div className="text-red-600 font-semibold">ต้นทุน</div>
                            <div className="font-bold">{cost} บาท</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <div className="text-blue-600 font-semibold">เวลา</div>
                            <div className="font-bold">{time} วิ</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <div className="text-green-600 font-semibold">รายได้</div>
                            <div className="font-bold">{reward} บาท</div>
                          </div>
                          <div className="text-center p-2 bg-emerald-50 rounded-lg">
                            <div className="text-emerald-600 font-semibold">กำไร</div>
                            <div className="font-bold text-emerald-700">+{profit} บาท</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => startProduction(production)}
                            disabled={gameState.money < cost}
                            className={`flex-1 bg-gradient-to-r ${production.color} hover:opacity-90 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200`}
                          >
                            🚀 เริ่มผลิต
                          </Button>
                          <Button 
                            onClick={() => upgradeProduction(production.id)}
                            disabled={gameState.money < level * 200 || isMaxLevel}
                            variant="outline"
                            className={`px-4 ${isMaxLevel ? 'border-gray-300 text-gray-400' : 'border-purple-500 text-purple-600 hover:bg-purple-50'}`}
                            title={isMaxLevel ? 'ระดับสูงสุดแล้ว' : ''}
                          >
                            {isMaxLevel ? '✅ MAX' : `⬆️ อัพเกรด (${level * 200}฿)`}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">🏭 การแปรรูปผลผลิต</h2>
                {processingOptions.map(option => (
                  <Card key={option.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${option.color} rounded-xl flex items-center justify-center shadow-lg`}>
                            <Factory className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{option.name}</h3>
                            <p className="text-gray-600 text-sm">{option.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold">
                          <Star className="w-3 h-3 mr-1" />
                          พรีเมี่ยม
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-blue-600 font-semibold">ต้องการ</div>
                          <div className="font-bold">{option.requiredQuantity} ชิ้น</div>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <div className="text-orange-600 font-semibold">เวลา</div>
                          <div className="font-bold">{option.processingTime} วิ</div>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <div className="text-green-600 font-semibold">ราคาขาย</div>
                          <div className="font-bold">{option.sellPrice} บาท</div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => startProcessing(option)}
                        disabled={getRawMaterialCount(option.requiredItem) < option.requiredQuantity}
                        className={`w-full bg-gradient-to-r ${option.color} hover:opacity-90 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200`}
                      >
                        🏭 เริ่มแปรรูป
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Active Productions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {!showProcessing ? '📦 ผลิตภัณฑ์ที่กำลังผลิต' : '🏭 ผลิตภัณฑ์ที่กำลังแปรรูป'}
            </h2>
            
            {(!showProcessing ? !gameState.products || gameState.products.length === 0 : !gameState.processingProducts || gameState.processingProducts.length === 0) ? (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Sun className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {!showProcessing ? 'ยังไม่มีการผลิต' : 'ยังไม่มีการแปรรูป'}
                  </p>
                  <p className="text-gray-400">
                    {!showProcessing ? 'เริ่มต้นด้วยการเลือกกิจกรรมการผลิต' : 'เริ่มต้นด้วยการเลือกการแปรรูป'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {(!showProcessing ? gameState.products : gameState.processingProducts || []).map(product => {
                  const progress = getProgress(product);
                  const ready = isReady(product);
                  
                  return (
                    <Card key={product.id} className={`border-0 shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm ${ready ? 'ring-2 ring-green-400 shadow-green-200' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`text-2xl ${ready ? 'animate-bounce' : ''}`}>
                              {product.name.split(' ')[0]}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800">{product.name}</h3>
                              <p className="text-sm text-gray-600">
                                รางวัล: {!showProcessing ? product.reward : product.sellPrice} บาท
                              </p>
                            </div>
                          </div>
                          {ready && (
                            <Button 
                              onClick={() => !showProcessing ? collectProduct(product) : collectProcessedProduct(product)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-6 shadow-lg transform hover:scale-105 transition-all duration-200"
                            >
                              🎁 เก็บเกี่ยว
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {ready ? '✅ เสร็จแล้ว!' : `⏳ กำลัง${!showProcessing ? 'ผลิต' : 'แปรรูป'}... ${progress.toFixed(1)}%`}
                            </span>
                            {!ready && (
                              <span className="text-gray-500 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {Math.ceil((product.duration - (Date.now() - product.startTime)) / 1000)} วิ
                              </span>
                            )}
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-3 ${ready ? 'bg-green-100' : 'bg-gray-200'}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionGame;
