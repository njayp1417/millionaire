import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AudienceModal.css';

export default function AudienceModal({ data, onClose, isHost }) {
  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="audience-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="audience-modal"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="audience-title">📊 Ask the Audience</div>
          <div className="audience-bars">
            {data.map(({ label, percent }) => (
              <div key={label} className="audience-bar-row">
                <span className="audience-bar-label">{label}</span>
                <div className="audience-bar-track">
                  <motion.div
                    className="audience-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </div>
                <span className="audience-bar-pct">{percent}%</span>
              </div>
            ))}
          </div>
          {isHost && (
            <button className="audience-close" onClick={onClose}>
              Close for Everyone
            </button>
          )}
          {!isHost && (
            <p className="audience-waiting">Waiting for host to close...</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
