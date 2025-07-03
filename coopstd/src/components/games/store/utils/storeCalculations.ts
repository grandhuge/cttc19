
export const calculateMaxCustomers = (storeMoney: number, activePromotion: any) => {
  const baseCapacity = 5;
  const capitalBonus = Math.floor(storeMoney / 1000) * 2;
  let maxCapacity = baseCapacity + capitalBonus;
  
  // Apply promotion effects immediately and permanently
  if (activePromotion && activePromotion.effect.maxCustomers) {
    maxCapacity += activePromotion.effect.maxCustomers;
  }
  
  return Math.max(maxCapacity, 5); // Minimum 5 customers
};

export const calculateCurrentCustomers = (
  currentCustomers: number, 
  maxCustomers: number, 
  storePopularity: number
) => {
  const popularityFactor = Math.max(0.1, storePopularity / 100);
  const targetCustomers = Math.floor(maxCustomers * popularityFactor);
  
  let newCount = currentCustomers;
  const changeChance = 0.3;
  
  if (newCount < targetCustomers && Math.random() < changeChance) {
    newCount += Math.min(2, targetCustomers - newCount);
  } else if (newCount > targetCustomers && Math.random() < 0.2) {
    newCount -= 1;
  }
  
  return Math.max(0, Math.min(newCount, maxCustomers));
};

export const playSound = (type: string) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass && type === 'sale') {
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (error) {
    console.log('Audio not supported or failed to play');
  }
};

export const getBaseProducts = () => [
  { id: 1, name: '📚 สมุดจดบันทึก', cost: 15, sellPrice: 25, stock: 10, sold: 0 },
  { id: 2, name: '✏️ ดินสอ HB', cost: 8, sellPrice: 12, stock: 20, sold: 0 },
  { id: 3, name: '🖊️ ปากกา', cost: 12, sellPrice: 18, stock: 15, sold: 0 },
  { id: 4, name: '📐 ไม้บรรทัด', cost: 20, sellPrice: 30, stock: 8, sold: 0 },
  { id: 5, name: '🗂️ แฟ้มใส่เอกสาร', cost: 25, sellPrice: 40, stock: 12, sold: 0 },
  { id: 6, name: '🎒 กระเป๋าใส่ดินสอ', cost: 80, sellPrice: 120, stock: 5, sold: 0 },
  { id: 7, name: '📋 คลิปบอร์ด', cost: 35, sellPrice: 50, stock: 6, sold: 0 },
  { id: 8, name: '🖍️ สีเทียน', cost: 30, sellPrice: 45, stock: 10, sold: 0 },
  { id: 9, name: '📎 คลิปหนีบกระดาษ', cost: 5, sellPrice: 8, stock: 30, sold: 0 },
  { id: 10, name: '✂️ กรรไกร', cost: 40, sellPrice: 60, stock: 4, sold: 0 },
  { id: 11, name: '🧮 เครื่องคิดเลข', cost: 150, sellPrice: 220, stock: 3, sold: 0 },
  { id: 12, name: '📏 องศา', cost: 18, sellPrice: 28, stock: 8, sold: 0 },
  { id: 13, name: '🖇️ ลวดเย็บกระดาษ', cost: 10, sellPrice: 15, stock: 25, sold: 0 },
  { id: 14, name: '🏷️ สติกเกอร์', cost: 12, sellPrice: 20, stock: 15, sold: 0 },
  { id: 15, name: '📌 หมุดติดป้าย', cost: 8, sellPrice: 12, stock: 20, sold: 0 },
  { id: 16, name: '🗃️ กล่องเก็บเอกสาร', cost: 60, sellPrice: 90, stock: 4, sold: 0 },
  { id: 17, name: '📊 กระดาษกราฟ', cost: 15, sellPrice: 25, stock: 12, sold: 0 },
  { id: 18, name: '🔖 ที่คั่นหนังสือ', cost: 6, sellPrice: 10, stock: 18, sold: 0 },
  { id: 19, name: '🖨️ กระดาษ A4', cost: 25, sellPrice: 35, stock: 20, sold: 0 },
  { id: 20, name: '🎨 สีน้ำ', cost: 45, sellPrice: 70, stock: 6, sold: 0 }
];
