// ============================================
// SSE 消息类型定义（后端 → 前端）
// ============================================

/** SSE 事件类型 */
export type SSEEventType = 'delta' | 'block' | 'done' | 'error';

/** 基础 SSE 消息 */
export interface SSEMessage {
  type: SSEEventType;
}

/** 增量文本消息（流式文本输出） */
export interface DeltaMessage extends SSEMessage {
  type: 'delta';
  delta: string;
}

/** 内容块消息（SQL、数据、图表等特殊内容） */
export interface BlockMessage extends SSEMessage {
  type: 'block';
  block: ContentBlock;
}

/** 完成消息 */
export interface DoneMessage extends SSEMessage {
  type: 'done';
  elapsedMs: number;
}

/** 错误消息 */
export interface ErrorMessage extends SSEMessage {
  type: 'error';
  code: string;
  message: string;
  details?: string;
}

// ============================================
// 内容块类型定义
// ============================================

/** 内容块类型 */
export type ContentBlockType = 'sql' | 'data' | 'chart' | 'error';

/** 内容块基础接口 */
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
}

// ============================================
// 统一内容流类型定义（新架构）
// ============================================

/** 内容项类型 - 包含所有可能的内容类型 */
export type ContentItemType = 'text' | 'sql' | 'data' | 'chart' | 'error';

/** 内容项基础接口 */
export interface ContentItem {
  id: string;
  type: ContentItemType;
}

/** 文本内容项 */
export interface TextContentItem extends ContentItem {
  type: 'text';
  content: string;
}

/** SQL 内容项 */
export interface SqlContentItem extends ContentItem {
  type: 'sql';
  sql: string;
  tables: string[];
  dialect?: string;
}

/** 数据表格内容项 */
export interface DataContentItem extends ContentItem {
  type: 'data';
  columns: string[];
  rows: any[][];
  totalRows: number;
}

/** 图表内容项 */
export interface ChartContentItem extends ContentItem {
  type: 'chart';
  chartType: string;
  echartsOption?: string;
  config: ChartConfig;
  data: any;
}

/** 错误内容项 */
export interface ErrorContentItem extends ContentItem {
  type: 'error';
  code: string;
  message: string;
  details?: string;
}

/** SQL 代码块 */
export interface SqlBlock extends ContentBlock {
  type: 'sql';
  sql: string;
  tables: string[];
  dialect?: string;
}

/** 数据表格块 */
export interface DataBlock extends ContentBlock {
  type: 'data';
  columns: string[];
  rows: any[][];
  totalRows: number;
}

/** 图表块 */
export interface ChartBlock extends ContentBlock {
  type: 'chart';
  chartType: string;
  echartsOption?: string; // ECharts option 配置 JSON 字符串
  config: ChartConfig;
  data: any;
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string[];
  title?: string;
  showLegend: boolean;
}

/** 错误块 */
export interface ErrorBlock extends ContentBlock {
  type: 'error';
  code: string;
  message: string;
  details?: string;
}

// ============================================
// 聊天消息定义
// ============================================

/** 消息状态 */
export type MessageStatus = 'streaming' | 'complete' | 'error';

/** 聊天消息（使用统一内容流） */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  contentItems: ContentItem[];  // 统一内容流：按接收顺序的所有内容（text、sql、data、chart、error）
  timestamp: number;
  status: MessageStatus;
}

// 聊天消息（用于对话历史）
export interface ChatRequestMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 聊天请求
export interface CompletionRequest {
  connectionId: string;
  messages: ChatRequestMessage[];  // 对话历史记录列表
  execute?: boolean;
  maxRows?: number;
  suggestChart?: boolean;
  dialect?: string;
  providerId: string;
  model: string;
}
