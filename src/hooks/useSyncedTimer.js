import { useState, useEffect, useRef } from 'react';
import { QUESTION_TIMER } from '../constants';

export function useSyncedTimer(timerActive, timerStartedAt) {
  const [seconds, setSeconds] = useState(QUESTION_TIMER);
  const intervalRef = useRef(null);

  useEffect(() => {
    clearInterval(intervalRef.current);

    if (!timerActive || !timerStartedAt) {
      if (!timerActive) setSeconds(QUESTION_TIMER);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - new Date(timerStartedAt).getTime()) / 1000;
      const remaining = Math.max(0, Math.round(QUESTION_TIMER - elapsed));
      setSeconds(remaining);
      if (remaining <= 0) clearInterval(intervalRef.current);
    };

    tick();
    intervalRef.current = setInterval(tick, 500);

    return () => clearInterval(intervalRef.current);
  }, [timerActive, timerStartedAt]);

  return seconds;
}
