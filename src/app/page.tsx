'use client';

import { InputBar } from '@/components/InputBar';
import { MessageBubble } from '@/components/MessageBubble';
import { RecommendationCard } from '@/components/RecommendationCard';
import { RoutineCard } from '@/components/RoutineCard';
import RightRail from '@/components/RightRail';
import { useChat } from '@/hooks/useChat';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function Home() {
  const { messages, phase, recommendations, excludedProducts, routine, isLoading, progressLabel, sessionId, sendMessage, restart } = useChat();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedIndexRef = useRef<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const visibleEntriesRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  const idToIndex = useRef<Map<string, number>>(new Map());
  idToIndex.current = new Map(messages.map((message, index) => [message.id, index]));

  const updateSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);
  }, []);

  const scrollToMessage = useCallback((index: number) => {
    const boundedIndex = Math.max(0, Math.min(messages.length - 1, index));
    const id = messages[boundedIndex]?.id;
    const container = mainRef.current;
    if (!id || !container) return;

    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({
      behavior: 'smooth',
      block: boundedIndex === 0 ? 'start' : 'end',
    });
  }, [messages]);

  const handleIntersections = useCallback((entries: IntersectionObserverEntry[]) => {
    for (const entry of entries) {
      const target = entry.target as HTMLElement;
      const id = target.dataset.messageId;
      if (!id) continue;

      if (entry.isIntersecting) {
        visibleEntriesRef.current.set(id, entry);
      } else {
        visibleEntriesRef.current.delete(id);
      }
    }

    if (!mainRef.current) return;
    let bestIndex = selectedIndexRef.current;
    let bestBottom = -Infinity;

    for (const entry of visibleEntriesRef.current.values()) {
      const target = entry.target as HTMLElement;
      const id = target.dataset.messageId;
      const index = id ? idToIndex.current.get(id) : undefined;
      if (typeof index !== 'number') continue;

      const rect = entry.boundingClientRect;
      if (rect.bottom > bestBottom) {
        bestBottom = rect.bottom;
        bestIndex = index;
      }
    }

    if (bestIndex !== selectedIndexRef.current) {
      updateSelectedIndex(bestIndex);
    }
  }, [updateSelectedIndex]);

  useEffect(() => {
    const lastIndex = Math.max(0, messages.length - 1);
    updateSelectedIndex(lastIndex);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recommendations, updateSelectedIndex]);

  useEffect(() => {
    if (!mainRef.current) return;
    const observer = new IntersectionObserver(handleIntersections, {
      root: mainRef.current,
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    observerRef.current = observer;

    const nodes = Array.from(mainRef.current.querySelectorAll<HTMLElement>('[data-message-id]'));
    nodes.forEach(node => observer.observe(node));

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [messages, handleIntersections]);

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto bg-paper">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-paper border-b border-line">
        <div>
          <h1 className="font-display text-xl font-bold text-ink tracking-tight">Radiance AI</h1>
          <p className="text-[11px] font-mono uppercase tracking-wide text-botanical-500">Ingredient safety, reviewed</p>
        </div>
        {phase === 'done' && (
          <button
            onClick={restart}
            className="text-sm text-botanical-500 hover:text-botanical-600 font-medium transition-colors"
          >
            New search
          </button>
        )}
      </header>

      {/* Chat stream */}
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto px-4 py-6 pr-24 space-y-4 chat-scroll"
      >
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-ink/50 text-sm pl-2 font-mono">
            <span>{progressLabel ?? 'Reading the label'}</span>
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-botanical-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-botanical-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-botanical-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        )}

        {/* Recommendation cards shown inline after final message */}
        {recommendations.length > 0 && (
          <div className="space-y-3 pt-2">
            {recommendations.map((r, i) => (
              <RecommendationCard key={`${r.name}-${i}`} rec={r} rank={i + 1} sessionId={sessionId} />
            ))}
          </div>
        )}

        {/* AM/PM sequencing + interaction guidance for the recommendations above */}
        {routine && <RoutineCard routine={routine} />}

        {/* Products the LLM considered but excluded as unsafe */}
        {excludedProducts.length > 0 && (
          <div className="border border-line rounded-lg p-4 space-y-2 bg-paper">
            <p className="text-[11px] font-mono font-medium text-ink/40 uppercase tracking-widest">Not recommended</p>
            {excludedProducts.map((p, i) => (
              <p key={`${p.name}-${i}`} className="text-xs text-ink/60 leading-relaxed">
                <span className="font-medium text-ink/80">{p.name}</span> — {p.reason}
              </p>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <RightRail
        messages={messages}
        selectedIndex={selectedIndex}
        onSelect={updateSelectedIndex}
        onScrollTo={scrollToMessage}
      />

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isLoading || phase === 'processing'}
        placeholder={
          phase === 'done'
            ? 'Ask a follow-up or type a new concern...'
            : 'Type your answer...'
        }
      />
    </div>
  );
}
