import type { ChatMessage } from '@/services/radianceClient';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <span
        className={`text-[10px] font-mono uppercase tracking-widest mb-1 px-1 ${
          isUser ? 'text-ink/40' : 'text-botanical-500'
        }`}
      >
        {isUser ? 'You' : 'Radiance AI'}
      </span>
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap
          ${isUser
            ? 'bg-botanical-500 text-white rounded-br-sm'
            : 'bg-white text-ink border border-line rounded-bl-sm'
          }
        `}
      >
        {message.content}
      </div>
    </div>
  );
}
