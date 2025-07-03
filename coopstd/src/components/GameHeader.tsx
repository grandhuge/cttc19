
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Star } from 'lucide-react';

const GameHeader = ({ gameState }) => {
  // Updated level calculation to match the main page (progressive difficulty)
  const calculateLevel = (experience) => {
    let level = 1;
    let requiredExp = 0;
    
    while (experience >= requiredExp + (level * 1000)) {
      requiredExp += level * 1000;
      level++;
    }
    
    return level;
  };

  // Get level name based on level number
  const getLevelName = (level) => {
    const levelNames = {
      1: 'ผู้เริ่มต้น (Novice)',
      2: 'ผู้ฝึกหัด (Apprentice)',
      3: 'ผู้เรียนรู้เบื้องต้น (Beginner)',
      4: 'ผู้เข้าใจพื้นฐาน (Basic Practitioner)',
      5: 'ผู้ปฏิบัติได้ (Competent)',
      6: 'ผู้ชำนาญเบื้องต้น (Proficient)',
      7: 'ผู้เชี่ยวชาญระดับต้น (Skilled)',
      8: 'ผู้เชี่ยวชาญ (Expert)',
      9: 'ผู้ชำนาญการ (Advanced Expert)',
      10: 'ผู้เชี่ยวชาญขั้นสูง (Senior Expert)',
      11: 'ผู้มีประสบการณ์สูง (Experienced Specialist)',
      12: 'ผู้ชำนาญพิเศษ (Specialist)',
      13: 'ผู้เชี่ยวชาญพิเศษ (Master Specialist)',
      14: 'ผู้เชี่ยวชาญขั้นสูงพิเศษ (Senior Master)',
      15: 'ผู้เชี่ยวชาญระดับสูงสุด (Grandmaster)',
      16: 'ผู้นำสหกรณ์ (Cooperative Leader)',
      17: 'ผู้บริหารสหกรณ์ (Cooperative Manager)',
      18: 'ผู้เชี่ยวชาญนวัตกรรมสหกรณ์ (Innovator)',
      19: 'ผู้เชี่ยวชาญยุทธศาสตร์สหกรณ์ (Strategist)',
      20: 'ผู้ทรงคุณวุฒิสหกรณ์ (Distinguished Expert)'
    };
    
    return levelNames[level] || `ระดับสูง (Level ${level})`;
  };

  // Calculate experience for current level
  const getExperienceForCurrentLevel = (experience) => {
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

  // Generate stars based on level
  const generateStars = (level) => {
    const stars = [];
    const fullStars = Math.min(level, 5); // Max 5 stars displayed
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />);
    }
    
    // Add empty stars if level is less than 5
    for (let i = fullStars; i < 5; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const currentLevel = calculateLevel(gameState.experience);
  const experienceData = getExperienceForCurrentLevel(gameState.experience);
  const levelName = getLevelName(currentLevel);

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-gray-800">สหกรณ์นักเรียน</h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-sm flex items-center space-x-1">
                <span>ระดับ {currentLevel} {levelName}</span>
              </Badge>
              <div className="flex items-center space-x-1">
                {generateStars(currentLevel)}
              </div>
              {currentLevel > 5 && (
                <span className="text-xs text-gray-600">+{currentLevel - 5}</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-800">
                {gameState.money.toLocaleString()} บาท
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">เงินออม:</span>
              <span className="font-semibold text-blue-600">
                {gameState.savingsBalance.toLocaleString()} บาท
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">ความนิยม:</span>
              <span className="font-semibold text-purple-600">
                {gameState.storePopularity}%
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">ประสบการณ์:</span>
              <span className="font-semibold text-green-600">
                {experienceData.current}/{experienceData.needed}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
