import { useState, useEffect, useRef } from 'react';

export function useTimer(initialSeconds, active, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const secondsRef = useRef(initialSeconds);
  const activeRef = useRef(active);

  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      secondsRef.current -= 1;
      setSeconds(secondsRef.current);
      if (secondsRef.current <= 0) {
        clearInterval(id);
        onExpire && onExpire();
      }
    }, 1000);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const reset = () => {
    secondsRef.current = initialSeconds;
    setSeconds(initialSeconds);
  };

  return { seconds, reset };
}
