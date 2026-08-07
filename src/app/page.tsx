'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/MessageBubble';
import RightRail from '@/components/RightRail';
import { RecommendationCard } from '@/components/RecommendationCard';
import { InputBar } from '@/components/InputBar';

export default function Home() {
  const { messages, phase, recommendations, excludedProducts, isLoading, progressLabel, sendMessage, restart } = useChat();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const selectedIndexRef = useRef<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number | null>(null);

  const idToIndex = useRef<Map<string, number>>(new Map());
  idToIndex.current = new Map(messages.map((message, index) => [message.id, index]));

  const updateSelectedIndex = useCallback((index: number) => {
    selectedIndexRef.current = index;
    setSelectedIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    if (!mainRef.current) return;
    if (scrollFrame.current !== null) {
      cancelAnimationFrame(scrollFrame.current);
    }

    scrollFrame.current = requestAnimationFrame(() => {
      const containerRect = mainRef.current!.getBoundingClientRect();
      const nodes = Array.from(mainRef.current!.querySelectorAll<HTMLElement>('[data-message-id]'));
      let bestIndex = selectedIndexRef.current;
      let bestDistance = Infinity;

      for (const node of nodes) {
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.bottom - containerRect.bottom);
        if (rect.bottom <= containerRect.bottom && distance < bestDistance) {
          const id = node.dataset.messageId;
          const index = id ? idToIndex.current.get(id) : undefined;
          if (typeof index === 'number') {
            bestDistance = distance;
            bestIndex = index;
          }
        }
      }

      if (bestIndex !== selectedIndexRef.current) {
        updateSelectedIndex(bestIndex);
      }
    });
  }, [updateSelectedIndex]);

  useEffect(() => {
    const lastIndex = Math.max(0, messages.length - 1);
    updateSelectedIndex(lastIndex);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recommendations, isLoading, updateSelectedIndex]);

  useEffect(() => {
    return () => {
      if (scrollFrame.current !== null) {
        cancelAnimationFrame(scrollFrame.current);
      }
    };
  }, []);

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
        onScroll={handleScroll}
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
              <RecommendationCard key={`${r.name}-${i}`} rec={r} rank={i + 1} />
            ))}
          </div>
        )}

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
