
export const calculateMaxCustomers = (storeMoney: number, activePromotion: any) => {
  const baseCapacity = 6;
  // ปรับการคำนวณให้สมเหตุสมผลมากขึ้น
  const capitalBonus = Math.floor(storeMoney / 2000) * 1; // ลดโบนัสจากเงินทุน
  let maxCapacity = baseCapacity + capitalBonus;
  
  // ปรับผลกระทบจากโปรโมชั่น
  if (activePromotion && activePromotion.effect.maxCustomers) {
    maxCapacity += Math.min(activePromotion.effect.maxCustomers, 3); // จำกัดไม่ให้เพิ่มเกิน 3 คน
  }
  
  return Math.max(maxCapacity, 6); // ขั้นต่ำ 6 ลูกค้า
};

export const calculateCurrentCustomers = (
  currentCustomers: number, 
  maxCustomers: number, 
  storePopularity: number
) => {
  // ปรับการคำนวณความนิยมให้สมจริงมากขึ้น
  const popularityFactor = Math.max(0.2, Math.min(storePopularity / 100, 0.85)); // จำกัดไม่ให้เกิน 85%
  const targetCustomers = Math.floor(maxCustomers * popularityFactor);
  
  let newCount = currentCustomers;
  const changeChance = 0.25; // ลดโอกาสการเปลี่ยนแปลง
  
  if (newCount < targetCustomers && Math.random() < changeChance) {
    newCount += Math.min(1, targetCustomers - newCount); // ปรับให้เพิ่มทีละ 1 คน
  } else if (newCount > targetCustomers && Math.random() < 0.15) {
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
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime); // ลดระดับเสียง
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  } catch (error) {
    console.log('Audio not supported or failed to play');
  }
};
