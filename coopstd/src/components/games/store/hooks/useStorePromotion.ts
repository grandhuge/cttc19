
export const useStorePromotion = (activePromotion: any, gameState: any, updateGameState: any) => {
  const handleSelectPromotion = (promotion: any) => {
    const { storeMoney, activePromotion: currentPromotion, customerSatisfaction } = gameState.storeData;
    
    if (promotion.cost > storeMoney) {
      alert('ทุนร้านไม่เพียงพอสำหรับโปรโมชั่นนี้!');
      return;
    }

    // Check if there's an active promotion that hasn't expired
    if (currentPromotion && currentPromotion.startTime) {
      const elapsed = Date.now() - currentPromotion.startTime;
      const remaining = currentPromotion.effect.duration - elapsed;
      
      if (remaining > 0) {
        alert('มีโปรโมชั่นกำลังดำเนินการอยู่แล้ว กรุณารอให้เสร็จสิ้นก่อน');
        return;
      }
    }

    let newPopularity = gameState.storePopularity;
    let newSatisfaction = customerSatisfaction;
    
    if (promotion.effect.popularity) {
      newPopularity = Math.min(100, gameState.storePopularity + promotion.effect.popularity);
    }
    
    if (promotion.effect.satisfaction) {
      newSatisfaction = Math.min(100, customerSatisfaction + promotion.effect.satisfaction);
    }

    const promotionWithStartTime = { 
      ...promotion, 
      startTime: Date.now() 
    };

    updateGameState({
      storePopularity: newPopularity,
      storeData: {
        ...gameState.storeData,
        storeMoney: storeMoney - promotion.cost,
        customerSatisfaction: Math.round(newSatisfaction * 10) / 10,
        activePromotion: promotionWithStartTime
      }
    });

    alert(
      `🎪 เริ่มโปรโมชั่น: ${promotion.name}\n` +
      `💰 ใช้เงิน: ${promotion.cost.toLocaleString()} บาท\n` +
      `⏰ ระยะเวลา: ${promotion.effect.duration / 1000} วินาที\n\n` +
      `ผลกระทบจะเกิดขึ้นทันทีและคงอยู่ตลอดระยะเวลาโปรโมชั่น!`
    );
  };

  return { handleSelectPromotion };
};
