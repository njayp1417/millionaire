import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useGame } from '../context/GameContext';

export function useRealtimeSession(sessionId) {
  const {
    setQuestion, setPrizeLevel, setAnswerResult,
    setAudienceData, setTimerActive, setEliminatedOptions,
    setSelectedAnswer, setGameStatus,
  } = useGame();

  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: `id=eq.${sessionId}`
      }, ({ new: row }) => {
        setQuestion(row.current_question ?? null);
        setPrizeLevel(row.prize_level ?? 1);
        setAnswerResult(row.answer_result ?? null);
        setAudienceData(row.audience_data ?? null);
        setTimerActive(row.timer_active ?? false);
        setEliminatedOptions(row.eliminated_options ?? []);
        setSelectedAnswer(row.selected_answer ?? null);
        setGameStatus(row.status ?? null);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId, setQuestion, setPrizeLevel, setAnswerResult, setAudienceData, setTimerActive, setEliminatedOptions, setSelectedAnswer, setGameStatus]);
}
