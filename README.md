# SQLBox

一个面向“自然语言 → 安全 SQL”的可扩展组件集合。通过 Facade `SqlGen.AskAsync(...)` 串联输入归一化、Schema 检索、提示词组装、LLM 生成、后处理与校验、（可选）只读执行预览等环节。

> 重要：本库默认不再内置任何 Mock/占位 AI。你必须显式注入真实的 LLM 与向量 Embedder，否则会抛出异常（`ThrowingLlmClient`/`ThrowingEmbedder`）。

## 快速开始

- 目标运行时：.NET 9/10
- 解决方案：`SQLBox.sln`
- 示例：`samples/MinimalSample`（演示如何注入 OpenAI LLM 与向量）

## 接入 OpenAI 向量（Embedding）

文件参考：`src/SQLBox/Infrastructure/OpenAIEmbedder.cs:1`

- 前置
  - 设置环境变量或以代码方式提供：
    - `OPENAI_API_KEY`：OpenAI API Key
    - `OPENAI_EMBED_MODEL`（可选，默认 `text-embedding-3-small`）
  - 本库已引用官方包 `OpenAI`，无需你在应用层再次添加（如果你以源码引用本项目）。

- 在应用的引导代码中（例如 Composition Root 或启动处）注入向量 Embedder：

```csharp
using SQLBox.Facade;
using SQLBox.Infrastructure;
using SQLBox.Infrastructure.Defaults;

// 假设你已有 DatabaseSchema 与其他必要对象
SqlGen.Configure(b =>
{
    // Schema 与缓存/执行沙箱等常规配置省略

    var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    var embedModel = Environment.GetEnvironmentVariable("OPENAI_EMBED_MODEL") ?? "text-embedding-3-small";
    if (string.IsNullOrWhiteSpace(apiKey))
        throw new InvalidOperationException("OPENAI_API_KEY is required for embedding.");

    // 仅使用 OpenAI 官方 Client 的向量实现（不自研）
    var embedder = new CachingEmbedder(new OpenAIEmbedder(apiKey, embedModel));
    b.WithSchemaIndexer(new EmbeddingSchemaIndexer(embedder));
    b.WithSchemaRetriever(new VectorSchemaRetriever(embedder));
});
```

- 运行时行为
  - `EmbeddingSchemaIndexer` 会为表/列生成向量；`VectorSchemaRetriever` 会根据问句向量 Top‑K 选择相关表。
  - 如未注入 Embedder，将在向量阶段抛出异常（`ThrowingEmbedder`）。

## 配置 LLM（必需）

SQL 生成需要一个实现了 `Microsoft.Extensions.AI.IChatClient` 的客户端。本库提供一个适配器用于将 OpenAI 官方 SDK 的 `ChatClient` 作为 `IChatClient` 使用（示例项目内）：

- 参考文件：`samples/MinimalSample/OpenAiSdkChatClientAdapter.cs:1`

示例注入（节选）：

```csharp
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using SQLBox.Infrastructure.Providers.ExtensionsAI;

SqlGen.Configure(b =>
{
    var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
    var model = Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? "gpt-4o-mini";

    var chat = new ChatClient(model, apiKey);
    var adapter = new MinimalSample.OpenAiSdkChatClientAdapter(chat); // 来自 samples 目录
    b.WithLlmClient(new ExtensionsAiLlmClient(adapter));
});
```

> 说明：你也可以用任意 `IChatClient` 实现注入，无需使用示例适配器。

## 提示词与安全约束

- 提示词组装：`src/SQLBox/Infrastructure/Defaults/DefaultImplementations.cs:65`
  - 只允许 `SELECT/EXPLAIN SELECT`
  - 仅使用检索得到的表
  - 建议显式列名、合理 LIMIT、参数化
  - 要求以严格 JSON 返回（`sql`/`params`/`tables`）
- 语句后处理与校验：
  - 参数占位规范化、只读/安全关键字检测、`SELECT *`/无 WHERE/LIMIT 提示等

## 示例运行

- 设置环境变量（PowerShell）

```powershell
$env:OPENAI_API_KEY = "sk-..."
$env:OPENAI_MODEL = "gpt-4o-mini"           # 可选
$env:OPENAI_EMBED_MODEL = "text-embedding-3-small"  # 可选
```

- 运行示例

```bash
dotnet run --project samples/MinimalSample
```

## 常见问题（FAQ）

- Q: 未配置任何 LLM 或向量会怎样？
  - A: 会分别在生成或向量阶段抛出异常（`ThrowingLlmClient`/`ThrowingEmbedder`），以确保不使用任何 Mock/占位实现。
- Q: 可以使用 Azure OpenAI 吗？
  - A: 可以。请在应用层构造其官方客户端并实现/适配为 `IChatClient`；向量同理，构造官方 Embedding 客户端后以 `OpenAIEmbedder` 的第二个构造（传入 `EmbeddingClient` 与 `model`）或扩展一个等价的实现。
