'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';

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
          <FaPaperPlane className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <p className="text-xs text-ink/40 text-center mt-2 font-mono">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
