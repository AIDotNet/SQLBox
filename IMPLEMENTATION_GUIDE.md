# SQLBox 前后端完整实现指南

## 已完成的后端实现

### 1. 数据模型和DTO
✅ `DatabaseConnection.cs` - 数据库连接实体
✅ `SSEMessage.cs` - SSE消息类型（Text, Sql, Data, Chart, Error, Done）
✅ `ConnectionDto.cs` - 连接管理DTO
✅ `CompletionInput.cs` - 聊天请求DTO

### 2. API服务
✅ `ConnectionService.cs` - 连接管理API
  - GET /api/connections - 获取所有连接
  - GET /api/connections/{id} - 获取单个连接
  - POST /api/connections - 创建连接
  - PUT /api/connections/{id} - 更新连接
  - DELETE /api/connections/{id} - 删除连接
  - POST /api/connections/{id}/test - 测试连接

✅ `ChatService.cs` - SSE流式聊天API
  - POST /api/chat/completion - SSE流式对话接口

### 3. 基础设施
✅ `IDatabaseConnectionManager.cs` - 连接管理接口
✅ `InMemoryDatabaseConnectionManager.cs` - 内存实现
✅ `Program.cs` - 应用配置（CORS, MiniApi, 静态文件）

## 前端实现计划

### 1. 安装依赖
```bash
cd web
bun install zustand @tanstack/react-query recharts
bun install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast
```

### 2. 核心文件结构
```
src/
├── types/
│   ├── connection.ts          ✅ 已创建
│   └── message.ts             ✅ 已创建
├── services/
│   ├── api.ts                 ✅ 已创建
│   └── sse.ts                 ✅ 已创建
├── stores/
│   ├── connectionStore.ts     ✅ 已创建（需安装依赖）
│   ├── chatStore.ts           📝 待创建
│   └── themeStore.ts          📝 待创建
├── hooks/
│   ├── useConnections.ts      📝 待创建
│   └── useSSE.ts              📝 待创建
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      📝 待创建
│   │   ├── Sidebar.tsx        📝 待创建
│   │   ├── Header.tsx         📝 待创建
│   │   └── ThemeProvider.tsx  📝 待创建
│   ├── connections/
│   │   ├── ConnectionList.tsx 📝 待创建
│   │   ├── ConnectionForm.tsx 📝 待创建
│   │   └── ConnectionCard.tsx 📝 待创建
│   └── chat/
│       ├── ChatContainer.tsx  📝 待创建
│       ├── MessageList.tsx    📝 待创建
│       ├── MessageItem.tsx    📝 待创建
│       ├── ChatInput.tsx      📝 待创建
│       ├── SqlDisplay.tsx     📝 待创建
│       ├── DataTable.tsx      📝 待创建
│       └── ChartDisplay.tsx   📝 待创建
├── pages/
│   ├── ConnectionsPage.tsx    📝 待创建
│   └── ChatPage.tsx           📝 待创建
└── App.tsx                     📝 需更新

```

### 3. 主题配置
使用 CSS 变量实现主题切换：
- 亮色主题
- 暗色主题
- 持久化到 localStorage

### 4. 路由结构
```
/ - ChatPage（主页面，带连接选择）
/connections - ConnectionsPage（连接管理）
```

## 核心功能流程

### 连接管理流程
1. 用户创建/编辑连接
2. 填写连接信息（名称、类型、连接字符串）
3. 测试连接
4. 保存连接
5. 选择活动连接

### 对话查询流程
1. 用户选择一个连接
2. 输入自然语言问题
3. 通过 SSE 发送请求到后端
4. 实时接收流式响应：
   - 文本消息（处理进度）
   - SQL语句（生成的SQL）
   - 数据结果（查询结果）
   - 图表配置（可视化建议）
   - 完成消息（耗时统计）
5. 前端渲染各类型消息
6. 支持数据表格展示
7. 支持图表可视化

## 下一步操作

1. **安装前端依赖**
```bash
cd web
bun install
```

2. **运行后端**
```bash
cd src/SQLBox.Hosting
dotnet run
```

3. **运行前端**
```bash
cd web
bun run dev
```

4. **完成剩余组件开发**
   - 聊天状态管理
   - 主题管理
   - 自定义 Hooks
   - UI 组件
   - 页面组件

## 技术亮点

### 后端
- ✅ 使用 SSE 实现流式响应
- ✅ 自定义消息协议支持多种类型
- ✅ 连接管理支持 CRUD
- ✅ 集成 SQLBox 核心功能
- ✅ 支持连接字符串脱敏

### 前端
- ✅ TypeScript 类型安全
- ✅ Zustand 状态管理
- ✅ React Query 数据获取
- ✅ Shadcn/ui 组件库
- ✅ Tailwind CSS 样式
- ✅ 响应式设计
- ✅ 主题切换
- ✅ SSE 流式处理
- ✅ 图表可视化

## API 测试示例

### 创建连接
```bash
curl -X POST http://localhost:5000/api/connections \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My SQLite DB",
    "databaseType": "sqlite",
    "connectionString": "Data Source=test.db"
  }'
```

### 聊天查询（SSE）
```bash
curl -X POST http://localhost:5000/api/chat/completion \
  -H "Content-Type: application/json" \
  -d '{
    "connectionId": "your-connection-id",
    "question": "显示所有用户",
    "execute": true
  }'
```

## 注意事项

1. **ConnectionId 是必需的** - 所有查询必须指定连接ID
2. **SSE 消息顺序** - 按 Text → Sql → Data → Chart → Done 的顺序
3. **错误处理** - 在任何阶段都可能返回 Error 消息
4. **连接脱敏** - API 返回的连接字符串已脱敏
5. **图表建议** - 根据数据结构自动推荐图表类型
