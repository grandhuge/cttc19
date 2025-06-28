
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { House, Sprout, Beef, Apple, Droplets, Sun, Clock, ArrowLeft, Factory, ChefHat } from 'lucide-react';
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
      baseTime: 30,
      baseReward: 50,
      baseCost: 20,
      color: 'from-green-400 to-green-600',
      rawMaterial: 'vegetables'
    },
    {
      id: 'livestock',
      name: '🐄 เลี้ยงสัตว์',
      description: 'เลี้ยงสัตว์ให้ผลผลิต',
      icon: Beef,
      baseTime: 60,
      baseReward: 80,
      baseCost: 40,
      color: 'from-orange-400 to-orange-600',
      rawMaterial: 'meat'
    },
    {
      id: 'fruit',
      name: '🍎 ปลูกผลไม้',
      description: 'ปลูกผลไม้หวานๆ',
      icon: Apple,
      baseTime: 45,
      baseReward: 65,
      baseCost: 30,
      color: 'from-red-400 to-red-600',
      rawMaterial: 'fruits'
    }
  ];

  const processingOptions = [
    {
      id: 'vegetable_salad',
      name: '🥗 สลัดผัก',
      description: 'แปรรูปผักเป็นสลัด',
      icon: ChefHat,
      requiredMaterial: 'vegetables',
      requiredAmount: 3,
      processingTime: 20,
      outputValue: 200,
      processingCost: 30,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'meat_jerky',
      name: '🥩 เนื้อแห้ง',
      description: 'แปรรูปเนื้อเป็นเนื้อแห้ง',
      icon: Factory,
      requiredMaterial: 'meat',
      requiredAmount: 2,
      processingTime: 40,
      outputValue: 300,
      processingCost: 50,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'fruit_juice',
      name: '🧃 น้ำผลไม้',
      description: 'แปรรูปผลไม้เป็นน้ำผลไม้',
      icon: Droplets,
      requiredMaterial: 'fruits',
      requiredAmount: 4,
      processingTime: 25,
      outputValue: 250,
      processingCost: 40,
      color: 'from-red-500 to-pink-500'
    }
  ];

  const getProductionLevel = (id) => {
    const production = gameState.productions?.find(p => p.id === id);
    return production?.level || 1;
  };

  // ปรับปรุงสูตรการคำนวณให้สมเหตุสมผล
  const getProductionCost = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    // ปรับสูตรให้ต้นทุนเพิ่มขึ้นแบบเชิงเส้นมากกว่า
    return Math.floor(baseProduction.baseCost * (1 + (level - 1) * 0.3));
  };

  const getProductionTime = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    // เวลาลดลงได้แต่ไม่เกิน 50% ของเวลาเริ่มต้น
    const reduction = Math.min((level - 1) * 3, baseProduction.baseTime * 0.5);
    return Math.max(baseProduction.baseTime * 0.5, baseProduction.baseTime - reduction);
  };

  const getProductionReward = (id) => {
    const baseProduction = productions.find(p => p.id === id);
    const level = getProductionLevel(id);
    const cost = getProductionCost(id);
    // ปรับให้กำไรเป็น 60-80% ของต้นทุน เพื่อให้คุ้มค่าการลงทุนเสมอ
    const profitMargin = 0.6 + (level - 1) * 0.02; // เริ่มที่ 60% และเพิ่มขึ้น 2% ต่อเลเวล
    return Math.floor(cost * (1 + profitMargin));
  };

  // ฟังก์ชั่นสำหรับจัดการวัตถุดิบ
  const getRawMaterialCount = (materialType) => {
    return gameState.rawMaterials?.[materialType] || 0;
  };

  const addRawMaterial = (materialType, amount) => {
    const currentMaterials = gameState.rawMaterials || {};
    const updatedMaterials = {
      ...currentMaterials,
      [materialType]: (currentMaterials[materialType] || 0) + amount
    };
    
    updateGameState({
      rawMaterials: updatedMaterials
    });
  };

  const useRawMaterial = (materialType, amount) => {
    const currentMaterials = gameState.rawMaterials || {};
    const currentAmount = currentMaterials[materialType] || 0;
    
    if (currentAmount >= amount) {
      const updatedMaterials = {
        ...currentMaterials,
        [materialType]: currentAmount - amount
      };
      
      updateGameState({
        rawMaterials: updatedMaterials
      });
      return true;
    }
    return false;
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
      cost: cost,
      rawMaterial: productionType.rawMaterial
    };

    updateGameState({
      money: gameState.money - cost,
      products: [...(gameState.products || []), newProduction]
    });

    setSelectedProduction(null);
  };

  const collectProduct = (product) => {
    playSound(1000, 300, 'triangle');
    
    const profit = product.reward - product.cost;
    const newMoney = gameState.money + product.reward;
    const newProducts = gameState.products.filter(p => p.id !== product.id);
    const experienceGain = Math.floor(profit / 10); // ประสบการณ์จากกำไรสุทธิ

    // เพิ่มวัตถุดิบจากการเก็บเกี่ยว
    const rawMaterialAmount = Math.floor(Math.random() * 3) + 2; // 2-4 ชิ้น
    addRawMaterial(product.rawMaterial, rawMaterialAmount);

    updateGameState({
      money: newMoney,
      products: newProducts,
      experience: gameState.experience + experienceGain,
      savings: gameState.savings + profit // บันทึกกำไรสุทธิ
    });

    alert(`🎉 เก็บเกี่ยวสำเร็จ!\n💰 ได้เงิน: ${product.reward} บาท\n📈 กำไร: ${profit} บาท\n🥬 วัตถุดิบ: ${rawMaterialAmount} ชิ้น`);
  };

  const startProcessing = (processingOption) => {
    const requiredAmount = processingOption.requiredAmount;
    const currentAmount = getRawMaterialCount(processingOption.requiredMaterial);
    const totalCost = processingOption.processingCost;

    if (currentAmount < requiredAmount) {
      playSound(300, 300, 'sawtooth');
      alert(`วัตถุดิบไม่พอ! ต้องการ ${requiredAmount} ชิ้น (มีอยู่ ${currentAmount} ชิ้น)`);
      return;
    }

    if (gameState.money < totalCost) {
      playSound(300, 300, 'sawtooth');
      alert(`เงินไม่พอ! ต้องการ ${totalCost} บาท`);
      return;
    }

    if (useRawMaterial(processingOption.requiredMaterial, requiredAmount)) {
      playSound(1200, 400, 'triangle');

      const newProcessing = {
        id: Date.now(),
        type: processingOption.id,
        name: processingOption.name,
        startTime: Date.now(),
        duration: processingOption.processingTime * 1000,
        outputValue: processingOption.outputValue,
        cost: totalCost
      };

      updateGameState({
        money: gameState.money - totalCost,
        processedProducts: [...(gameState.processedProducts || []), newProcessing]
      });

      alert(`🏭 เริ่มแปรรูป ${processingOption.name}!`);
    }
  };

  const collectProcessedProduct = (processedProduct) => {
    playSound(1200, 500, 'triangle');
    
    const profit = processedProduct.outputValue - processedProduct.cost;
    const newMoney = gameState.money + processedProduct.outputValue;
    const newProcessedProducts = (gameState.processedProducts || []).filter(p => p.id !== processedProduct.id);
    const experienceGain = Math.floor(profit / 8); // ประสบการณ์มากกว่าเพราะเป็นการแปรรูป

    updateGameState({
      money: newMoney,
      processedProducts: newProcessedProducts,
      experience: gameState.experience + experienceGain,
      savings: gameState.savings + profit
    });

    alert(`✨ แปรรูปสำเร็จ!\n💰 ได้เงิน: ${processedProduct.outputValue} บาท\n📈 กำไร: ${profit} บาท`);
  };

  const upgradeProduction = (productionId) => {
    const currentProductions = gameState.productions || [];
    const existingProduction = currentProductions.find(p => p.id === productionId);
    const currentLevel = existingProduction?.level || 1;
    // ปรับสูตรค่าอัพเกรดให้สมเหตุสมผล
    const upgradeCost = currentLevel * 150 + 50; // เริ่มที่ 200, 350, 500, ...

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

    updateGameState({
      money: gameState.money - upgradeCost,
      productions: newProductions,
      experience: gameState.experience + 30
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
        processedProducts: gameState.processedProducts
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameState.products, gameState.processedProducts]);

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

        {/* Raw Materials Inventory */}
        <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800 flex items-center">
              📦 คลังวัตถุดิบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl mb-2">🥬</div>
                <div className="font-bold text-green-700">ผัก: {getRawMaterialCount('vegetables')} ชิ้น</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl mb-2">🥩</div>
                <div className="font-bold text-orange-700">เนื้อ: {getRawMaterialCount('meat')} ชิ้น</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-2xl mb-2">🍎</div>
                <div className="font-bold text-red-700">ผลไม้: {getRawMaterialCount('fruits')} ชิ้น</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Production Options */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏭 กิจกรรมการผลิต</h2>
            
            {productions.map(production => {
              const IconComponent = production.icon;
              const level = getProductionLevel(production.id);
              const cost = getProductionCost(production.id);
              const time = getProductionTime(production.id);
              const reward = getProductionReward(production.id);
              const profit = reward - cost;
              
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
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                        Lv.{level}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-red-600 font-semibold">ต้นทุน</div>
                        <div className="font-bold">{cost} บาท</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-blue-600 font-semibold">เวลา</div>
                        <div className="font-bold">{Math.round(time)} วิ</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600 font-semibold">รายได้</div>
                        <div className="font-bold">{reward} บาท</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-purple-600 font-semibold">กำไรสุทธิ</div>
                        <div className="font-bold text-green-600">+{profit} บาท</div>
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
                        disabled={gameState.money < (level * 150 + 50)}
                        variant="outline"
                        className="px-4 border-purple-500 text-purple-600 hover:bg-purple-50"
                      >
                        ⬆️ อัพเกรด ({level * 150 + 50}฿)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Processing Options */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🏭 การแปรรูปผลผลิต</h2>
            
            {processingOptions.map(processing => {
              const IconComponent = processing.icon;
              const canProcess = getRawMaterialCount(processing.requiredMaterial) >= processing.requiredAmount;
              const profit = processing.outputValue - processing.processingCost;
              
              return (
                <Card key={processing.id} className={`border-0 shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm ${canProcess ? 'hover:shadow-xl' : 'opacity-60'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${processing.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{processing.name}</h3>
                          <p className="text-gray-600 text-sm">{processing.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-blue-600 font-semibold">วัตถุดิบ</div>
                        <div className="font-bold">{processing.requiredAmount} ชิ้น</div>
                        <div className="text-xs text-gray-500">มี: {getRawMaterialCount(processing.requiredMaterial)}</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-orange-600 font-semibold">ค่าแปรรูป</div>
                        <div className="font-bold">{processing.processingCost} บาท</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-green-600 font-semibold">มูลค่าผลิตภัณฑ์</div>
                        <div className="font-bold">{processing.outputValue} บาท</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-purple-600 font-semibold">กำไรสุทธิ</div>
                        <div className="font-bold text-green-600">+{profit} บาท</div>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => startProcessing(processing)}
                      disabled={!canProcess || gameState.money < processing.processingCost}
                      className={`w-full bg-gradient-to-r ${processing.color} hover:opacity-90 text-white font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 disabled:transform-none disabled:opacity-50`}
                    >
                      🏭 เริ่มแปรรูป ({processing.processingTime} วิ)
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Active Productions & Processed Products */}
          <div className="space-y-6">
            {/* Raw Production */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📦 ผลิตภัณฑ์ดิบ</h2>
              
              {(!gameState.products || gameState.products.length === 0) ? (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <Sun className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">ยังไม่มีการผลิต</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {gameState.products.map(product => {
                    const progress = getProgress(product);
                    const ready = isReady(product);
                    
                    return (
                      <Card key={product.id} className={`border-0 shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm ${ready ? 'ring-2 ring-green-400' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xl ${ready ? 'animate-bounce' : ''}`}>
                                {product.name.split(' ')[0]}
                              </span>
                              <div>
                                <h4 className="font-bold text-sm">{product.name}</h4>
                                <p className="text-xs text-gray-600">กำไร: {product.reward - product.cost} บาท</p>
                              </div>
                            </div>
                            {ready && (
                              <Button 
                                onClick={() => collectProduct(product)}
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
                              >
                                🎁 เก็บ
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{ready ? '✅ เสร็จแล้ว!' : `⏳ ${progress.toFixed(1)}%`}</span>
                              {!ready && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {Math.ceil((product.duration - (Date.now() - product.startTime)) / 1000)} วิ
                                </span>
                              )}
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Processed Products */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ ผลิตภัณฑ์แปรรูป</h2>
              
              {(!gameState.processedProducts || gameState.processedProducts.length === 0) ? (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="text-center py-8">
                    <Factory className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">ยังไม่มีการแปรรูป</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {gameState.processedProducts.map(processed => {
                    const progress = getProgress(processed);
                    const ready = isReady(processed);
                    
                    return (
                      <Card key={processed.id} className={`border-0 shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm ${ready ? 'ring-2 ring-purple-400' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`text-xl ${ready ? 'animate-bounce' : ''}`}>
                                {processed.name.split(' ')[0]}
                              </span>
                              <div>
                                <h4 className="font-bold text-sm">{processed.name}</h4>
                                <p className="text-xs text-gray-600">กำไร: {processed.outputValue - processed.cost} บาท</p>
                              </div>
                            </div>
                            {ready && (
                              <Button 
                                onClick={() => collectProcessedProduct(processed)}
                                size="sm"
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                              >
                                ✨ เก็บ
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{ready ? '✅ แปรรูปเสร็จ!' : `🏭 ${progress.toFixed(1)}%`}</span>
                              {!ready && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {Math.ceil((processed.duration - (Date.now() - processed.startTime)) / 1000)} วิ
                                </span>
                              )}
                            </div>
                            <Progress value={progress} className="h-2" />
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
    </div>
  );
};

export default ProductionGame;
