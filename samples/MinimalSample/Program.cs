using System;
using System.ClientModel;
using System.Collections.Generic;
using System.Threading.Tasks;
using SQLBox.Entities;
using SQLBox.Facade;
using SQLBox.Infrastructure;
using SQLBox.Infrastructure.Defaults;
using SQLBox.Infrastructure.Providers.ExtensionsAI;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using MinimalSample;
using OpenAI;

class Program
{
    static async Task Main()
    {
        // 1) 构造一个最小 Schema（仅 1 张表）
        var schema = new DatabaseSchema
        {
            Name = "demo",
            Dialect = "sqlite",
            Tables = new List<TableDoc>
            {
                new TableDoc
                {
                    Schema = "main",
                    Name = "orders",
                    Description = "customer orders with amounts",
                    Columns = new List<ColumnDoc>
                    {
                        new ColumnDoc { Name = "id", DataType = "INTEGER", Nullable = false },
                        new ColumnDoc { Name = "customer", DataType = "TEXT", Nullable = true },
                        new ColumnDoc { Name = "amount", DataType = "REAL", Nullable = true },
                        new ColumnDoc { Name = "created_at", DataType = "TEXT", Nullable = true },
                    },
                    PrimaryKey = new List<string> { "id" },
                    ForeignKeys = new List<(string, string, string)>()
                }
            }
        };

        // 2) 为 EXPLAIN 预览准备一个共享内存 SQLite 连接，并插入少量数据
        var connFactory = new SqliteConnectionFactory("Data Source=DemoDb;Mode=Memory;Cache=Shared");
        await using var keepAlive = connFactory.CreateConnection();
        await keepAlive.OpenAsync();
        await using (var cmd = keepAlive.CreateCommand())
        {
            cmd.CommandText = @"CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY,
                customer TEXT,
                amount REAL,
                created_at TEXT
            );";
            await cmd.ExecuteNonQueryAsync();
        }
        await using (var cmd = keepAlive.CreateCommand())
        {
            cmd.CommandText = @"INSERT INTO orders (customer, amount, created_at) VALUES
                ('alice', 120.5, '2025-10-20'),
                ('bob',   75.0,  '2025-10-21'),
                ('alice', 35.2,  '2025-10-22')";
            try { await cmd.ExecuteNonQueryAsync(); } catch { /* ignore on re-run */ }
        }

        // 3) 配置 SQL 生成引擎（InMemory Schema + 缓存 + SQLite 执行沙箱）
        SqlGen.Configure(b =>
        {
            b.WithSchemaProvider(new InMemorySchemaProvider(schema));
            b.WithCache(new InMemorySemanticCache());
            b.WithExecutor(new SqliteExecutorSandbox(connFactory));

            // 如果存在 OPENAI_API_KEY：使用 OpenAI SDK 适配（LLM + Embedding）
            var endpoint = "https://api.token-ai.cn/v1";
            
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            var model = Environment.GetEnvironmentVariable("OPENAI_MODEL") ?? "gpt-5-mini";
            var embedModel = Environment.GetEnvironmentVariable("OPENAI_EMBED_MODEL") ?? "Qwen3-Embedding-0.6B";
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                var openAiChat = new ChatClient(model, new ApiKeyCredential(apiKey),new OpenAIClientOptions()
                {
                    Endpoint =new Uri(endpoint),
                });
                var adapter = new OpenAiSdkChatClientAdapter(openAiChat);
                b.WithLlmClient(new ExtensionsAiLlmClient(adapter));

                var embedder = new CachingEmbedder(new OpenAIEmbedder(apiKey,embedModel,endpoint));
                b.WithSchemaIndexer(new EmbeddingSchemaIndexer(embedder));
                b.WithSchemaRetriever(new VectorSchemaRetriever(embedder));
            }
        });

        // 4) 提问并获得结果（可选设置 Execute=true 获取 EXPLAIN 预览）
        var question = "Top 5 customers by total order amount in last 7 days";
        var options = new AskOptions(
            Dialect: "sqlite",
            Execute: true,
            TopK: 1,
            ReturnExplanation: true,
            AllowWrite: false
        );

        var result = await SqlGen.AskAsync(question, options);

        Console.WriteLine("=== SQL RESULT ===");
        Console.WriteLine($"Dialect: {result.Dialect}");
        Console.WriteLine($"SQL: {result.Sql}");
        Console.WriteLine($"TouchedTables: {string.Join(", ", result.TouchedTables)}");
        if (!string.IsNullOrWhiteSpace(result.Explanation))
            Console.WriteLine($"Explanation: {result.Explanation}");
        if ((result.Warnings?.Length ?? 0) > 0)
            Console.WriteLine("Warnings:\n - " + string.Join("\n - ", result.Warnings));
        if (!string.IsNullOrWhiteSpace(result.ExecutionPreview))
        {
            Console.WriteLine("\n=== EXPLAIN PREVIEW ===");
            Console.WriteLine(result.ExecutionPreview);
        }
    }
}


