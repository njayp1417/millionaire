import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Login.css';

export default function Login() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);
    navigate(role === 'host' ? '/host' : '/play');
  };

  // Already logged in — show who they are with option to switch
  if (user) {
    return (
      <div className="login-page">
        <motion.div
          className="login-box"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="login-logo">{user.role === 'host' ? '🎙️' : '🌟'}</div>
          <h1 className="login-title">Welcome back, {user.name}!</h1>
          <p className="login-sub">You are logged in as <strong>{user.role === 'host' ? 'Host' : 'Contestant'}</strong></p>
          <motion.button
            className={`login-card ${user.role === 'host' ? 'host' : 'player'}`}
            style={{ width: '100%', maxWidth: 240, margin: '0 auto 16px' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(user.role === 'host' ? '/host' : '/play')}
          >
            <span className="login-card-name">▶ Continue as {user.name}</span>
          </motion.button>
          <button className="switch-btn" onClick={() => { logout(); }}>Switch Profile</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <motion.div
        className="login-box"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="login-logo">🎯</div>
        <h1 className="login-title">Who Wants to Be a Millionaire</h1>
        <p className="login-sub">JAMB Edition — Select your profile</p>
        <div className="login-cards">
          <motion.button
            className="login-card host"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleLogin('host')}
          >
            <span className="login-card-icon">🎙️</span>
            <span className="login-card-name">NJAY</span>
            <span className="login-card-role">Host</span>
          </motion.button>

          <motion.button
            className="login-card player"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleLogin('player')}
          >
            <img src="/blessing_photo.jpeg" alt="Blessing" className="login-card-icon" />
            <span className="login-card-name">Blessing</span>
            <span className="login-card-role">Contestant</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
