import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { PRIZE_LADDER } from '../constants';
import './PrizeLadder.css';

export default function PrizeLadder({ currentLevel }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentLevel]);

  return (
    <div className="prize-ladder">
      {PRIZE_LADDER.map(({ level, label, safe }) => (
        <motion.div
          key={level}
          ref={level === currentLevel ? activeRef : null}
          className={`prize-row ${level === currentLevel ? 'active' : ''} ${safe ? 'safe' : ''}`}
          animate={level === currentLevel ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <span className="prize-level">{level}</span>
          <span className="prize-label">{label}</span>
          {safe && <span className="safe-badge">🛡</span>}
        </motion.div>
      ))}
    </div>
  );
}
