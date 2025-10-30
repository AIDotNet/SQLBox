import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { ChatMessage } from '@/types/message';
import { Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">👋 你好！</p>
          <p>输入你的问题，我会帮你生成 SQL 查询</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      {isStreaming && (
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
          <div className="text-sm text-muted-foreground">正在思考...</div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
