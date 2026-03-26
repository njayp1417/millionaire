import React from 'react';
import { motion } from 'framer-motion';
import './Timer.css';

export default function Timer({ seconds, total = 60 }) {
  const pct = (seconds / total) * 100;
  const color = seconds > 30 ? '#00c853' : seconds > 15 ? '#ffd700' : '#d50000';

  return (
    <div className="timer-wrap">
      <svg className="timer-svg" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
        <motion.circle
          cx="30" cy="30" r="26"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 26}`}
          strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
          transform="rotate(-90 30 30)"
          transition={{ duration: 1, ease: 'linear' }}
        />
      </svg>
      <span className="timer-text" style={{ color }}>{seconds}</span>
    </div>
  );
}
