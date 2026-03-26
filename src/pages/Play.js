import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSyncedTimer } from '../hooks/useSyncedTimer';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { PRIZE_LADDER, QUESTION_TIMER } from '../constants';
import PrizeLadder from '../components/PrizeLadder';
import AnswerOption from '../components/AnswerOption';
import Chat from '../components/Chat';
import AudienceModal from '../components/AudienceModal';
import GameOver from '../components/GameOver';
import Timer from '../components/Timer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Play.css';

export default function Play() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    question, setQuestion,
    prizeLevel, setPrizeLevel,
    answerResult, setAnswerResult,
    audienceData, setAudienceData,
    eliminatedOptions, setEliminatedOptions,
    selectedAnswer, setSelectedAnswer,
    gameStatus, setGameStatus,
    reset,
  } = useGame();

  const [sessionId, setSessionId] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [showLadder, setShowLadder] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  // Clear any stale state from a previous session on mount
  useEffect(() => { reset(); }, []); // eslint-disable-line

  const applySessionData = useCallback((data) => {
    setQuestion(data.current_question ?? null);
    setPrizeLevel(data.prize_level ?? 1);
    setAnswerResult(data.answer_result ?? null);
    setAudienceData(data.audience_data ?? null);
    setEliminatedOptions(data.eliminated_options ?? []);
    setSelectedAnswer(data.selected_answer ?? null);
    setTimerActive(data.timer_active ?? false);
    setTimerStartedAt(data.timer_started_at ?? null);
    setGameStatus(data.status ?? null);
  }, [setQuestion, setPrizeLevel, setAnswerResult, setAudienceData, setEliminatedOptions, setSelectedAnswer, setGameStatus]); // eslint-disable-line

  useSessionPolling(sessionId, applySessionData);

  const seconds = useSyncedTimer(timerActive, timerStartedAt);

  const handleSelect = async (opt) => {
    if (answerResult) return;
    setSelectedAnswer(opt);
    await supabase.from('game_sessions').update({ selected_answer: opt }).eq('id', sessionId);
  };

  useEffect(() => {
    if (!user || user.role !== 'player') navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    const findSession = async () => {
      // Only attach to active sessions — lobby sessions may have stale question data
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setSessionId(data.id);
        applySessionData(data);
      } else {
        // No active session yet — watch for one to become active via realtime
        const lobbyData = await supabase
          .from('game_sessions')
          .select('id')
          .eq('status', 'lobby')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (lobbyData.data) setSessionId(lobbyData.data.id);
      }
    };
    findSession();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`play-session:${sessionId}:${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      }, ({ new: row }) => {
        applySessionData(row);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [sessionId, applySessionData]);

  const currentPrize = PRIZE_LADDER.find(p => p.level === prizeLevel);

  return (
    <div className="play-page">
      <header className="play-header">
        <div className="play-brand">🎯 Who Wants to Be a Millionaire</div>
        <div className="play-prize">
          {currentPrize && <span>{currentPrize.label}</span>}
        </div>
        <button className="ladder-toggle-btn" onClick={() => setShowLadder(v => !v)}>🏆</button>
        <button className="logout-btn" onClick={() => { logout(); navigate('/'); }}>Exit</button>
      </header>

      {/* Mobile prize ladder drawer */}
      <AnimatePresence>
        {showLadder && (
          <motion.div
            className="ladder-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLadder(false)}
          >
            <motion.div
              className="ladder-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="ladder-drawer-header">
                <span>🏆 Prize Ladder</span>
                <button className="ladder-drawer-close" onClick={() => setShowLadder(false)}>✕</button>
              </div>
              <PrizeLadder currentLevel={prizeLevel} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="play-body">
        <aside className="play-left">
          <PrizeLadder currentLevel={prizeLevel} />
        </aside>

        <main className="play-center">
          <AnimatePresence mode="wait">
            {!question ? (
              <motion.div
                className="waiting-screen"
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="waiting-icon">⏳</div>
                <p>Waiting for NJAY to start the game...</p>
              </motion.div>
            ) : (
              <motion.div
                className="play-question-stage"
                key={question.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
              >
                <div className="play-question-meta">
                  <span className="q-subject">{question.subject}</span>
                  <Timer seconds={seconds} total={QUESTION_TIMER} />
                </div>

                <motion.div
                  className="play-question-text"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {question.question}
                </motion.div>

                <AnswerOption
                  options={question.options}
                  result={answerResult}
                  eliminated={eliminatedOptions}
                  correctAnswer={question.answer}
                  selectedAnswer={selectedAnswer}
                  isHost={false}
                  onSelect={handleSelect}
                />

                <AnimatePresence>
                  {answerResult && (
                    <motion.div
                      className={`play-result-banner ${answerResult}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      {answerResult === 'correct'
                        ? `🎉 CORRECT! You've won ${currentPrize?.label}!`
                        : '💥 WRONG! Better luck next time!'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside className={`play-right ${chatOpen ? 'open' : 'closed'}`}>
          <button className="chat-toggle-bar" onClick={() => setChatOpen(v => !v)}>
            <span>💬 Live Chat</span>
            <span className="chat-toggle-icon">{chatOpen ? '▼' : '▲'}</span>
          </button>
          {chatOpen && <Chat sessionId={sessionId} />}
        </aside>
      </div>

      <AudienceModal
        data={audienceData}
        onClose={null}
        isHost={false}
      />

      {gameStatus === 'ended' && (
        <GameOver
          prizeLevel={prizeLevel}
          reason={answerResult}
          isHost={false}
        />
      )}
    </div>
  );
}
