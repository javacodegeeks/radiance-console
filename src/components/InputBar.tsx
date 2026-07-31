'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function InputBar({ onSend, disabled = false, placeholder = 'Type a message...' }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Re-focus the textbox once a response finishes (disabled flips back to
  // false) so the user can keep typing without clicking back into it.
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="px-4 py-3 bg-paper border-t border-line">
      <div className="flex items-end gap-3 bg-white rounded-xl px-4 py-3 border border-line focus-within:border-botanical-400 transition-colors">
        <textarea
          ref={textareaRef}
          className="flex-1 bg-transparent resize-none text-sm text-ink placeholder-ink/40 outline-none max-h-32 leading-relaxed"
          rows={1}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-botanical-500 text-paper disabled:opacity-40 hover:bg-botanical-600 transition-colors"
          aria-label="Send"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M18.5 1.5L1 8.5l6.5 2.5m11-9.5L11 18.5l-3.5-7.5m11-9.5L7.5 11" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-ink/40 text-center mt-2 font-mono">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
