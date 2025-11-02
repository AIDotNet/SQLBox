import { useCallback, useState } from 'react';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';
import { useChatStore } from '@/stores/chatStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useAIProviderStore } from '@/stores/aiProviderStore';
import { sseClient } from '@/services/sse';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { 
  ChatMessage, 
  SSEMessage,
  DeltaMessage,
  BlockMessage,
  ErrorMessage,
  TextContentItem,
  SqlContentItem,
  DataContentItem,
  ChartContentItem,
  ErrorContentItem,
} from '@/types/message';
import { toast } from 'sonner';

export function ChatContainer() {
  const { messages, addMessage, updateLastMessage, deleteMessage, clearMessages, isStreaming, setStreaming } = useChatStore();
  const { selectedConnectionId } = useConnectionStore();
  const { selectedProviderId, selectedModel } = useAIProviderStore();

  const handleSend = useCallback(async (content: string) => {
    if (!selectedConnectionId) {
      toast.error('请先选择一个数据库连接');
      return;
    }

    if (!selectedProviderId || !selectedModel) {
      toast.error('请先选择 AI 提供商和模型');
      return;
    }

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      contentItems: [
        {
          id: `text-${Date.now()}`,
          type: 'text',
          content,
        } as TextContentItem
      ],
      timestamp: Date.now(),
      status: 'complete',
    };
    addMessage(userMessage);

    // 创建一个 AI 助手消息用于接收流式内容
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      contentItems: [], // 初始化为空数组，按接收顺序添加内容项
      timestamp: Date.now(),
      status: 'streaming',
    };
    addMessage(assistantMessage);

    // 启动流式会话
    setStreaming(true);

    try {
      // 构建对话历史记录（包含当前消息）
      // 提取所有文本内容项，合并为完整的对话文本
      const conversationHistory = [
        ...messages.map(msg => {
          // 将所有文本内容项合并
          const textContent = msg.contentItems
            .filter(item => item.type === 'text')
            .map(item => (item as TextContentItem).content)
            .join('\n');
          return {
            role: msg.role,
            content: textContent,
          };
        }),
        {
          role: 'user' as const,
          content,
        }
      ];

      await sseClient.sendMessage(
        {
          connectionId: selectedConnectionId,
          messages: conversationHistory,
          execute: true,
          suggestChart: true,
          providerId: selectedProviderId,
          model: selectedModel,
        },
        (message: SSEMessage) => {
          handleSSEMessage(message);
        }
      );
      
      // 流式完成，更新状态
      updateLastMessage({ status: 'complete' });
    } catch (error) {
      // 出错时创建错误内容项
      const errorItem: ErrorContentItem = {
        id: `error-${Date.now()}`,
        type: 'error',
        code: 'CLIENT_ERROR',
        message: error instanceof Error ? error.message : '发送消息失败',
      };
      
      updateLastMessage((prev) => ({
        contentItems: [...prev.contentItems, errorItem],
        status: 'error' as const,
      }));
    } finally {
      setStreaming(false);
    }
  }, [selectedConnectionId, selectedProviderId, selectedModel, messages, addMessage, updateLastMessage, setStreaming]);

  const handleSSEMessage = useCallback((message: SSEMessage) => {
    switch (message.type) {
      case 'delta': {
        // 增量文本消息 - 处理文本流
        const deltaMsg = message as DeltaMessage;
        
        updateLastMessage((prev) => {
          const contentItems = [...(prev.contentItems || [])];
          const lastItem = contentItems[contentItems.length - 1];
          
          // 如果最后一个内容项是文本类型，则累加文本
          if (lastItem && lastItem.type === 'text') {
            const textItem = lastItem as TextContentItem;
            const updatedTextItem: TextContentItem = {
              id: textItem.id,
              type: 'text',
              content: textItem.content + deltaMsg.delta,
            };
            contentItems[contentItems.length - 1] = updatedTextItem;
          } else {
            // 否则创建新的文本内容项
            const newTextItem: TextContentItem = {
              id: `text-${Date.now()}`,
              type: 'text',
              content: deltaMsg.delta,
            };
            contentItems.push(newTextItem);
          }
          
          return {
            contentItems,
          };
        });
        break;
      }
      case 'block': {
        // 内容块消息 - 转换为对应的 ContentItem 并添加
        const blockMsg = message as BlockMessage;
        const block = blockMsg.block;
        
        updateLastMessage((prev) => {
          const contentItems = [...(prev.contentItems || [])];
          
          // 根据块类型创建对应的 ContentItem
          switch (block.type) {
            case 'sql': {
              const sqlBlock = block as any;
              contentItems.push({
                id: block.id,
                type: 'sql',
                sql: sqlBlock.sql,
                tables: sqlBlock.tables,
                dialect: sqlBlock.dialect,
              } as SqlContentItem);
              break;
            }
            case 'data': {
              const dataBlock = block as any;
              contentItems.push({
                id: block.id,
                type: 'data',
                columns: dataBlock.columns,
                rows: dataBlock.rows,
                totalRows: dataBlock.totalRows,
              } as DataContentItem);
              break;
            }
            case 'chart': {
              const chartBlock = block as any;
              contentItems.push({
                id: block.id,
                type: 'chart',
                chartType: chartBlock.chartType,
                echartsOption: chartBlock.echartsOption,
                config: chartBlock.config,
                data: chartBlock.data,
              } as ChartContentItem);
              break;
            }
            case 'error': {
              const errorBlock = block as any;
              contentItems.push({
                id: block.id,
                type: 'error',
                code: errorBlock.code,
                message: errorBlock.message,
                details: errorBlock.details,
              } as ErrorContentItem);
              break;
            }
          }
          
          return {
            contentItems,
          };
        });
        break;
      }
      case 'error': {
        // 错误消息 - 转换为错误内容项
        const errorMsg = message as ErrorMessage;
        
        updateLastMessage((prev) => {
          const errorItem: ErrorContentItem = {
            id: `error-${Date.now()}`,
            type: 'error',
            code: errorMsg.code,
            message: errorMsg.message,
            details: errorMsg.details,
          };
          
          return {
            contentItems: [...prev.contentItems, errorItem],
            status: 'error' as const,
          };
        });
        break;
      }
      case 'done': {
        // 完成标记
        updateLastMessage({ status: 'complete' });
        break;
      }
    }
  }, [updateLastMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (isStreaming) {
      return; // 流式传输时不允许删除
    }
    deleteMessage(messageId);
  }, [deleteMessage, isStreaming]);

  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearHistory = useCallback(() => {
    if (isStreaming) {
      toast.error('正在处理流式响应，无法清空历史');
      return;
    }
    // 打开确认对话框（使用 UI 组件）
    setShowClearDialog(true);
  }, [isStreaming]);

  const confirmClearHistory = useCallback(() => {
    clearMessages();
    setShowClearDialog(false);
  }, [clearMessages]);

  return (
    <div className="flex flex-col h-full w-full overflow-x-hidden">{/* 添加 overflow-x-hidden 防止横向滚动 */}
      <div className="flex-1 min-h-0 flex justify-center overflow-hidden">
        <div className="w-full max-w-6xl flex flex-col">
          {/* 消息列表区域 - 占据主要空间 */}
          <div className="flex-1 min-h-0">
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onDeleteMessage={handleDeleteMessage}
            />
          </div>
        </div>
      </div>
      
      {/* 输入区域 - 固定在底部 */}
      <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto p-4">
          {/* 清空历史按钮（仅提供一个操作） */}
          <div className="mb-2 flex justify-end">
            <Button size="icon" variant="ghost" onClick={handleClearHistory} title="清空历史" aria-label="清空历史">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* 清空历史确认对话框（替代 window.confirm） */}
          <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认清空会话历史</AlertDialogTitle>
                <AlertDialogDescription>清空后将无法恢复，确定要继续吗？</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={confirmClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">清空</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <ChatInput onSend={handleSend} disabled={isStreaming || !selectedConnectionId} />
          {!selectedConnectionId && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              请先在连接管理页面选择一个数据库连接
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
