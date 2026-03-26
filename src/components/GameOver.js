import React from 'react';
import { motion } from 'framer-motion';
import { PRIZE_LADDER } from '../constants';
import './GameOver.css';

export default function GameOver({ prizeLevel, reason, isHost, onPlayAgain }) {
  const won = reason === 'correct' && prizeLevel >= 50;
  const safeFloor = [...PRIZE_LADDER]
    .filter(p => p.safe && p.level <= prizeLevel)
    .sort((a, b) => b.level - a.level)[0];

  const finalPrize = PRIZE_LADDER.find(p => p.level === prizeLevel);

  return (
    <motion.div
      className="gameover-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="gameover-box"
        initial={{ scale: 0.7, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        <div className="gameover-icon">
          {won ? '🏆' : '💥'}
        </div>

        <h1 className="gameover-title">
          {won ? 'CONGRATULATIONS!' : 'GAME OVER!'}
        </h1>

        {won ? (
          <p className="gameover-sub">
            Blessing has won the top prize!
          </p>
        ) : (
          <p className="gameover-sub">
            {reason === 'wrong' ? 'Wrong answer!' : 'Time ran out!'}
          </p>
        )}

        <div className="gameover-prize-box">
          <span className="gameover-prize-label">
            {won ? 'Prize Won' : 'Safe Floor Reached'}
          </span>
          <span className="gameover-prize-amount">
            {won
              ? finalPrize?.label ?? '₦0'
              : safeFloor?.label ?? '₦0'}
          </span>
        </div>

        {isHost && (
          <motion.button
            className="gameover-btn"
            onClick={onPlayAgain}
            whileTap={{ scale: 0.96 }}
          >
            🔄 New Game
          </motion.button>
        )}

        {!isHost && (
          <p className="gameover-waiting">
            Waiting for NJAY to start a new game...
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
