import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

export function useSessionPolling(sessionId, onData, intervalMs = 3000) {
  const onDataRef = useRef(onData);
  useEffect(() => { onDataRef.current = onData; }, [onData]);

  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      const { data } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (data) onDataRef.current(data);
    };

    poll(); // immediate first fetch
    const id = setInterval(poll, intervalMs);
    return () => clearInterval(id);
  }, [sessionId, intervalMs]);
}
