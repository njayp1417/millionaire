import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useRealtimeSession } from '../hooks/useRealtimeSession';
import { useSyncedTimer } from '../hooks/useSyncedTimer';
import { useSessionPolling } from '../hooks/useSessionPolling';
import { SUBJECTS, PRIZE_LADDER, QUESTION_TIMER } from '../constants';
import PrizeLadder from '../components/PrizeLadder';
import PrizeTracker from '../components/PrizeTracker';
import AnswerOption from '../components/AnswerOption';
import Chat from '../components/Chat';
import AudienceModal from '../components/AudienceModal';
import GameOver from '../components/GameOver';
import Timer from '../components/Timer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Host.css';

function generateAudienceData(options, correctAnswer) {
  const labels = ['A', 'B', 'C', 'D'];
  const correctIdx = options.indexOf(correctAnswer);
  let remaining = 100;
  const percents = options.map((_, i) => {
    if (i === correctIdx) return null;
    const val = Math.floor(Math.random() * 4) + 1;
    remaining -= val;
    return val;
  });
  percents[correctIdx] = remaining;
  return labels.map((label, i) => ({ label, percent: percents[i] }));
}

export default function Host() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    session, setSession,
    question, setQuestion,
    prizeLevel, setPrizeLevel,
    answerResult, setAnswerResult,
    audienceData, setAudienceData,
    usedLifelines, markLifelineUsed,
    eliminatedOptions, setEliminatedOptions,
    selectedAnswer, setSelectedAnswer,
    gameStatus, setGameStatus,
  } = useGame();

  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [showLadder, setShowLadder] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);

  const sessionIdRef = useRef(null);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  useRealtimeSession(sessionId);

  useEffect(() => {
    if (!user || user.role !== 'host') navigate('/');
  }, [user, navigate]);

  // Restore full session state on mount (handles page refresh / returning to app)
  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .in('status', ['active', 'lobby'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) return;

      setChatSessionId(data.id);
      setSessionId(data.id);

      if (data.status === 'active') {
        setSession(data);
        setPrizeLevel(data.prize_level ?? 1);
        setQuestion(data.current_question ?? null);
        setAnswerResult(data.answer_result ?? null);
        setAudienceData(data.audience_data ?? null);
        setEliminatedOptions(data.eliminated_options ?? []);
        setSelectedAnswer(data.selected_answer ?? null);
        setTimerActive(data.timer_active ?? false);
        setTimerStartedAt(data.timer_started_at ?? null);
        setGameStatus(data.status);
      }
    };
    initSession();
  }, []); // eslint-disable-line

  // Poll session every 3s as realtime fallback — full sync so selectedAnswer is always fresh
  useSessionPolling(sessionId, (data) => {
    setSelectedAnswer(data.selected_answer ?? null);
    setTimerActive(data.timer_active ?? false);
    setTimerStartedAt(data.timer_started_at ?? null);
    if (data.status) setGameStatus(data.status);
  });

  const seconds = useSyncedTimer(timerActive, timerStartedAt);

  const startSession = async () => {
    if (chatSessionId) {
      const { data, error } = await supabase
        .from('game_sessions')
        .update({ status: 'active', prize_level: 1, timer_active: false })
        .eq('id', chatSessionId)
        .select()
        .single();
      if (!error) { setSession(data); setSessionId(data.id); setPrizeLevel(1); }
    } else {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({ prize_level: 1, timer_active: false, status: 'active' })
        .select()
        .single();
      if (!error) { setSession(data); setSessionId(data.id); setChatSessionId(data.id); setPrizeLevel(1); }
    }
  };

  const pickQuestion = async () => {
    if (!selectedSubject || !sessionId) return;
    setLoading(true);
    setAnswerResult(null);
    setEliminatedOptions([]);
    setSelectedAnswer(null);
    setTimerActive(false);
    setTimerStartedAt(null);

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject', selectedSubject)
      .limit(50);

    if (!error && data.length > 0) {
      const q = { ...data[Math.floor(Math.random() * data.length)] };
      const shuffled = [...q.options].sort(() => Math.random() - 0.5);
      q.options = shuffled;
      setQuestion(q);
      await supabase.from('game_sessions').update({
        current_question: q,
        answer_result: null,
        audience_data: null,
        eliminated_options: [],
        selected_answer: null,
        timer_active: false,
        timer_started_at: null,
      }).eq('id', sessionId);
    }
    setLoading(false);
  };

  const toggleTimer = async () => {
    const next = !timerActive;
    const startedAt = next ? new Date().toISOString() : null;
    setTimerActive(next);
    setTimerStartedAt(startedAt);
    await supabase.from('game_sessions').update({
      timer_active: next,
      timer_started_at: startedAt,
    }).eq('id', sessionId);
  };

  const markAnswer = async (result) => {
    setAnswerResult(result);
    setTimerActive(false);
    setTimerStartedAt(null);
    const nextLevel = result === 'correct' ? Math.min(prizeLevel + 1, 50) : prizeLevel;
    if (result === 'correct') setPrizeLevel(nextLevel);

    await supabase.from('game_sessions').update({
      answer_result: result,
      prize_level: nextLevel,
      timer_active: false,
      timer_started_at: null,
      selected_answer: null,
    }).eq('id', sessionId);

    // Only end game on wrong answer — winning all 50 is handled separately
    if (result === 'wrong') {
      await endGame();
    }
  };

  const doFiftyFifty = async () => {
    if (!question || usedLifelines.includes('fifty')) return;
    markLifelineUsed('fifty');
    const opts = question.options;
    const correct = question.answer;
    const wrongIndices = opts
      .map((o, i) => o !== correct ? i : null)
      .filter(i => i !== null);
    // Shuffle wrong indices so removal pattern is random each time
    wrongIndices.sort(() => Math.random() - 0.5);
    const toElim = wrongIndices.slice(0, 2);
    const labels = ['A', 'B', 'C', 'D'];
    const elimLabels = toElim.map(i => labels[i]);
    setEliminatedOptions(elimLabels);
    await supabase.from('game_sessions').update({ eliminated_options: elimLabels }).eq('id', sessionId);
  };

  const doAskAudience = async () => {
    if (!question || usedLifelines.includes('audience')) return;
    markLifelineUsed('audience');
    const data = generateAudienceData(question.options, question.answer);
    setAudienceData(data);
    await supabase.from('game_sessions').update({ audience_data: data }).eq('id', sessionId);
  };

  const closeAudience = async () => {
    setAudienceData(null);
    await supabase.from('game_sessions').update({ audience_data: null }).eq('id', sessionId);
  };

  const doSkip = async () => {
    if (!question || usedLifelines.includes('skip')) return;
    markLifelineUsed('skip');
    await pickQuestion();
  };

  const endGame = async () => {
    setGameStatus('ended');
    await supabase.from('game_sessions').update({
      status: 'ended',
      timer_active: false,
      timer_started_at: null,
    }).eq('id', sessionId);
  };

  const startNewGame = async () => {
    setGameStatus(null);
    setSession(null);
    setQuestion(null);
    setPrizeLevel(1);
    setAnswerResult(null);
    setAudienceData(null);
    setEliminatedOptions([]);
    setSelectedAnswer(null);
    setTimerActive(false);
    setTimerStartedAt(null);
    setSessionId(null);
    setChatSessionId(null);
    const { data } = await supabase
      .from('game_sessions')
      .insert({ prize_level: 1, timer_active: false, status: 'lobby' })
      .select()
      .single();
    if (data) {
      setChatSessionId(data.id);
      setSessionId(data.id);
    }
  };

  const currentPrize = PRIZE_LADDER.find(p => p.level === prizeLevel);

  return (
    <div className="host-page">
      <header className="host-header">
        <div className="host-brand">🎙️ NJAY — Host Panel</div>
        <div className="host-prize-display">
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

      <PrizeTracker currentLevel={prizeLevel} />
      <div className="host-body">
        <aside className="host-left">
          <PrizeLadder currentLevel={prizeLevel} />
        </aside>

        <main className="host-center">
          {!session ? (
            <motion.button
              className="big-btn"
              onClick={startSession}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              🚀 Start New Game
            </motion.button>
          ) : (
            <>
              <div className="subject-row">
                <select
                  className="subject-select"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                >
                  <option value="">Pick a Subject</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <motion.button
                  className="pick-btn"
                  onClick={pickQuestion}
                  disabled={!selectedSubject || loading}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? '...' : '🎲 Pick Question'}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {question && (
                  <motion.div
                    className="host-question-box"
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <div className="question-meta">
                      <span className="q-subject">{question.subject}</span>
                      <span className="q-difficulty">{question.difficulty}</span>
                      <Timer seconds={seconds} total={QUESTION_TIMER} />
                    </div>
                    <p className="question-text">{question.question}</p>

                    <AnswerOption
                      options={question.options}
                      result={answerResult}
                      eliminated={eliminatedOptions}
                      correctAnswer={question.answer}
                      selectedAnswer={selectedAnswer}
                      isHost={true}
                    />

                    <div className="host-answer-reveal">
                      ✅ Correct Answer: <strong>{question.answer}</strong>
                    </div>

                    <div className="host-controls">
                      <button className="ctrl-btn" onClick={toggleTimer}>
                        {timerActive ? '⏸ Pause Timer' : '▶️ Start Timer'}
                      </button>
                      <button className="ctrl-btn end-btn" onClick={endGame}>
                        🏁 End Game
                      </button>
                    </div>

                    {!answerResult && (
                      <div className="mark-row">
                        <motion.button className="mark-btn correct" onClick={() => markAnswer('correct')} whileTap={{ scale: 0.95 }}>
                          ✅ Correct
                        </motion.button>
                        <motion.button className="mark-btn wrong" onClick={() => markAnswer('wrong')} whileTap={{ scale: 0.95 }}>
                          ❌ Wrong
                        </motion.button>
                      </div>
                    )}

                    {answerResult && (
                      <motion.div
                        className={`result-banner ${answerResult}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        {answerResult === 'correct' ? '🎉 CORRECT!' : '💥 WRONG!'}
                        <motion.button
                          className="next-btn"
                          onClick={pickQuestion}
                          whileTap={{ scale: 0.95 }}
                          disabled={!selectedSubject || loading}
                        >
                          {loading ? '...' : '➡️ Next Question'}
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {question && (
                <div className="lifelines-row">
                  <button className={`lifeline-btn ${usedLifelines.includes('fifty') ? 'used' : ''}`} onClick={doFiftyFifty} disabled={usedLifelines.includes('fifty')}>
                    50/50
                  </button>
                  <button className={`lifeline-btn ${usedLifelines.includes('audience') ? 'used' : ''}`} onClick={doAskAudience} disabled={usedLifelines.includes('audience')}>
                    👥 Audience
                  </button>
                  <button className={`lifeline-btn ${usedLifelines.includes('skip') ? 'used' : ''}`} onClick={doSkip} disabled={usedLifelines.includes('skip')}>
                    ⏭ Skip
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <aside className={`host-right ${chatOpen ? 'open' : 'closed'}`}>
          <button className="chat-toggle-bar" onClick={() => setChatOpen(v => !v)}>
            <span>💬 Live Chat</span>
            <span className="chat-toggle-icon">{chatOpen ? '▼' : '▲'}</span>
          </button>
          {chatOpen && <Chat sessionId={chatSessionId} />}
        </aside>
      </div>

      <AudienceModal
        data={audienceData}
        onClose={closeAudience}
        isHost={true}
      />

      {gameStatus === 'ended' && (
        <GameOver
          prizeLevel={prizeLevel}
          reason={answerResult}
          isHost={true}
          onPlayAgain={startNewGame}
        />
      )}
    </div>
  );
}
