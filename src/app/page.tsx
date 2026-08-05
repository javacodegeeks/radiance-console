'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from '@/components/MessageBubble';
import { RecommendationCard } from '@/components/RecommendationCard';
import { InputBar } from '@/components/InputBar';

export default function Home() {
  const { messages, phase, recommendations, excludedProducts, isLoading, progressLabel, sendMessage, restart } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recommendations, isLoading]);

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
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4 chat-scroll">
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
