import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EChartsReact from 'echarts-for-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { format } from 'sql-formatter';
import type {
  ContentItem,
  TextContentItem,
  SqlContentItem,
  DataContentItem,
  ChartContentItem,
  ErrorContentItem,
} from '@/types/message';
import { Table, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentItemRendererProps {
  item: ContentItem;
  isUser?: boolean;
}

/**
 * 统一内容项渲染器
 * 根据内容类型（text、sql、data、chart、error）渲染对应的组件
 */
export function ContentItemRenderer({ item, isUser = false }: ContentItemRendererProps) {
  switch (item.type) {
    case 'text':
      return <TextItemRenderer item={item as TextContentItem} isUser={isUser} />;
    case 'sql':
      return <SqlItemRenderer item={item as SqlContentItem} />;
    case 'data':
      return <DataItemRenderer item={item as DataContentItem} />;
    case 'chart':
      return <ChartItemRenderer item={item as ChartContentItem} />;
    case 'error':
      return <ErrorItemRenderer item={item as ErrorContentItem} />;
    default:
      return null;
  }
}

// ============================================
// 文本内容项渲染器
// ============================================

function TextItemRenderer({ item, isUser }: { item: TextContentItem; isUser: boolean }) {
  if (!item.content) return null;

  return (
    <div className={cn("group relative max-w-full", isUser && "flex justify-end")}>
      <div
        className={cn(
          "inline-block px-3 py-2 rounded-md text-sm leading-snug",
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none dark:prose-invert">
          {item.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ============================================
// SQL 内容项渲染器
// ============================================

function SqlItemRenderer({ item }: { item: SqlContentItem }) {
  // 格式化 SQL
  let formattedSql = item.sql;
  try {
    formattedSql = format(item.sql, {
      language: 'sql',
      tabWidth: 2,
      keywordCase: 'upper',
    });
  } catch (error) {
    console.warn('SQL formatting failed, using original:', error);
  }

  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
      <div className="p-3">
        <div className="rounded-md border overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
          <SyntaxHighlighter
            language="sql"
            style={oneDark}
            customStyle={{
              margin: 0,
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            showLineNumbers
          >
            {formattedSql}
          </SyntaxHighlighter>
        </div>
        {item.tables.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">涉及表:</span>
            <div className="flex gap-1 flex-wrap">
              {item.tables.map((table) => (
                <Badge key={table} variant="secondary" className="text-xs">
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


function DataItemRenderer({ item }: { item: DataContentItem }) {
  const displayRows = item.rows.slice(0, 100); // 最多显示100行
  const hasMore = item.totalRows > displayRows.length;

  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-green-600 flex items-center justify-center">
            <Table className="w-3 h-3 text-white" />
          </div>
          <div className="text-sm">
            <div className="font-semibold">查询结果</div>
            <div className="text-xs text-muted-foreground">
              {item.totalRows} 行 × {item.columns.length} 列
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground border-b w-12">#</th>
              {item.columns.map((col) => (
                <th key={col} className="px-3 py-2 text-left font-medium text-xs text-muted-foreground border-b whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30 border-b last:border-b-0">
                <td className="px-3 py-2 text-xs text-muted-foreground">{rowIndex + 1}</td>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-xs max-w-xs truncate" title={String(cell)}>
                    {cell === null ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30 border-t text-center">
          显示前 {displayRows.length} 行，共 {item.totalRows} 行
        </div>
      )}
    </Card>
  );
}


function ChartItemRenderer({ item }: { item: ChartContentItem }) {
  let option: any = null;

  try {
    option = item.echartsOption;
    debugger
    if (typeof option === 'string') {
      function toObject(str: string) {
        return Function('"use strict";return (' + str + ')')();
      }
      option = toObject(option);
    }
    
  } catch (error) {
    console.error('Failed to parse ECharts option:', error);
  }

  if (!option) {
    return <ErrorItemRenderer item={{
      id: item.id,
      type: 'error',
      code: 'CHART_ERROR',
      message: '图表配置解析失败',
    }} />;
  }

  return (
    <Card className="overflow-hidden hover:border-ring transition-colors">
        <EChartsReact 
          option={option} 
          style={{ height: '400px', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
    </Card>
  );
}

// ============================================
// 错误内容项渲染器
// ============================================

function ErrorItemRenderer({ item }: { item: ErrorContentItem }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <div className="flex items-start gap-2 p-3">
        <div className="w-7 h-7 rounded-md bg-destructive flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-destructive-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-destructive mb-1">
            {item.code || 'ERROR'}
          </div>
          <div className="text-sm text-foreground mb-1">{item.message}</div>
          {item.details && (
            <details className="mt-2">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                查看详细信息
              </summary>
              <pre className="mt-2 text-xs p-2 bg-muted rounded overflow-x-auto max-h-40 overflow-y-auto scrollbar-thin">
                {item.details}
              </pre>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
}
