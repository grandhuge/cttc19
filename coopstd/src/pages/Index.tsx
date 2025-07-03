import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Store, House, Book, Star, Trophy, HelpCircle, Sparkles } from 'lucide-react';
import ProductionGame from '@/components/games/ProductionGame';
import SavingsGame from '@/components/games/SavingsGame';
import StoreGame from '@/components/games/StoreGame';
import WelfareGame from '@/components/games/WelfareGame';
import GameHeader from '@/components/GameHeader';
import CompletionDialog from '@/components/games/CompletionDialog';
import HelpDialog from '@/components/HelpDialog';

const Index = () => {
  const [currentGame, setCurrentGame] = useState('menu');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [gameState, setGameState] = useState({
    money: 1000,
    products: [],
    productions: [],
    savingsBalance: 0,
    savings: 0,
    lastInterestUpdate: null,
    storePopularity: 0,
    welfarePoints: 0,
    level: 1,
    experience: 0,
    transactionHistory: [],
    // Welfare game persistence
    welfareData: {
      committee: {
        members: 5,
        meetings: 0,
        decisions: []
      },
      welfareProjects: [],
      completedProjects: [],
      memberNeeds: [],
      currentNeed: null
    },
    storeData: {
      products: [
        // Basic stationery
        { id: 1, name: '📝 สมุดโน๊ต', cost: 20, sellPrice: 30, stock: 10, sold: 0 },
        { id: 2, name: '✏️ ดินสอ HB', cost: 5, sellPrice: 8, stock: 20, sold: 0 },
        { id: 3, name: '🖊️ ปากกาลูกลื่น', cost: 8, sellPrice: 12, stock: 25, sold: 0 },
        { id: 4, name: '📐 ไม้บรรทัด 30cm', cost: 10, sellPrice: 15, stock: 15, sold: 0 },
        { id: 5, name: '📚 แฟ้มเอกสาร', cost: 25, sellPrice: 40, stock: 5, sold: 0 },
        { id: 6, name: '🖍️ สีเทียน 12สี', cost: 35, sellPrice: 50, stock: 8, sold: 0 },
        { id: 7, name: '📄 กระดาษ A4', cost: 80, sellPrice: 100, stock: 3, sold: 0 },
        { id: 8, name: '✂️ กรรไกร', cost: 15, sellPrice: 25, stock: 6, sold: 0 },
        
        // Snacks and drinks
        { id: 9, name: '🍪 คุกกี้', cost: 15, sellPrice: 25, stock: 15, sold: 0 },
        { id: 10, name: '🥛 นมกล่อง', cost: 12, sellPrice: 18, stock: 12, sold: 0 },
        { id: 11, name: '🍞 ขนมปังแผ่น', cost: 18, sellPrice: 28, stock: 8, sold: 0 },
        { id: 12, name: '🧃 น้ำผลไม้', cost: 14, sellPrice: 22, stock: 10, sold: 0 },
        { id: 13, name: '🍭 ลูกอม', cost: 3, sellPrice: 5, stock: 30, sold: 0 },
        { id: 14, name: '🍘 ขนมปังกรอบ', cost: 8, sellPrice: 12, stock: 18, sold: 0 },
        { id: 15, name: '🥤 น้ำดื่ม', cost: 6, sellPrice: 10, stock: 20, sold: 0 },
        
        // School supplies
        { id: 16, name: '🎒 กระเป็าใส่ดินสอ', cost: 45, sellPrice: 65, stock: 4, sold: 0 },
        { id: 17, name: '📌 คลิปหนีบกระดาษ', cost: 12, sellPrice: 18, stock: 12, sold: 0 },
        { id: 18, name: '🖇️ ลวดเย็บกระดาษ', cost: 25, sellPrice: 35, stock: 6, sold: 0 },
        { id: 19, name: '📋 แผ่นรองเขียน', cost: 30, sellPrice: 45, stock: 7, sold: 0 },
        { id: 20, name: '🏷️ สติกเกอร์', cost: 20, sellPrice: 30, stock: 10, sold: 0 }
      ],
      storeMoney: 1000,
      dailySales: 0,
      totalProfit: 0,
      customerSatisfaction: 50,
      currentCustomers: 0,
      maxCustomers: 8,
      activePromotion: null
    },
    // Achievement system
    achievements: {
      unlocked: [],
      specialItemsUnlocked: false,
      gameCompleted: false
    }
  });

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

  // New level calculation function (3)
  const calculateLevel = (experience) => {
    let level = 1;
    let requiredExp = 0;
    
    while (experience >= requiredExp + (level * 1000)) {
      requiredExp += level * 1000;
      level++;
    }
    
    return level;
  };

  // Calculate experience needed for next level (3)
  const getExperienceForNextLevel = (experience) => {
    const currentLevel = calculateLevel(experience);
    let totalExpForCurrentLevel = 0;
    
    for (let i = 1; i < currentLevel; i++) {
      totalExpForCurrentLevel += i * 1000;
    }
    
    const experienceInCurrentLevel = experience - totalExpForCurrentLevel;
    const experienceNeededForNextLevel = currentLevel * 1000;
    
    return {
      current: experienceInCurrentLevel,
      needed: experienceNeededForNextLevel,
      level: currentLevel
    };
  };

  // All possible achievements list (2)
  const getAllAchievements = () => [
    {
      id: 'level_master',
      name: '🏆 นักเรียนยอดเยี่ยม',
      description: 'ถึงระดับ 5+',
      unlocked: gameState.achievements.unlocked.includes('level_master'),
      condition: 'ระดับ 5+'
    },
    {
      id: 'popular_store',
      name: '⭐ ร้านค้าดัง',
      description: 'ความนิยมร้าน 80%+',
      unlocked: gameState.achievements.unlocked.includes('popular_store'),
      condition: 'ความนิยม 80%+'
    },
    {
      id: 'savings_expert',
      name: '💰 ผู้เชี่ยวชาญการออม',
      description: 'เงินออม 10,000+',
      unlocked: gameState.achievements.unlocked.includes('savings_expert'),
      condition: 'เงินออม 10,000+'
    },
    {
      id: 'profit_master',
      name: '📈 เซียนกำไร',
      description: 'เงินสะสม 5,000+',
      unlocked: gameState.achievements.unlocked.includes('profit_master'),
      condition: 'เงินสะสม 5,000+'
    },
    {
      id: 'welfare_champion',
      name: '🤝 แชมป์สวัสดิการ',
      description: 'คะแนนสวัสดิการ 100+',
      unlocked: gameState.achievements.unlocked.includes('welfare_champion'),
      condition: 'คะแนน 100+'
    },
    {
      id: 'satisfaction_guru',
      name: '😊 ผู้เชี่ยวชาญความพึงพอใจ',
      description: 'ความพึงพอใจ 95%+',
      unlocked: gameState.achievements.unlocked.includes('satisfaction_guru'),
      condition: 'ความพึงพอใจ 95%+'
    }
  ];

  // Calculate completion percentage (2)
  const calculateCompletionPercentage = () => {
    const currentLevel = calculateLevel(gameState.experience);
    const { storePopularity, savingsBalance, savings, welfarePoints, storeData } = gameState;
    const { customerSatisfaction } = storeData;
    const achievementsCount = gameState.achievements.unlocked.length;

    // Define maximum possible values for percentage calculation
    const maxLevel = 12;
    const maxPopularity = 95;
    const maxSavings = 25000;
    const maxAccumulatedSavings = 15000;
    const maxWelfarePoints = 250;
    const maxSatisfaction = 98;
    const maxAchievements = 6;

    // Calculate weighted percentages
    const levelPercent = Math.min((currentLevel / maxLevel) * 100, 100);
    const popularityPercent = (storePopularity / maxPopularity) * 100;
    const savingsPercent = Math.min((savingsBalance / maxSavings) * 100, 100);
    const accumulatedPercent = Math.min((savings / maxAccumulatedSavings) * 100, 100);
    const welfarePercent = Math.min((welfarePoints / maxWelfarePoints) * 100, 100);
    const satisfactionPercent = (customerSatisfaction / maxSatisfaction) * 100;
    const achievementPercent = (achievementsCount / maxAchievements) * 100;

    // Weighted average (equal weight for all categories)
    const totalPercent = (
      levelPercent + popularityPercent + savingsPercent + 
      accumulatedPercent + welfarePercent + satisfactionPercent + achievementPercent
    ) / 7;

    return Math.round(totalPercent);
  };

  // Check for achievements and special unlocks
  const checkAchievements = () => {
    const currentLevel = calculateLevel(gameState.experience);
    const { storePopularity, savingsBalance, savings, welfarePoints, storeData } = gameState;
    const { customerSatisfaction } = storeData;

    // Define achievement thresholds
    const achievements = [];
    
    if (currentLevel >= 5 && !gameState.achievements.unlocked.includes('level_master')) {
      achievements.push('level_master');
    }
    
    if (storePopularity >= 80 && !gameState.achievements.unlocked.includes('popular_store')) {
      achievements.push('popular_store');
    }
    
    if (savingsBalance >= 10000 && !gameState.achievements.unlocked.includes('savings_expert')) {
      achievements.push('savings_expert');
    }
    
    if (savings >= 5000 && !gameState.achievements.unlocked.includes('profit_master')) {
      achievements.push('profit_master');
    }
    
    if (welfarePoints >= 100 && !gameState.achievements.unlocked.includes('welfare_champion')) {
      achievements.push('welfare_champion');
    }
    
    if (customerSatisfaction >= 95 && !gameState.achievements.unlocked.includes('satisfaction_guru')) {
      achievements.push('satisfaction_guru');
    }

    // Special items unlock condition
    const specialUnlockCondition = (
      currentLevel >= 8 &&
      storePopularity >= 85 &&
      savingsBalance >= 15000 &&
      savings >= 8000 &&
      welfarePoints >= 150 &&
      customerSatisfaction >= 90
    );

    // Game completion condition (very challenging)
    const gameCompletionCondition = (
      currentLevel >= 12 &&
      storePopularity >= 95 &&
      savingsBalance >= 25000 &&
      savings >= 15000 &&
      welfarePoints >= 250 &&
      customerSatisfaction >= 98
    );

    if (achievements.length > 0 || specialUnlockCondition || gameCompletionCondition) {
      setGameState(prev => ({
        ...prev,
        achievements: {
          ...prev.achievements,
          unlocked: [...prev.achievements.unlocked, ...achievements],
          specialItemsUnlocked: prev.achievements.specialItemsUnlocked || specialUnlockCondition,
          gameCompleted: prev.achievements.gameCompleted || gameCompletionCondition
        }
      }));

      if (achievements.length > 0) {
        const achievementNames = {
          'level_master': '🏆 นักเรียนยอดเยี่ยม (ระดับ 5+)',
          'popular_store': '⭐ ร้านค้าดังสุดในโรงเรียน (ความนิยม 80%+)',
          'savings_expert': '💰 ผู้เชี่ยวชาญการออม (เงินออม 10,000+)',
          'profit_master': '📈 เซียนกำไร (เงินสะสม 5,000+)',
          'welfare_champion': '🤝 แชมป์สวัสดิการ (คะแนน 100+)',
          'satisfaction_guru': '😊 ผู้เชี่ยวชาญความพึงพอใจ (95%+)'
        };
        
        playSound(1000, 500, 'triangle'); // Achievement sound
        alert(`🎉 ปลดล็อกความสำเร็จ!\n${achievements.map(a => achievementNames[a]).join('\n')}`);
      }

      if (specialUnlockCondition && !gameState.achievements.specialItemsUnlocked) {
        playSound(1200, 700, 'sawtooth'); // Special unlock sound
        alert('✨ ปลดล็อกไอเทมพิเศษ!\nคุณสามารถเข้าถึงสินค้าและกิจกรรมพิเศษได้แล้ว!');
      }

      if (gameCompletionCondition && !gameState.achievements.gameCompleted) {
        playSound(1500, 1000, 'triangle'); // Completion sound
        setShowCompletionDialog(true);
      }
    }
  };

  useEffect(() => {
    checkAchievements();
  }, [gameState.experience, gameState.storePopularity, gameState.savingsBalance, gameState.savings, gameState.welfarePoints, gameState.storeData.customerSatisfaction]);

  useEffect(() => {
    if (gameState.savingsBalance > 0 && gameState.lastInterestUpdate) {
      const currentTime = Date.now();
      const timeDiff = currentTime - gameState.lastInterestUpdate;
      const intervals = Math.floor(timeDiff / 30000);
      
      if (intervals > 0) {
        const newBalance = gameState.savingsBalance * Math.pow(1.01, intervals);
        setGameState(prev => ({
          ...prev,
          savingsBalance: newBalance,
          lastInterestUpdate: currentTime,
          experience: prev.experience + Math.floor((newBalance - prev.savingsBalance) / 10)
        }));
      }
    } else if (gameState.savingsBalance > 0 && !gameState.lastInterestUpdate) {
      setGameState(prev => ({
        ...prev,
        lastInterestUpdate: Date.now()
      }));
    }
  }, [currentGame]);

  const games = [
    {
      id: 'production',
      title: 'กิจกรรมการผลิตและอาชีพ',
      description: 'ปลูกผัก เลี้ยงสัตว์ และแปรรูปผลิตภัณฑ์',
      icon: House,
      gradient: 'from-emerald-400 to-emerald-600',
      hoverGradient: 'hover:from-emerald-500 hover:to-emerald-700',
      shadow: 'shadow-emerald-200'
    },
    {
      id: 'savings',
      title: 'กิจกรรมออมทรัพย์',
      description: 'ฝากเงิน รับดอกเบี้ย และจัดการการเงิน',
      icon: Coins,
      gradient: 'from-blue-400 to-blue-600',
      hoverGradient: 'hover:from-blue-500 hover:to-blue-700',
      shadow: 'shadow-blue-200'
    },
    {
      id: 'store',
      title: 'ร้านค้าสหกรณ์',
      description: 'จัดการร้านค้า จำหน่ายสินค้า และบริหารสต็อก',
      icon: Store,
      gradient: 'from-purple-400 to-purple-600',
      hoverGradient: 'hover:from-purple-500 hover:to-purple-700',
      shadow: 'shadow-purple-200'
    },
    {
      id: 'welfare',
      title: 'การศึกษาและสวัสดิการ',
      description: 'ประชุมคณะกรรมการ และช่วยเหลือสังคม',
      icon: Book,
      gradient: 'from-orange-400 to-orange-600',
      hoverGradient: 'hover:from-orange-500 hover:to-orange-700',
      shadow: 'shadow-orange-200'
    }
  ];

  const updateGameState = (updates) => {
    setGameState(prev => ({ ...prev, ...updates }));
  };

  const generateStars = (level) => {
    const stars = [];
    const fullStars = Math.min(level, 5);
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />);
    }
    
    for (let i = fullStars; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const handleGameSelect = (gameId) => {
    playSound(600, 150, 'sine'); // Button click sound
    setCurrentGame(gameId);
  };

  const currentLevel = calculateLevel(gameState.experience);
  const expData = getExperienceForNextLevel(gameState.experience);
  const completionPercentage = calculateCompletionPercentage();

  const renderCurrentGame = () => {
    switch (currentGame) {
      case 'production':
        return <ProductionGame gameState={gameState} updateGameState={updateGameState} onBack={() => setCurrentGame('menu')} />;
      case 'savings':
        return <SavingsGame gameState={gameState} updateGameState={updateGameState} onBack={() => setCurrentGame('menu')} />;
      case 'store':
        return <StoreGame gameState={gameState} updateGameState={updateGameState} onBack={() => setCurrentGame('menu')} />;
      case 'welfare':
        return <WelfareGame gameState={gameState} updateGameState={updateGameState} onBack={() => setCurrentGame('menu')} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-100 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full opacity-20 animate-bounce"></div>
              <div className="absolute top-32 right-20 w-16 h-16 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full opacity-20 animate-bounce" style={{animationDelay: '1s'}}></div>
              <div className="absolute bottom-32 right-32 w-12 h-12 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            <GameHeader gameState={gameState} />
            
            <div className="container mx-auto px-4 py-8 relative z-10">
              <div className="text-center mb-8">
                <div className="flex flex-col items-center gap-6 mb-4">
                  {/* Mascot Image */}
                  <div className="relative">
                    <img 
                      src="https://cttc19.onrender.com/coopstd/img/mascot.gif" 
                      alt="นักเรียนต้อนรับ - สหกรณ์นักเรียน" 
                      className="w-32 h-32 md:w-40 md:h-40 rounded-full shadow-2xl border-4 border-white bg-white/90 backdrop-blur-sm hover:scale-105 transition-transform duration-300"
                      style={{
                        filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.15))'
                      }}
                    />
                    <div className="absolute -top-2 -right-2 animate-bounce">
                      <Sparkles className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center gap-4">
                    <div className="relative">
                      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg">
                        🏫 เกมจำลองสหกรณ์นักเรียน
                      </h1>
                      <div className="absolute -top-2 -right-2">
                        <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        playSound(700, 100, 'sine');
                        setShowHelpDialog(true);
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Help
                    </Button>
                  </div>
                </div>
                <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium leading-relaxed">
                  🎮 เรียนรู้การทำงานของสหกรณ์ผ่านเกมสุดเจ๋ง! 
                  <br />
                  💡 พัฒนาทักษะการจัดการเงิน การค้าขาย และการช่วยเหลือสังคม
                </p>
              </div>

              {/* Achievement notifications */}
              {gameState.achievements.specialItemsUnlocked && (
                <div className="mb-6 text-center">
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 text-lg font-bold shadow-lg animate-pulse">
                    ✨ ปลดล็อกไอเทมพิเศษแล้ว! ✨
                  </Badge>
                </div>
              )}

              {gameState.achievements.gameCompleted && (
                <div className="mb-6 text-center">
                  <Badge className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white px-8 py-4 text-2xl font-bold shadow-xl animate-bounce">
                    🏆 แชมป์สหกรณ์นักเรียน! 🏆
                  </Badge>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
                {games.map((game) => {
                  const IconComponent = game.icon;
                  return (
                    <Card key={game.id} className="group relative overflow-hidden border-0 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 bg-white/90 backdrop-blur-sm">
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      <CardHeader className="text-center relative z-10 pb-4">
                        <div className={`w-20 h-20 bg-gradient-to-br ${game.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${game.shadow} shadow-lg group-hover:shadow-xl transform group-hover:rotate-6 transition-all duration-300`}>
                          <IconComponent className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                          {game.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center relative z-10">
                        <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                          {game.description}
                        </p>
                        <Button 
                          onClick={() => handleGameSelect(game.id)}
                          className={`w-full bg-gradient-to-r ${game.gradient} ${game.hoverGradient} text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg`}
                        >
                          🚀 เริ่มเล่น
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
                {/* Player Stats */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold flex items-center">
                      📊 สถิติของคุณ
                      <Sparkles className="ml-2 w-5 h-5 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">ระดับ:</span>
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-2 font-bold">
                            {currentLevel}
                          </Badge>
                          <div className="flex items-center space-x-1">
                            {generateStars(currentLevel)}
                          </div>
                          {currentLevel > 5 && (
                            <span className="text-sm text-purple-600 font-bold">+{currentLevel - 5}</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-700">ประสบการณ์:</span>
                          <span className="font-bold text-purple-600">{expData.current.toLocaleString()}/{expData.needed.toLocaleString()}</span>
                        </div>
                        <Progress value={(expData.current / expData.needed) * 100} className="h-3 bg-gray-200">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"></div>
                        </Progress>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-gray-700">ความสำเร็จ:</span>
                          <span className="font-bold text-purple-600 text-lg">{completionPercentage}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-4 bg-gray-200">
                          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full transition-all duration-300"></div>
                        </Progress>
                        <div className="text-sm text-gray-500 mt-2 text-center font-medium">
                          {completionPercentage === 100 ? '🏆 เสร็จสมบูรณ์!' : '🎯 เป้าหมายสู่ความเป็นเลิศ'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">ความนิยมร้านค้า:</span>
                        <span className="font-bold text-purple-600">{gameState.storePopularity}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">เงินสะสม:</span>
                        <span className="text-green-600 font-bold text-lg">{gameState.savings.toLocaleString()} บาท</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-t-lg">
                    <CardTitle className="text-xl font-bold flex items-center">
                      <Trophy className="mr-2" />
                      ภารกิจความสำเร็จ
                      <Sparkles className="ml-2 w-5 h-5 animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {getAllAchievements().map((achievement, index) => (
                        <div key={achievement.id} className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                          achievement.unlocked 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}>
                          <div className="flex items-center space-x-3">
                            <span className={`text-2xl ${achievement.unlocked ? 'animate-bounce' : ''}`}>
                              {achievement.unlocked ? '✅' : '⭕'}
                            </span>
                            <div>
                              <div className={`text-sm font-bold ${achievement.unlocked ? 'text-green-800' : 'text-gray-600'}`}>
                                {achievement.name}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                {achievement.condition}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {gameState.achievements.specialItemsUnlocked && (
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <span className="text-2xl animate-pulse">✨</span>
                          <div className="text-sm font-bold text-yellow-800">
                            ไอเทมพิเศษปลดล็อกแล้ว
                          </div>
                        </div>
                      )}
                      
                      {gameState.achievements.gameCompleted && (
                        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <span className="text-2xl animate-bounce">🏆</span>
                          <div className="text-sm font-bold text-purple-800">
                            แชมป์สหกรณ์นักเรียน
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dialogs */}
              <CompletionDialog 
                isOpen={showCompletionDialog}
                onClose={() => setShowCompletionDialog(false)}
              />

              <HelpDialog
                isOpen={showHelpDialog}
                onClose={() => setShowHelpDialog(false)}
              />
            </div>
          </div>
        );
    }
  };

  return renderCurrentGame();
};

export default Index;
