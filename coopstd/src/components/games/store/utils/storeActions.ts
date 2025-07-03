
export const createStoreActions = (gameState: any, updateGameState: any) => {
  const addCapitalToStore = () => {
    const amount = prompt('ใส่จำนวนเงินที่ต้องการเพิ่มทุนให้ร้าน (บาท):');
    const capitalAmount = parseInt(amount || '0');
    
    if (isNaN(capitalAmount) || capitalAmount <= 0) {
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    if (capitalAmount > gameState.money) {
      alert(`เงินส่วนตัวไม่พอ! มีอยู่ ${gameState.money.toLocaleString()} บาท`);
      return;
    }
    
    updateGameState({
      money: gameState.money - capitalAmount,
      storeData: {
        ...gameState.storeData,
        storeMoney: gameState.storeData.storeMoney + capitalAmount
      }
    });
    
    alert(`เพิ่มทุนร้านสำเร็จ! เพิ่ม ${capitalAmount.toLocaleString()} บาท\nทุนร้านปัจจุบัน: ${(gameState.storeData.storeMoney + capitalAmount).toLocaleString()} บาท`);
  };

  const withdrawCapital = () => {
    const maxWithdraw = Math.floor(gameState.storeData.storeMoney * 0.2);
    if (maxWithdraw <= 0) {
      alert('ทุนร้านไม่เพียงพอสำหรับการถอน (ต้องมีทุนอย่างน้อย 5 บาท)');
      return;
    }

    const amount = prompt(`ใส่จำนวนเงินที่ต้องการถอนทุนจากร้าน (สูงสุด ${maxWithdraw.toLocaleString()} บาท):`);
    const withdrawAmount = parseInt(amount || '0');
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }
    
    if (withdrawAmount > maxWithdraw) {
      alert(`สามารถถอนได้สูงสุด ${maxWithdraw.toLocaleString()} บาท (20% ของทุนร้าน)`);
      return;
    }
    
    updateGameState({
      money: gameState.money + withdrawAmount,
      storeData: {
        ...gameState.storeData,
        storeMoney: gameState.storeData.storeMoney - withdrawAmount
      }
    });
    
    alert(`ถอนทุนสำเร็จ! ได้เงิน ${withdrawAmount.toLocaleString()} บาท\nทุนร้านเหลือ: ${(gameState.storeData.storeMoney - withdrawAmount).toLocaleString()} บาท`);
  };

  const handleAccountSummary = () => {
    const { totalProfit, dailySales, storeMoney } = gameState.storeData;
    
    if (totalProfit <= 0 && dailySales <= 0) {
      alert('ไม่มียอดขายหรือกำไรให้ทำการสรุปบัญชี');
      return;
    }

    const newStoreCapital = storeMoney + dailySales;
    const savingsIncrease = totalProfit;

    const confirmation = confirm(
      `📊 สรุปบัญชีร้านค้า\n\n` +
      `💰 ยอดขายวันนี้: ${dailySales.toLocaleString()} บาท\n` +
      `📈 กำไรสะสม: ${totalProfit.toLocaleString()} บาท\n\n` +
      `🏪 การคำนวณ:\n` +
      `   • ทุนร้านเดิม: ${storeMoney.toLocaleString()} บาท\n` +
      `   • เพิ่มยอดขายทั้งหมด: +${dailySales.toLocaleString()} บาท\n` +
      `   • ทุนร้านใหม่: ${newStoreCapital.toLocaleString()} บาท\n\n` +
      `💎 เงินสะสมเพิ่ม: ${savingsIncrease.toLocaleString()} บาท\n` +
      `⭐ ประสบการณ์เพิ่ม: ${Math.floor(totalProfit / 5)} แต้ม\n\n` +
      `หลังสรุปบัญชี ยอดขายและกำไรจะรีเซ็ตเป็น 0\nต้องการดำเนินการหรือไม่?`
    );

    if (confirmation) {
      updateGameState({
        savings: gameState.savings + savingsIncrease,
        experience: gameState.experience + Math.floor(totalProfit / 5),
        storeData: {
          ...gameState.storeData,
          storeMoney: newStoreCapital,
          totalProfit: 0,
          dailySales: 0
        }
      });

      alert(
        `✅ สรุปบัญชีสำเร็จ!\n\n` +
        `🏪 ทุนร้านใหม่: ${newStoreCapital.toLocaleString()} บาท\n` +
        `💎 เงินสะสมเพิ่ม: ${savingsIncrease.toLocaleString()} บาท\n` +
        `⭐ ประสบการณ์เพิ่ม: ${Math.floor(totalProfit / 5)} แต้ม\n\n` +
        `เริ่มรอบการขายใหม่แล้ว!`
      );
    }
  };

  return {
    addCapitalToStore,
    withdrawCapital,
    handleAccountSummary
  };
};
