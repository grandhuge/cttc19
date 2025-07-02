import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Coins, ArrowLeft, TrendingUp, PiggyBank } from 'lucide-react';
import GameHeader from '@/components/GameHeader';

const SavingsGame = ({ gameState, updateGameState, onBack }) => {
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

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

  // Calculate compound interest based on real time
  const calculateCurrentBalance = () => {
    if (!gameState.lastInterestUpdate || gameState.savingsBalance === 0) {
      return gameState.savingsBalance;
    }

    const currentTime = Date.now();
    const timeDiff = currentTime - gameState.lastInterestUpdate;
    const intervals = Math.floor(timeDiff / 30000); // 30 seconds intervals
    
    if (intervals > 0) {
      // Compound interest calculation: P(1 + r)^n
      const newBalance = gameState.savingsBalance * Math.pow(1.01, intervals);
      return newBalance;
    }
    
    return gameState.savingsBalance;
  };

  // Update balance when component mounts or when needed
  useEffect(() => {
    const currentBalance = calculateCurrentBalance();
    if (Math.abs(currentBalance - gameState.savingsBalance) > 0.01) {
      const interestEarned = currentBalance - gameState.savingsBalance;
      
      // Add interest transaction to persistent history
      const newTransaction = {
        id: Date.now(),
        type: 'interest',
        amount: interestEarned,
        time: new Date().toLocaleTimeString('th-TH'),
        balance: currentBalance
      };
      
      updateGameState({ 
        savingsBalance: currentBalance,
        lastInterestUpdate: Date.now(),
        experience: gameState.experience + Math.floor(interestEarned / 10),
        transactionHistory: [...(gameState.transactionHistory || []), newTransaction]
      });
    }
  }, []);

  // Real-time interest calculation interval (for display purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentBalance = calculateCurrentBalance();
      if (Math.abs(currentBalance - gameState.savingsBalance) > 0.01) {
        const interestEarned = currentBalance - gameState.savingsBalance;
        
        // Add interest transaction to persistent history
        const newTransaction = {
          id: Date.now(),
          type: 'interest',
          amount: interestEarned,
          time: new Date().toLocaleTimeString('th-TH'),
          balance: currentBalance
        };
        
        playSound(900, 150, 'triangle'); // Interest earned sound
        
        updateGameState({ 
          savingsBalance: currentBalance,
          lastInterestUpdate: Date.now(),
          experience: gameState.experience + Math.floor(interestEarned / 10),
          transactionHistory: [...(gameState.transactionHistory || []), newTransaction]
        });
      }
    }, 1000); // Check every second for smooth updates

    return () => clearInterval(interval);
  }, [gameState.savingsBalance, gameState.lastInterestUpdate]);

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      playSound(300, 300, 'sawtooth'); // Error sound
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    if (amount > gameState.money) {
      playSound(300, 300, 'sawtooth'); // Error sound
      alert('เงินไม่พอ! คุณมีเงินเพียง ' + gameState.money + ' บาท');
      return;
    }

    playSound(800, 250, 'sine'); // Deposit sound

    // Update balance with current interest before deposit
    const currentBalance = calculateCurrentBalance();
    const newSavingsBalance = currentBalance + amount;
    const newMoney = gameState.money - amount;
    
    // Add deposit transaction to persistent history
    const newTransaction = {
      id: Date.now(),
      type: 'deposit',
      amount: amount,
      time: new Date().toLocaleTimeString('th-TH'),
      balance: newSavingsBalance
    };

    updateGameState({ 
      savingsBalance: newSavingsBalance,
      money: newMoney,
      lastInterestUpdate: Date.now(),
      experience: gameState.experience + Math.floor(amount / 10),
      transactionHistory: [...(gameState.transactionHistory || []), newTransaction]
    });

    setDepositAmount('');
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      playSound(300, 300, 'sawtooth'); // Error sound
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    // Update balance with current interest before withdrawal
    const currentBalance = calculateCurrentBalance();
    
    if (amount > currentBalance) {
      playSound(300, 300, 'sawtooth'); // Error sound
      alert('เงินออมไม่พอ! คุณมีเงินออมเพียง ' + currentBalance.toFixed(2) + ' บาท');
      return;
    }

    playSound(600, 250, 'sine'); // Withdraw sound

    const newSavingsBalance = currentBalance - amount;
    const newMoney = gameState.money + amount;
    
    // Add withdrawal transaction to persistent history
    const newTransaction = {
      id: Date.now(),
      type: 'withdraw',
      amount: amount,
      time: new Date().toLocaleTimeString('th-TH'),
      balance: newSavingsBalance
    };

    updateGameState({ 
      savingsBalance: newSavingsBalance,
      money: newMoney,
      lastInterestUpdate: Date.now(),
      transactionHistory: [...(gameState.transactionHistory || []), newTransaction]
    });

    setWithdrawAmount('');
  };

  const savingsGoals = [
    { amount: 1000, reward: 100, title: 'นักออมมือใหม่' },
    { amount: 5000, reward: 500, title: 'นักออมเก่ง' },
    { amount: 10000, reward: 1000, title: 'นักออมมืออาชีพ' },
    { amount: 20000, reward: 2000, title: 'เซียนการออม' }
  ];

  const currentBalance = calculateCurrentBalance();
  const currentGoal = savingsGoals.find(goal => currentBalance < goal.amount);
  const progressPercentage = currentGoal ? (currentBalance / currentGoal.amount) * 100 : 100;

  // Get transaction history from gameState (persistent)
  const transactions = gameState.transactionHistory || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <GameHeader gameState={gameState} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center">
            <Coins className="mr-3 text-blue-600" />
            กิจกรรมออมทรัพย์
          </h1>
          <Button 
            onClick={onBack} 
            variant="outline" 
            className="px-6 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับหน้าหลัก
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Savings Actions */}
          <div className="lg:col-span-1">
            <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-center text-xl font-bold flex items-center justify-center">
                  <PiggyBank className="mr-2" />
                  💰 ยอดเงินออมปัจจุบัน
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center p-6">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  {currentBalance.toLocaleString('th-TH', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} บาท
                </div>
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  🔄 ดอกเบี้ยทบต้นอัตโนมัติทุก 30 วินาที (1%)
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
                <CardTitle className="font-bold">💸 ฝากเงิน</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    type="number"
                    placeholder="จำนวนเงินที่ต้องการฝาก"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="text-center border-2 border-green-200 focus:border-green-400"
                  />
                  <Button 
                    onClick={handleDeposit}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 shadow-lg transform hover:scale-105 transition-all duration-200"
                    disabled={!depositAmount || gameState.money === 0}
                  >
                    💰 ฝากเงิน
                  </Button>
                  <div className="text-xs text-gray-500 text-center bg-green-50 p-2 rounded">
                    ✨ ได้รับดอกเบี้ยทบต้น 1% ทุก 30 วินาที
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="font-bold">💳 ถอนเงิน</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Input
                    type="number"
                    placeholder="จำนวนเงินที่ต้องการถอน"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="text-center border-2 border-red-200 focus:border-red-400"
                  />
                  <Button 
                    onClick={handleWithdraw}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-3 shadow-lg transform hover:scale-105 transition-all duration-200"
                    disabled={!withdrawAmount || currentBalance === 0}
                  >
                    🏧 ถอนเงิน
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Goals and Transactions */}
          <div className="lg:col-span-2">
            {/* Savings Goals */}
            <Card className="mb-6 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="font-bold text-xl">🎯 เป้าหมายการออม</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {currentGoal ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-lg text-gray-800">{currentGoal.title}</span>
                      <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {currentBalance.toFixed(0)} / {currentGoal.amount.toLocaleString()} บาท
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-4 mb-4 bg-gray-200">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"></div>
                    </Progress>
                    <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">
                        เหลืออีก {(currentGoal.amount - currentBalance).toFixed(0)} บาท 
                      </div>
                      <div className="text-sm text-gray-600">
                        จะได้รับรางวัล {currentGoal.reward} บาท! 🎁
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-2xl font-bold text-green-600 mb-2">ยินดีด้วย!</div>
                    <div className="text-gray-600">คุณทำเป้าหมายการออมครบทุกข้อแล้ว</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="font-bold text-xl flex items-center">
                  <TrendingUp className="mr-2" />
                  📊 ประวัติการทำรายการ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <PiggyBank className="w-20 h-20 mx-auto mb-4 opacity-30" />
                    <p className="text-xl font-medium mb-2">ยังไม่มีรายการทำเงิน</p>
                    <p className="text-sm">เริ่มต้นด้วยการฝากเงินครั้งแรก</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transactions.slice(-10).reverse().map((transaction) => (
                      <div key={transaction.id} className={`flex justify-between items-center p-4 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${
                        transaction.type === 'deposit' ? 'bg-green-50 border border-green-200' :
                        transaction.type === 'withdraw' ? 'bg-red-50 border border-red-200' :
                        'bg-blue-50 border border-blue-200'
                      }`}>
                        <div>
                          <div className="font-bold text-lg">
                            {transaction.type === 'deposit' && '💰 ฝากเงิน'}
                            {transaction.type === 'withdraw' && '💸 ถอนเงิน'}
                            {transaction.type === 'interest' && '📈 ดอกเบี้ยทบต้น'}
                          </div>
                          <div className="text-sm text-gray-600">{transaction.time}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            transaction.type === 'withdraw' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {transaction.type === 'withdraw' ? '-' : '+'}
                            {transaction.amount.toFixed(2)} บาท
                          </div>
                          <div className="text-sm text-gray-600">
                            คงเหลือ: {transaction.balance.toFixed(2)} บาท
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsGame;
