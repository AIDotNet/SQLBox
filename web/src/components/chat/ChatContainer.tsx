import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { useChatStore } from '@/stores/chatStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { sseClient } from '@/services/sse';
import type { ChatMessage, SSEMessage, SqlMessage, DataMessage, ErrorMessage } from '@/types/message';

export function ChatContainer() {
  const { messages, addMessage, isStreaming, setStreaming } = useChatStore();
  const { selectedConnectionId } = useConnectionStore();
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<ChatMessage | null>(null);

  const handleSend = useCallback(async (content: string) => {
    if (!selectedConnectionId) {
      alert('请先选择一个数据库连接');
      return;
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // 创建助手消息
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    setCurrentAssistantMessage(assistantMessage);
    setStreaming(true);

    try {
      await sseClient.sendMessage(
        {
          connectionId: selectedConnectionId,
          question: content,
          execute: true,
          suggestChart: true,
        },
        (message: SSEMessage) => {
          handleSSEMessage(message, assistantMessage);
        }
      );
    } catch (error) {
      assistantMessage.error = {
        type: 'Error',
        messageId: Date.now().toString(),
        timestamp: Date.now(),
        code: 'CLIENT_ERROR',
        message: error instanceof Error ? error.message : '发送消息失败',
      };
      addMessage(assistantMessage);
    } finally {
      setStreaming(false);
      setCurrentAssistantMessage(null);
    }
  }, [selectedConnectionId, addMessage, setStreaming]);

  const handleSSEMessage = (message: SSEMessage, assistantMessage: ChatMessage) => {
    switch (message.type) {
      case 'Text':
        assistantMessage.content += (message as any).content + '\n';
        setCurrentAssistantMessage({ ...assistantMessage });
        break;

      case 'Sql':
        const sqlMsg = message as SqlMessage;
        assistantMessage.sql = sqlMsg.sql;
        setCurrentAssistantMessage({ ...assistantMessage });
        break;

      case 'Data':
        const dataMsg = message as DataMessage;
        assistantMessage.data = dataMsg;
        setCurrentAssistantMessage({ ...assistantMessage });
        break;

      case 'Error':
        const errorMsg = message as ErrorMessage;
        assistantMessage.error = errorMsg;
        setCurrentAssistantMessage({ ...assistantMessage });
        break;

      case 'Done':
        addMessage(assistantMessage);
        break;
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <MessageList
        messages={currentAssistantMessage ? [...messages, currentAssistantMessage] : messages}
        isStreaming={isStreaming}
      />
      <div className="p-4 border-t">
        <ChatInput onSend={handleSend} disabled={isStreaming || !selectedConnectionId} />
        {!selectedConnectionId && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            请先在连接管理页面选择一个数据库连接
          </p>
        )}
      </div>
    </Card>
  );
}
