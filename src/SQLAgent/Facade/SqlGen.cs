using System.Security.Cryptography;
using System.Text;
using SQLAgent.Entities;
using SQLAgent.Infrastructure;
using SQLAgent.Infrastructure.Defaults;

namespace SQLAgent.Facade;

public static class SqlGen
{
    private static readonly object InitLock = new();
    private static SqlGenEngine? _engine;

    public static void Configure(Action<SqlGenBuilder> configure)
    {
        var b = new SqlGenBuilder();
        configure(b);
        lock (InitLock)
        {
            _engine = b.Build();
        }
    }

    private static SqlGenEngine EnsureDefault()
    {
        lock (InitLock)
        {
            if (_engine != null) return _engine;
            var builder = new SqlGenBuilder();
            // Default empty schema + default components
            builder.WithSchemaProvider(new InMemorySchemaProvider(new DatabaseSchema { Name = "default", Dialect = "sqlite", Tables = new List<TableDoc>() }));
            builder.WithConnectionManager(new InMemoryDatabaseConnectionManager());
            _engine = builder.Build();
            return _engine!;
        }
    }

    // 初始化或更新指定连接的表向量索引
    // forceRebuild = true 将清空该连接下旧向量并全量重建；false 则仅增量更新过期或缺失的表向量
    public static async Task<int> BuildOrUpdateTableVectorIndexAsync(
        string connectionId,
        bool forceRebuild = false,
        Dictionary<string, string>? metaData = null,
        CancellationToken ct = default)
    {
        var engine = EnsureDefault();
        if (string.IsNullOrWhiteSpace(connectionId))
            throw new ArgumentException("connectionId is required.", nameof(connectionId));
        if (engine.SchemaProvider == null)
            throw new InvalidOperationException("No ISchemaProvider configured.");
        if (engine.TableVectorStore == null)
            throw new InvalidOperationException("No ITableVectorStore configured. Please configure a table vector store via SqlGenBuilder.WithTableVectorStore.");

        var schema = await engine.SchemaProvider.LoadAsync(ct);
        metaData ??= new Dictionary<string, string>();

        // 仅处理与目标 connectionId 匹配的表；未标注 ConnectionId 的表默认纳入
        var tables = schema.Tables
            .Where(t => string.IsNullOrWhiteSpace(t.ConnectionId) || string.Equals(t.ConnectionId, connectionId, StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (forceRebuild)
        {
            await engine.TableVectorStore.DeleteConnectionVectorsAsync(connectionId, ct);
            await engine.TableVectorStore.SaveTableVectorsBatchAsync(connectionId, tables, metaData, ct);
            return tables.Count;
        }

        var toUpdate = new List<TableDoc>();
        foreach (var t in tables)
        {
            var upToDate = await engine.TableVectorStore.IsTableVectorUpToDateAsync(connectionId, t, ct);
            if (!upToDate) toUpdate.Add(t);
        }

        if (toUpdate.Count > 0)
        {
            await engine.TableVectorStore.SaveTableVectorsBatchAsync(connectionId, toUpdate, metaData, ct);
        }
        return toUpdate.Count;
    }

    // 仅用于首次初始化：删除旧索引并全量重建
    public static Task<int> InitializeTableVectorIndexAsync(
        string connectionId,
        CancellationToken ct = default)
        => BuildOrUpdateTableVectorIndexAsync(connectionId, forceRebuild: true, metaData: null, ct: ct);

    // 增量更新：仅处理缺失或过期的表向量
    public static Task<int> UpdateTableVectorIndexAsync(
        string connectionId,
        CancellationToken ct = default)
        => BuildOrUpdateTableVectorIndexAsync(connectionId, forceRebuild: false, metaData: null, ct: ct);

    // 检查指定连接是否已有表向量索引
    public static async Task<bool> HasTableVectorIndexAsync(string connectionId, CancellationToken ct = default)
    {
        var engine = EnsureDefault();
        if (engine.TableVectorStore == null)
            throw new InvalidOperationException("No ITableVectorStore configured.");
        return await engine.TableVectorStore.HasConnectionVectorsAsync(connectionId, ct);
    }

    private static string ComputeCacheKey(string question, string dialect, SchemaContext ctx)
    {
        var tables = ctx.Tables.Select(t => t.Name).OrderBy(x => x, StringComparer.OrdinalIgnoreCase);
        var key = $"{dialect}\n{question}\n{string.Join(",", tables)}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(hash);
    }
}

public sealed class SqlGenBuilder
{
    internal ISchemaProvider SchemaProvider { get; private set; } = new InMemorySchemaProvider(new DatabaseSchema());

    internal IDatabaseConnectionManager? ConnectionManager { get; private set; }
    internal ITableVectorStore? TableVectorStore { get; private set; }

    public SqlGenBuilder WithSchemaProvider(ISchemaProvider x) { SchemaProvider = x; return this; }

    public SqlGenBuilder WithConnectionManager(IDatabaseConnectionManager x) { ConnectionManager = x; return this; }
    public SqlGenBuilder WithTableVectorStore(ITableVectorStore x) { TableVectorStore = x; return this; }

    public SqlGenEngine Build() => new(
        SchemaProvider,
        ConnectionManager,
        TableVectorStore
    );
}

public sealed class SqlGenEngine
{
    public ISchemaProvider SchemaProvider { get; }
    public IDatabaseConnectionManager? ConnectionManager { get; }
    public ITableVectorStore? TableVectorStore { get; }
    
    public SqlGenEngine(
        ISchemaProvider schemaProvider,
        IDatabaseConnectionManager? connectionManager,
        ITableVectorStore? tableVectorStore)
    {
        SchemaProvider = schemaProvider;
        ConnectionManager = connectionManager;
        TableVectorStore = tableVectorStore;
    }
}
