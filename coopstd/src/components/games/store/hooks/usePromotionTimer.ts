
import { useState, useEffect } from 'react';

export const usePromotionTimer = (activePromotion: any, gameState: any, updateGameState: any) => {
  const [promotionTimeLeft, setPromotionTimeLeft] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (activePromotion && activePromotion.startTime) {
      const updateTimer = () => {
        const elapsed = Date.now() - activePromotion.startTime;
        const remaining = Math.max(0, activePromotion.effect.duration - elapsed);
        setPromotionTimeLeft(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          updateGameState({
            storeData: {
              ...gameState.storeData,
              activePromotion: null
            }
          });
          setPromotionTimeLeft(0);
          clearInterval(timer);
        }
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setPromotionTimeLeft(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activePromotion, gameState.storeData, updateGameState]);

  return promotionTimeLeft;
};
