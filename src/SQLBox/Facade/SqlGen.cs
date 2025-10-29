using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SQLBox.Entities;
using SQLBox.Infrastructure;
using SQLBox.Infrastructure.Defaults;

namespace SQLBox.Facade;

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
            builder.WithCache(new InMemorySemanticCache());
            _engine = builder.Build();
            return _engine!;
        }
    }

    public static async Task<SqlResult> AskAsync(string question, AskOptions? options = null, CancellationToken ct = default)
    {
        var engine = EnsureDefault();
        options ??= new AskOptions();

        var normalized = await engine.InputNormalizer.NormalizeAsync(question, ct);
        var schema = await engine.SchemaProvider.LoadAsync(ct);
        var dialect = options.Dialect ?? schema.Dialect;
        var index = await engine.SchemaIndexer.BuildAsync(schema, ct);
        var context = await engine.SchemaRetriever.RetrieveAsync(normalized, schema, index, options.TopK, ct);

        // Semantic cache lookup (question + context tables + dialect)
        var cacheKey = ComputeCacheKey(normalized, dialect, context);
        if (engine.Cache != null && engine.Cache.TryGet(cacheKey, out var cached))
        {
            return cached;
        }

        var prompt = await engine.PromptAssembler.AssembleAsync(normalized, dialect, context, ct);
        var gen = await engine.LlmClient.GenerateAsync(prompt, dialect, context, ct);
        gen = await engine.PostProcessor.PostProcessAsync(gen, dialect, ct);

        var validation = await engine.Validator.ValidateAsync(gen.Sql, context, options, ct);

        // Optional simple repair loop (single attempt)
        if (!validation.IsValid && engine.Repair != null)
        {
            var repaired = await engine.Repair.TryRepairAsync(normalized, dialect, context, gen, validation, ct);
            if (repaired != null)
            {
                gen = repaired;
                validation = await engine.Validator.ValidateAsync(gen.Sql, context, options, ct);
            }
        }

        var warnings = validation.Warnings.ToList();
        if (!validation.IsValid)
        {
            warnings.AddRange(validation.Errors.Select(e => $"error: {e}"));
        }

        string? preview = null;
        if (options.Execute && engine.ExecutorSandbox != null && validation.IsValid)
        {
            try { preview = await engine.ExecutorSandbox.ExplainAsync(gen.Sql, dialect, ct); }
            catch (Exception ex) { warnings.Add($"execution: {ex.Message}"); }
        }
        else if (options.Execute && engine.ExecutorSandbox == null)
        {
            warnings.Add("execution disabled: no executor sandbox configured");
        }

        var result = new SqlResult(
            Sql: gen.Sql,
            Parameters: gen.Parameters,
            Dialect: dialect,
            TouchedTables: validation.TouchedTables,
            Explanation: options.ReturnExplanation ? BuildExplanation(normalized, context, gen, validation) : string.Empty,
            Confidence: validation.Confidence,
            Warnings: warnings.ToArray(),
            ExecutionPreview: preview
        );

        engine.Cache?.Set(cacheKey, result, TimeSpan.FromMinutes(10));
        return result;
    }

    private static string BuildExplanation(string question, SchemaContext ctx, GeneratedSql gen, ValidationReport report)
    {
        var tables = ctx.Tables.Select(t => t.Name).ToArray();
        return $"Question: {question}\nUsed tables: {string.Join(", ", tables)}\nConfidence: {report.Confidence}";
    }

    private static string ComputeCacheKey(string question, string dialect, SchemaContext ctx)
    {
        var tables = ctx.Tables.Select(t => t.Name).OrderBy(x => x, StringComparer.OrdinalIgnoreCase);
        var key = $"{dialect}\n{question}\n{string.Join(",", tables)}";
        var hash = System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(key));
        return Convert.ToHexString(hash);
    }
}

