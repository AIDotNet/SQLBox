import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { ContentItemRenderer } from './ContentItemRenderer';
import type { ChatMessage } from '@/types/message';
import { User, Bot, Loader2, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageItemV2Props {
  message: ChatMessage;
  onDelete?: (messageId: string) => void;
  onSelectContext?: (text: string) => void;
}

/**
 * 新版消息项组件 - 使用统一内容流渲染
 * 支持按接收顺序渲染 text、sql、data、chart、error 等不同类型的内容
 */
export function MessageItem({ message, onDelete, onSelectContext }: MessageItemV2Props) {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(message.id);
    setShowDeleteDialog(false);
  };

  const handleInsertContext = () => {
    // 提取所有文本内容项
    const textContent = message.contentItems
      .filter(item => item.type === 'text')
      .map(item => (item as any).content)
      .join('\n');
    if (!textContent) return;
    onSelectContext?.(textContent);
  };

  return (
    <div
      className={cn(
        "group/message flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser && "flex-row-reverse"
      )}
    >
      {/* 头像 */}
      <div
        className={cn(
          "w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-sm",
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn("flex-1 space-y-3 max-w-4xl", isUser && "items-end")}>
        {/* 渲染所有内容项（按接收顺序） */}
        {message.contentItems.map((item) => (
          <ContentItemRenderer key={item.id} item={item} isUser={isUser} />
        ))}
        
        {/* 流式加载指示器 */}
        {isStreaming && (
          <div className={cn("flex items-center gap-2", isUser && "justify-end")}>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-muted-foreground">AI 正在思考...</span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {!isStreaming && (
          <div className={cn("flex items-center gap-2 opacity-0 group-hover/message:opacity-100 transition-opacity", isUser && "justify-end")}>
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDeleteClick}
                title="删除此消息"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                删除
              </Button>
            )}
            {onSelectContext && message.contentItems.some(item => item.type === 'text') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleInsertContext}
                title="引用此消息"
              >
                <Copy className="h-3 w-3 mr-1" />
                引用
              </Button>
            )}
          </div>
        )}

        {/* 时间戳 */}
        <div className={cn("flex items-center gap-2 text-xs text-muted-foreground px-1", isUser && "justify-end")}>
          <span>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除消息</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除这条{isUser ? '用户' : 'AI'}消息吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
