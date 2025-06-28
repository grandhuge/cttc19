
import { useState } from 'react';

export const useStoreDialogs = () => {
  const [showPromotions, setShowPromotions] = useState(false);
  const [showBestSellers, setShowBestSellers] = useState(false);

  return {
    showPromotions,
    showBestSellers,
    setShowPromotions,
    setShowBestSellers
  };
};