public sealed class SqlGenBuilder
{
    internal IInputNormalizer InputNormalizer { get; private set; } = new DefaultInputNormalizer();
    internal ISchemaProvider SchemaProvider { get; private set; } = new InMemorySchemaProvider(new DatabaseSchema());
    internal ISchemaIndexer SchemaIndexer { get; private set; } 
    internal ISchemaRetriever SchemaRetriever { get; private set; } 
    internal IPromptAssembler PromptAssembler { get; private set; } = new DefaultPromptAssembler();
    internal ILlmClient LlmClient { get; private set; } 
    internal ISqlPostProcessor PostProcessor { get; private set; } = new DefaultPostProcessor();
    internal ISqlValidator Validator { get; private set; } = new DefaultSqlValidator();
    internal IAutoRepair? Repair { get; private set; }
    internal IExecutorSandbox? ExecutorSandbox { get; private set; }
    internal ISemanticCache? Cache { get; private set; }

    public SqlGenBuilder WithInputNormalizer(IInputNormalizer x) { InputNormalizer = x; return this; }
    public SqlGenBuilder WithSchemaProvider(ISchemaProvider x) { SchemaProvider = x; return this; }
    public SqlGenBuilder WithSchemaIndexer(ISchemaIndexer x) { SchemaIndexer = x; return this; }
    public SqlGenBuilder WithSchemaRetriever(ISchemaRetriever x) { SchemaRetriever = x; return this; }
    public SqlGenBuilder WithPromptAssembler(IPromptAssembler x) { PromptAssembler = x; return this; }
    public SqlGenBuilder WithLlmClient(ILlmClient x) { LlmClient = x; return this; }
    public SqlGenBuilder WithPostProcessor(ISqlPostProcessor x) { PostProcessor = x; return this; }
    public SqlGenBuilder WithValidator(ISqlValidator x) { Validator = x; return this; }
    public SqlGenBuilder WithRepair(IAutoRepair? x) { Repair = x; return this; }
    public SqlGenBuilder WithExecutor(IExecutorSandbox? x) { ExecutorSandbox = x; return this; }
    public SqlGenBuilder WithCache(ISemanticCache? x) { Cache = x; return this; }

    public SqlGenEngine Build() => new(
        InputNormalizer,
        SchemaProvider,
        SchemaIndexer,
        SchemaRetriever,
        PromptAssembler,
        LlmClient,
        PostProcessor,
        Validator,
        Repair,
        ExecutorSandbox,
        Cache
    );
}

public sealed class SqlGenEngine
{
    public IInputNormalizer InputNormalizer { get; }
    public ISchemaProvider SchemaProvider { get; }
    public ISchemaIndexer SchemaIndexer { get; }
    public ISchemaRetriever SchemaRetriever { get; }
    public IPromptAssembler PromptAssembler { get; }
    public ILlmClient LlmClient { get; }
    public ISqlPostProcessor PostProcessor { get; }
    public ISqlValidator Validator { get; }
    public IAutoRepair? Repair { get; }
    public IExecutorSandbox? ExecutorSandbox { get; }
    public ISemanticCache? Cache { get; }

    public SqlGenEngine(
        IInputNormalizer inputNormalizer,
        ISchemaProvider schemaProvider,
        ISchemaIndexer schemaIndexer,
        ISchemaRetriever schemaRetriever,
        IPromptAssembler promptAssembler,
        ILlmClient llmClient,
        ISqlPostProcessor postProcessor,
        ISqlValidator validator,
        IAutoRepair? repair,
        IExecutorSandbox? executorSandbox,
        ISemanticCache? cache)
    {
        InputNormalizer = inputNormalizer;
        SchemaProvider = schemaProvider;
        SchemaIndexer = schemaIndexer;
        SchemaRetriever = schemaRetriever;
        PromptAssembler = promptAssembler;
        LlmClient = llmClient;
        PostProcessor = postProcessor;
        Validator = validator;
        Repair = repair;
        ExecutorSandbox = executorSandbox;
        Cache = cache;
    }
}
