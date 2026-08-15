import { useState } from 'react';
import { sendFeedback } from '@/services/radianceClient';
import type { RecommendationResult } from '@/services/radianceClient';

interface Props {
  rec: RecommendationResult;
  rank: number;
  sessionId: string;
}

const PLACEHOLDER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-botanical-300" aria-hidden="true">
    <path d="M9 2h6M10 2v4.2a2 2 0 0 1-.4 1.2L5.6 13a3 3 0 0 0-.6 1.8V19a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-4.2a3 3 0 0 0-.6-1.8l-4-5.6a2 2 0 0 1-.4-1.2V2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 14.5h9" strokeLinecap="round" />
  </svg>
);

const SAFETY_STAMP: Record<RecommendationResult['safetyStatus'], { label: string; text: string; border: string }> = {
  safe:    { label: 'Safe',    text: 'text-safe',    border: 'border-safe'    },
  caution: { label: 'Caution', text: 'text-caution', border: 'border-caution' },
  unsafe:  { label: 'Unsafe',  text: 'text-unsafe',  border: 'border-unsafe'  },
};

export function RecommendationCard({ rec, rank, sessionId }: Props) {
  const stamp = SAFETY_STAMP[rec.safetyStatus];
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = Boolean(rec.imageUrl) && !imgFailed;
  const [rating, setRating] = useState<'up' | 'down' | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  const submitRating = async (next: 'up' | 'down') => {
    if (rating === next) return; // already recorded, avoid a redundant call
    setRating(next);
    setFeedbackError(false);
    try {
      await sendFeedback({ sessionId, productName: rec.name, brand: rec.brand, rating: next });
    } catch {
      setFeedbackError(true);
    }
  };

  return (
    <div className="bg-white border border-line rounded-lg p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {/* Same-size slot whether it's a real product photo or the placeholder icon */}
          <div className="w-9 h-9 shrink-0 rounded-md bg-paper border border-line overflow-hidden flex items-center justify-center">
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, unpredictable OBF/OFF hosts; next/image would need a wildcard remotePatterns allowlist
              <img
                src={rec.imageUrl}
                alt={rec.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setImgFailed(true)}
              />
            ) : (
              PLACEHOLDER_ICON
            )}
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-botanical-500">
              No. {String(rank).padStart(2, '0')}
            </p>
            <h3 className="font-display font-semibold text-ink text-sm mt-0.5">{rec.name}</h3>
            <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mt-0.5">{rec.brand}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`stamp border-2 ${stamp.border} ${stamp.text} rounded-sm px-2 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-widest -rotate-3`}
          >
            {stamp.label}
          </span>
          {rec.confidence !== undefined && (
            <span className="text-[10px] font-mono text-ink/40">{Math.round(rec.confidence)}% match</span>
          )}
        </div>
      </div>

      {/* Relevance */}
      {rec.relevanceToQuery && (
        <>
          <hr className="border-line" />
          <p className="text-sm text-ink/80 leading-relaxed">{rec.relevanceToQuery}</p>
        </>
      )}

      {/* Reasoning */}
      {rec.reasoning && (
        <div>
          <p className="text-[11px] font-mono font-medium text-botanical-500 uppercase tracking-widest mb-1">Why it works</p>
          <p className="text-sm text-ink/70 leading-relaxed">{rec.reasoning}</p>
        </div>
      )}

      {/* Usage tips */}
      {rec.usageTips && rec.usageTips.length > 0 && (
        <div>
          <p className="text-[11px] font-mono font-medium text-botanical-500 uppercase tracking-widest mb-1">How to use</p>
          <ul className="space-y-1">
            {rec.usageTips.map(tip => (
              <li key={tip} className="text-sm text-ink/70 flex gap-2">
                <span className="text-botanical-400 shrink-0 font-mono">{'>'}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notes (caution only) */}
      {rec.safetyNotes && rec.safetyStatus === 'caution' && (
        <p className="text-xs text-caution bg-caution-bg border-l-2 border-caution rounded-sm px-3 py-2">
          Note: {rec.safetyNotes}
        </p>
      )}

      {/* Availability + categories */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {rec.availabilityNotes && (
          <span className="text-[11px] font-mono text-ink/40">{rec.availabilityNotes}</span>
        )}
        {rec.categories.slice(0, 3).map(cat => (
          <span
            key={cat}
            className="text-[10px] font-mono uppercase tracking-wide border border-line bg-paper text-ink/60 px-2 py-0.5 rounded-sm"
          >
            {cat}
          </span>
        ))}
        {rec.sourceUrl && (
          <a
            href={rec.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-botanical-500 hover:text-botanical-600 underline ml-auto"
          >
            View product
          </a>
        )}

        {/* Feedback — thumbs up/down, keyed on session + product (see feedbackController.ts) */}
        <div className={`flex items-center gap-1.5 ${rec.sourceUrl ? '' : 'ml-auto'}`}>
          <button
            aria-label="Good recommendation"
            aria-pressed={rating === 'up'}
            onClick={() => submitRating('up')}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
              rating === 'up' ? 'bg-botanical-500 border-botanical-500 text-white' : 'border-line text-ink/40 hover:text-ink/70 hover:bg-paper'
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M7.5 18.5h6.4a1.5 1.5 0 0 0 1.47-1.21l1.1-5.5A1.5 1.5 0 0 0 15 10H11.6l.6-3.1c.15-.75-.42-1.4-1.2-1.4-.4 0-.77.2-.98.55L7.5 9.5v9Zm-4-9h2v9h-2v-9Z" />
            </svg>
          </button>
          <button
            aria-label="Not a good recommendation"
            aria-pressed={rating === 'down'}
            onClick={() => submitRating('down')}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
              rating === 'down' ? 'bg-unsafe border-unsafe text-white' : 'border-line text-ink/40 hover:text-ink/70 hover:bg-paper'
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12.5 1.5H6.1a1.5 1.5 0 0 0-1.47 1.21l-1.1 5.5A1.5 1.5 0 0 0 5 10h3.4l-.6 3.1c-.15.75.42 1.4 1.2 1.4.4 0 .77-.2.98-.55L12.5 10.5v-9Zm4 9h-2v-9h2v9Z" />
            </svg>
          </button>
          {feedbackError && <span className="text-[10px] text-unsafe">Couldn&apos;t save</span>}
        </div>
      </div>
    </div>
  );
}
