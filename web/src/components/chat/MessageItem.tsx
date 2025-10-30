import { Card } from '@/components/ui/card';
import type { ChatMessage } from '@/types/message';
import { User, Bot, Code } from 'lucide-react';

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : ''}`}>
        <Card className={`p-4 ${isUser ? 'bg-primary text-primary-foreground' : ''}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </Card>

        {message.sql && (
          <Card className="p-4 bg-muted">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Code className="w-4 h-4" />
              生成的 SQL
            </div>
            <pre className="text-sm font-mono overflow-x-auto">
              {message.sql}
            </pre>
          </Card>
        )}

        {message.data && (
          <Card className="p-4">
            <div className="text-sm font-medium mb-2">
              查询结果 ({message.data.totalRows} 行)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {message.data.columns.map((col) => (
                      <th key={col} className="p-2 text-left font-medium">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {message.data.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b">
                      {row.map((cell, j) => (
                        <td key={j} className="p-2">
                          {cell?.toString() || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {message.data.totalRows > 10 && (
                <div className="text-xs text-muted-foreground mt-2">
                  仅显示前 10 行，共 {message.data.totalRows} 行
                </div>
              )}
            </div>
          </Card>
        )}

        {message.error && (
          <Card className="p-4 border-destructive bg-destructive/10">
            <div className="text-sm font-medium text-destructive mb-1">
              错误
            </div>
            <p className="text-sm">{message.error.message}</p>
          </Card>
        )}

        <div className="text-xs text-muted-foreground px-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
