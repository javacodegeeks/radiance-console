'use client';

import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
// Uses sendMessageStream() so the UI gets live per-step progress labels (see
// progressLabel below) via SSE. To fall back to a single plain JSON response
// with no progress events, the backend (chatController.ts) already supports
// both — no server change needed. On the frontend, swap to sendMessage():
//
//   import { sendMessage } from '@/services/radianceClient';
//   ...
//   const data = await sendMessage({ sessionId: sessionId.current, message: text.trim() });
//   // (drop the onProgress callback param entirely — sendMessage() takes
//   // just the request object and returns the same ChatApiResponse shape)
//
// progressLabel will then just stay null the whole time, which is fine —
// page.tsx already falls back to a static "Reading the label" string.
import { sendMessageStream } from '@/services/radianceClient';
import type { ChatMessage, ChatPhase, RecommendationResult, ExcludedProductResult, Routine } from '@/services/radianceClient';

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
  const [excludedProducts, setExcludedProducts] = useState<ExcludedProductResult[]>([]);
  const [routine,         setRoutine]         = useState<Routine | null>(null);
  const [isLoading,       setIsLoading]       = useState(false);
  const [progressLabel,   setProgressLabel]   = useState<string | null>(null);
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
    setProgressLabel(null);

    try {
      const data = await sendMessageStream(
        { sessionId: sessionId.current, message: text.trim() },
        label => setProgressLabel(label),
      );
      setMessages(prev => [...prev, ...data.messages]);
      setPhase(data.phase);
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        setExcludedProducts(data.excludedProducts ?? []);
        setRoutine(data.routine ?? null);
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
      setProgressLabel(null);
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
    setExcludedProducts([]);
    setRoutine(null);
    setProgressLabel(null);
  }, []);

  return {
    messages,
    phase,
    recommendations,
    excludedProducts,
    routine,
    isLoading,
    progressLabel,
    sessionId: sessionId.current,
    sendMessage,
    restart,
  };
}
