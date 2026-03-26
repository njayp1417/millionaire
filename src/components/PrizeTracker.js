import React from 'react';
import { PRIZE_LADDER } from '../constants';
import './PrizeTracker.css';

export default function PrizeTracker({ currentLevel }) {
  const current = PRIZE_LADDER.find(p => p.level === currentLevel);
  const safeFloor = [...PRIZE_LADDER]
    .filter(p => p.safe && p.level <= currentLevel)
    .sort((a, b) => b.level - a.level)[0];
  const total = PRIZE_LADDER.length;
  const progress = Math.round((currentLevel / total) * 100);

  return (
    <div className="prize-tracker">
      <div className="pt-left">
        <span className="pt-q">Q{currentLevel}</span>
        <span className="pt-of">of {total}</span>
      </div>
      <div className="pt-center">
        <div className="pt-bar-track">
          <div className="pt-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="pt-labels">
          <span className="pt-current">{current?.label ?? '—'}</span>
          {safeFloor && (
            <span className="pt-safe">🛡 Safe: {safeFloor.label}</span>
          )}
        </div>
      </div>
      <div className="pt-right">
        <span className="pt-pct">{progress}%</span>
      </div>
    </div>
  );
}
