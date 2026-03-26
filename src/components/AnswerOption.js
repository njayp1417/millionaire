import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AnswerOption.css';

const LABELS = ['A', 'B', 'C', 'D'];

export default function AnswerOption({ options, result, eliminated, onSelect, isHost, correctAnswer, selectedAnswer }) {
  return (
    <div className="options-grid">
      {options.map((opt, i) => {
        const label = LABELS[i];
        const isEliminated = eliminated.includes(label);
        const isSelected = selectedAnswer === opt;
        const isCorrect = result && opt === correctAnswer;
        const isWrong = result === 'wrong' && isSelected && opt !== correctAnswer;

        let btnClass = 'option-btn';
        if (isCorrect) btnClass += ' correct';
        else if (isWrong) btnClass += ' wrong';
        else if (isSelected) btnClass += ' selected';
        if (isHost && isSelected && !result) btnClass += ' host-selected';

        return (
          <AnimatePresence key={i}>
            {!isEliminated && (
              <motion.button
                className={btnClass}
                onClick={() => !isHost && !result && onSelect && onSelect(opt)}
                initial={{ opacity: 1, x: 0 }}
                animate={
                  isCorrect ? { scale: [1, 1.04, 1] } :
                  isWrong   ? { x: [0, -8, 8, -8, 0] } :
                  isHost && isSelected && !result ? { scale: [1, 1.02, 1] } :
                  {}
                }
                transition={isHost && isSelected && !result
                  ? { repeat: Infinity, duration: 1.2 }
                  : { duration: 0.6 }
                }
                exit={{ opacity: 0, scale: 0.8 }}
                disabled={!!result || isHost}
              >
                <span className="opt-label">{label}</span>
                <span className="opt-text">{opt}</span>
                {isSelected && !result && (
                  <span className="opt-selected-badge">
                    {isHost ? '👆 Blessing' : '👆'}
                  </span>
                )}
              </motion.button>
            )}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
