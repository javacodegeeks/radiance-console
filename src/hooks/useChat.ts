'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { sendMessage as apiSendMessage } from '@/services/radianceClient';
import type { ChatMessage, ChatPhase, RecommendationResult } from '@/services/radianceClient';

const WELCOME: ChatMessage = {
  id:        uuidv4(),
  role:      'assistant',
  content:   "Hi! I'm your Radiance AI consultant. Tell me about your skin or hair concern and I'll find the right products for you.",
  timestamp: new Date().toISOString(),
};

const SESSION_STORAGE_KEY = 'radiance-session-id';

// Reuses the session id already stored for this browser tab (e.g. after a
// page refresh) so the conversation continues server-side instead of
// silently starting a new one. Falls back to a fresh id outside the browser
// (SSR) or when sessionStorage is unavailable.
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return uuidv4();

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const created = uuidv4();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
  return created;
}

export function useChat() {
  const [messages,        setMessages]        = useState<ChatMessage[]>([WELCOME]);
  const [phase,           setPhase]           = useState<ChatPhase>('collecting');
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [isLoading,       setIsLoading]       = useState(false);
  const sessionId = useRef<string>(getOrCreateSessionId());

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id:        uuidv4(),
      role:      'user',
      content:   text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const data = await apiSendMessage({ sessionId: sessionId.current, message: text.trim() });
      setMessages(prev => [...prev, ...data.messages]);
      setPhase(data.phase);
      if (data.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id:        uuidv4(),
          role:      'assistant' as const,
          content:   err instanceof Error ? err.message : 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const restart = useCallback(() => {
    sessionId.current = uuidv4();
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId.current);
    }
    setMessages([{
      ...WELCOME,
      id:        uuidv4(),
      timestamp: new Date().toISOString(),
    }]);
    setPhase('collecting');
    setRecommendations([]);
  }, []);

  return { messages, phase, recommendations, isLoading, sendMessage, restart };
}
