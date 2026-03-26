import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import './Chat.css';

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat({ sessionId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);
  const seenIds = useRef(new Set());

  const addMessage = useCallback((msg) => {
    if (seenIds.current.has(msg.id)) return;
    seenIds.current.add(msg.id);
    setMessages(prev => [...prev, msg]);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    // Reset on new session
    seenIds.current = new Set();
    setMessages([]);
    setConnected(false);

    // Load existing messages
    supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) data.forEach(addMessage);
      });

    // Subscribe to new messages with status tracking
    const channel = supabase
      .channel(`chat:${sessionId}:${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      }, ({ new: msg }) => {
        addMessage(msg);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [sessionId, addMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !sessionId) return;
    const optimistic = {
      id: `opt-${Date.now()}`,
      session_id: sessionId,
      sender: user.name,
      message: text.trim(),
      created_at: new Date().toISOString(),
    };
    addMessage(optimistic);
    setText('');

    const { data } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      sender: user.name,
      message: optimistic.message,
    }).select().single();

    if (data) {
      seenIds.current.add(data.id);
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') send();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        💬 Live Chat
        <span className={`chat-status ${connected ? 'online' : 'offline'}`}>
          {connected ? '● live' : '○ connecting...'}
        </span>
      </div>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.sender === user.name ? 'mine' : 'theirs'}`}>
            {m.sender !== user.name && <span className="chat-sender">{m.sender}</span>}
            <span className="chat-text">{m.message}</span>
            <span className="chat-time">{formatTime(m.created_at)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message..."
        />
        <button className="chat-send" onClick={send}>Send</button>
      </div>
    </div>
  );
}
