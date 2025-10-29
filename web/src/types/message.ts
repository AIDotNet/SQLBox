// SSE消息类型
export type SSEMessageType = 'Text' | 'Sql' | 'Data' | 'Chart' | 'Error' | 'Done';

export interface SSEMessage {
  type: SSEMessageType;
  messageId: string;
  timestamp: number;
}

export interface TextMessage extends SSEMessage {
  type: 'Text';
  content: string;
}

export interface SqlMessage extends SSEMessage {
  type: 'Sql';
  sql: string;
  tables: string[];
  dialect?: string;
}

export interface DataMessage extends SSEMessage {
  type: 'Data';
  columns: string[];
  rows: any[][];
  totalRows: number;
}

export interface ChartMessage extends SSEMessage {
  type: 'Chart';
  chartType: string;
  config: ChartConfig;
  data: any;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string[];
  title?: string;
  showLegend: boolean;
}

export interface ErrorMessage extends SSEMessage {
  type: 'Error';
  code: string;
  message: string;
  details?: string;
}

export interface DoneMessage extends SSEMessage {
  type: 'Done';
  elapsedMs: number;
}

// 聊天消息
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sql?: string;
  data?: DataMessage;
  chart?: ChartMessage;
  error?: ErrorMessage;
}

// 聊天请求
export interface CompletionRequest {
  connectionId: string;
  question: string;
  execute?: boolean;
  maxRows?: number;
  suggestChart?: boolean;
  dialect?: string;
}
