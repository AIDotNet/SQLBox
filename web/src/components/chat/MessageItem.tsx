import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EChartsReact from 'echarts-for-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
import type { ChatMessage, ContentBlock, SqlBlock, DataBlock, ChartBlock, ErrorBlock } from '@/types/message';
import { User, Bot, Code, Table, BarChart3, AlertCircle, Loader2, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: ChatMessage;
  onDelete?: (messageId: string) => void;
  onSelectContext?: (text: string) => void;
}

export function MessageItem({ message, onDelete, onSelectContext }: MessageItemProps) {
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
    if (!message.content) return;
    onSelectContext?.(message.content);
  };

  return (
    <div className={cn(
      "group/message flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser && "flex-row-reverse"
    )}>
      {/* 头像（更紧凑） */}
      <div
        className={cn(
          "w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 text-sm",
          isUser 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn("flex-1 space-y-2 max-w-4xl", isUser && "items-end")}>
        {/* 主要文本内容（使用 Markdown 渲染，样式更紧凑） */}
        {message.content && (
          <div className={cn("group relative max-w-full", isUser && "flex justify-end")}>
            <div
              className={cn(
                "inline-block px-3 py-2 rounded-md text-sm leading-snug",
                isUser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <MarkdownRenderer content={message.content} />
               {isStreaming && (
                 <span className="inline-block w-2 h-4 ml-1 bg-current/70 animate-pulse rounded" />
               )}
             </div>
             {/* 删除/引用按钮 - 悬停时显示 */}
             {onDelete && !isStreaming && (
               <Button
                 variant="ghost"
                 size="icon"
                 className={cn(
                   "absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7",
                   isUser ? "-left-8" : "-right-8"
                 )}
                 onClick={handleDeleteClick}
                 title="删除此消息"
               >
                 <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
               </Button>
             )}

            {onSelectContext && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7",
                  isUser ? "-right-8" : "-left-8"
                )}
                onClick={handleInsertContext}
                title="引用此消息到输入框"
              >
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </Button>
            )}
           </div>
         )}

        {/* 内容块渲染 */}
        {message?.blocks?.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}

        {/* 时间戳和状态（更小的字体） */}
        <div className={cn(
          "flex items-center gap-2 text-xs text-muted-foreground px-1",
          isUser && "justify-end"
        )}>
          {isStreaming && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>处理中</span>
            </>
          )}
          <span>{new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// 内容块渲染器（保留逻辑，仅调整样式以更紧凑）
// ============================================

interface BlockRendererProps {
  block: ContentBlock;
}

function BlockRenderer({ block }: BlockRendererProps) {
  switch (block.type) {
    case 'sql':
      return <SqlBlockRenderer block={block as SqlBlock} />;
    case 'data':
      return <DataBlockRenderer block={block as DataBlock} />;
    case 'chart':
      return <ChartBlockRenderer block={block as ChartBlock} />;
    case 'error':
      return <ErrorBlockRenderer block={block as ErrorBlock} />;
    default:
      return null;
  }
}

// SQL 代码块
function SqlBlockRenderer({ block }: { block: SqlBlock }) {
  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Code className="w-3 h-3 text-primary-foreground" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold">生成的 SQL</div>
          {block.dialect && (
            <div className="text-xs text-muted-foreground">{block.dialect}</div>
          )}
        </div>
      </div>
      <div className="p-3">
        <pre className="text-sm font-mono overflow-x-auto p-3 bg-muted rounded-md border scrollbar-thin max-h-[300px] overflow-y-auto">
          <code className="text-foreground">{block.sql}</code>
        </pre>
        {block.tables.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">涉及表:</span>
            <div className="flex gap-1 flex-wrap">
              {block.tables.map((table) => (
                <Badge key={table} variant="secondary">
                  {table}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// 数据表格块
function DataBlockRenderer({ block }: { block: DataBlock }) {
  const displayRows = block.rows.slice(0, 10);
  
  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <Table className="w-3 h-3 text-primary-foreground" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold">查询结果</div>
          <div className="text-xs text-muted-foreground">共 {block.totalRows} 行数据</div>
        </div>
      </div>
      <div className="p-3">
        <div className="overflow-x-auto rounded-md border scrollbar-thin max-h-[360px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted z-10">
              <tr className="border-b">
                {block.columns.map((col) => (
                  <th key={col} className="px-3 py-2 text-left font-semibold whitespace-nowrap text-xs">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr 
                  key={i} 
                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                >
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap text-xs">
                      {cell?.toString() || <span className="text-muted-foreground italic">null</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {block.totalRows > 10 && (
          <div className="mt-2 text-xs text-center py-1 bg-muted rounded-md text-muted-foreground border">
            📊 仅显示前 10 行，共 {block.totalRows} 行数据
          </div>
        )}
      </div>
    </Card>
  );
}

// 图表块
function ChartBlockRenderer({ block }: { block: ChartBlock }) {
  const [option, setOption] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (block.echartsOption) {
      try {
        let parsedOption;
        if (typeof block.echartsOption === 'string') {
          // 使用 Function 构造函数安全地解析包含 JavaScript 代码的配置
          // 将字符串包装在返回语句中
          const func = new Function(`return ${block.echartsOption}`);
          parsedOption = func();
        } else {
          parsedOption = block.echartsOption;
        }
        setOption(parsedOption);
        setError(null);
      } catch (err) {
        setError('图表配置解析失败');
        console.error('Failed to parse ECharts option:', err);
      }
    }
  }, [block.echartsOption]);

  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <BarChart3 className="w-3 h-3 text-primary-foreground" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold">数据可视化</div>
          <div className="text-xs text-muted-foreground capitalize">{block.chartType}</div>
        </div>
      </div>
      <div className="p-3">
        {error ? (
          <div className="p-4 border border-destructive rounded-md bg-destructive/5 flex items-center justify-center min-h-[180px]">
            <div className="text-center text-destructive">
              <AlertCircle className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : option ? (
          <EChartsReact
            option={option}
            style={{ height: '300px', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className="p-4 border rounded-md bg-muted/30 flex items-center justify-center min-h-[180px]">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">等待图表数据...</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

// 错误块
function ErrorBlockRenderer({ block }: { block: ErrorBlock }) {
  return (
    <Card className="overflow-hidden border-destructive">
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border-b border-destructive/20">
        <div className="w-7 h-7 rounded-md bg-destructive flex items-center justify-center">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 text-sm">
          <div className="font-semibold text-destructive">执行错误</div>
          {block.code && (
            <Badge variant="destructive" className="text-xs font-mono mt-1">
              {block.code}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-3 bg-destructive/5">
        <p className="text-sm leading-relaxed">
          {block.message}
        </p>
        {block.details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors select-none">
              📋 查看详细信息
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded-md border overflow-x-auto scrollbar-thin max-h-[240px] overflow-y-auto text-xs">
              <code>{block.details}</code>
            </pre>
          </details>
        )}
      </div>
    </Card>
  );
}

// Markdown 渲染器（自定义组件，用于更好样式和交互）
function MarkdownRenderer({ content }: { content: string }) {
  const copyTimeoutRef = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const code = String(children).replace(/\n$/, '');

    if (inline) {
      return (
        <code className="bg-muted/60 text-xs font-mono px-1 py-[2px] rounded">{children}</code>
      );
    }

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
      } catch (e) {
        // ignore
      }
    };

    return (
      <div className="relative">
        <pre className="text-sm font-mono overflow-x-auto p-3 bg-muted rounded-md border scrollbar-thin max-h-[260px]">
          <code className={className} {...props}>{code}</code>
        </pre>
        <button
          onClick={handleCopy}
          title="复制代码"
          className="absolute top-2 right-2 bg-muted/60 hover:bg-muted/80 p-1 rounded text-muted-foreground"
        >
          <Copy className="w-4 h-4" />
          <span className="sr-only">复制</span>
        </button>
        {copied && (
          <div className="absolute top-2 right-10 bg-foreground text-foreground-foreground/90 text-xs px-2 py-1 rounded">已复制</div>
        )}
      </div>
    );
  };

  const components: any = {
    code: CodeBlock,
    a: ({ href, children }: any) => (
      <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary underline">
        {children}
      </a>
    ),
    table: ({ children }: any) => (
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm table-auto">{children}</table>
      </div>
    ),
    th: ({ children }: any) => (
      <th className="px-3 py-2 text-left font-semibold text-xs bg-muted/10">{children}</th>
    ),
    td: ({ children }: any) => (
      <td className="px-3 py-2 text-xs align-top">{children}</td>
    ),
    ul: ({ children }: any) => <ul className="ml-4 space-y-1 list-disc text-sm">{children}</ul>,
    ol: ({ children }: any) => <ol className="ml-4 space-y-1 list-decimal text-sm">{children}</ol>,
    li: ({ children }: any) => <li className="text-sm">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-muted pl-3 italic text-sm text-muted-foreground">{children}</blockquote>
    ),
    img: ({ src, alt }: any) => (
      // limit image size and keep responsive
      <img src={src} alt={alt} className="max-w-full rounded-md border" />
    ),
    p: ({ children }: any) => <p className="text-sm leading-relaxed m-0">{children}</p>,
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} className="whitespace-pre-wrap prose-sm m-0">
      {content}
    </ReactMarkdown>
  );
}
