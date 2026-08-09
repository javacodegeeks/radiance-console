import React from 'react';
import { FaAngleDoubleUp, FaChevronUp, FaChevronDown, FaAngleDoubleDown } from 'react-icons/fa';
import type { ChatMessage } from '@/services/radianceClient';

interface Props {
  messages: ChatMessage[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

const MAX_MARKERS = 50;

export function RightRail({ messages, selectedIndex, onSelect }: Props) {
  const scrollTo = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(messages.length - 1, index));
    const id = messages[boundedIndex]?.id;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    onSelect(boundedIndex);
  };

  const prev = () => {
    if (messages.length === 0) return;
    const nextIndex = selectedIndex === 0 ? 0 : Math.max(0, selectedIndex - 1);
    scrollTo(nextIndex);
  };

  const next = () => {
    if (messages.length === 0) return;
    const nextIndex = selectedIndex === messages.length - 1 ? messages.length - 1 : Math.min(messages.length - 1, selectedIndex + 1);
    scrollTo(nextIndex);
  };

  const total = messages.length;
  const end = total;
  const start = selectedIndex < 0
    ? 0
    : Math.min(Math.max(0, selectedIndex - Math.floor(MAX_MARKERS / 2)), Math.max(0, end - MAX_MARKERS));
  const shown = messages.slice(start, Math.min(end, start + MAX_MARKERS));

  return (
    <div className="group fixed right-6 top-1/2 -translate-y-1/2 z-30 w-14 flex flex-col items-end gap-3">
      <button
        aria-label="first"
        onClick={() => scrollTo(0)}
        className="w-6 h-6 rounded-md bg-white border border-line flex items-center justify-center shadow-sm hover:bg-ink/5 self-end opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
      >
        <FaAngleDoubleUp className="text-ink/70" />
      </button>

      <button
        aria-label="previous"
        onClick={prev}
        className="w-6 h-6 rounded-md bg-white border border-line flex items-center justify-center shadow-sm hover:bg-ink/5 self-end opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
      >
        <FaChevronUp className="text-ink/70" />
      </button>

      <div className="flex flex-col items-end gap-1 max-h-[78vh] overflow-hidden p-1">
        {shown.map((m, index) => {
          const i = start + index;
          const isAssistant = m.role !== 'user';
          const selectedClass = selectedIndex === i ? 'ring-2 ring-botanical-400' : '';
          const w = isAssistant ? 'w-8' : 'w-4';
          const base = `h-1 min-h-[4px] rounded-md cursor-pointer transition-all ${selectedClass}`;
          return (
            <button
              key={m.id}
              onClick={() => scrollTo(i)}
              title={`${isAssistant ? 'LLM response' : 'User message'} • ${new Date(m.timestamp).toLocaleString()}`}
              className={`${base} ${w} bg-ink/20 hover:bg-ink/30 self-end`}
            />
          );
        })}
      </div>

      <button
        aria-label="next"
        onClick={next}
        className="w-6 h-6 rounded-md bg-white border border-line flex items-center justify-center shadow-sm hover:bg-ink/5 self-end opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
      >
        <FaChevronDown className="text-ink/70" />
      </button>

      <button
        aria-label="last"
        onClick={() => scrollTo(total - 1)}
        className="w-6 h-6 rounded-md bg-white border border-line flex items-center justify-center shadow-sm hover:bg-ink/5 self-end opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none group-hover:pointer-events-auto transition-all duration-200"
      >
        <FaAngleDoubleDown className="text-ink/70" />
      </button>
    </div>
  );
}

export default RightRail;
