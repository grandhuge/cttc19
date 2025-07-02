
import React from 'react';
import StoreGameLogic from './store/StoreGameLogic';

const StoreGame = ({ gameState, updateGameState, onBack }) => {
  return (
    <StoreGameLogic 
      gameState={gameState} 
      updateGameState={updateGameState} 
      onBack={onBack} 
    />
  );
};

export default StoreGame;
