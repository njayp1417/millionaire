import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [prizeLevel, setPrizeLevel] = useState(1);
  const [answerResult, setAnswerResult] = useState(null);
  const [audienceData, setAudienceData] = useState(null);
  const [usedLifelines, setUsedLifelines] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);

  const markLifelineUsed = (type) => {
    if (usedLifelines.includes(type)) return;
    setUsedLifelines(prev => [...prev, type]);
  };

  const reset = () => {
    setQuestion(null);
    setPrizeLevel(1);
    setAnswerResult(null);
    setAudienceData(null);
    setUsedLifelines([]);
    setTimerActive(false);
    setEliminatedOptions([]);
    setSelectedAnswer(null);
    setGameStatus(null);
  };

  return (
    <GameContext.Provider value={{
      session, setSession,
      question, setQuestion,
      prizeLevel, setPrizeLevel,
      answerResult, setAnswerResult,
      audienceData, setAudienceData,
      usedLifelines, markLifelineUsed,
      timerActive, setTimerActive,
      eliminatedOptions, setEliminatedOptions,
      selectedAnswer, setSelectedAnswer,
      gameStatus, setGameStatus,
      reset
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
