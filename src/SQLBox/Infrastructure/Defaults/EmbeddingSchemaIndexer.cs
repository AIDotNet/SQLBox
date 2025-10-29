using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SQLBox.Entities;

namespace SQLBox.Infrastructure.Defaults;

public sealed class EmbeddingSchemaIndexer : ISchemaIndexer
{
    private readonly IEmbedder _embedder;
    public EmbeddingSchemaIndexer(IEmbedder embedder) => _embedder = embedder;

    public async Task<SchemaIndex> BuildAsync(DatabaseSchema schema, CancellationToken ct = default)
    {
        // Vectorize tables/columns; do not build keyword/BM25/graph indices.
        foreach (var t in schema.Tables)
        {
            var tText = string.Join(" ", new[] { t.Name, t.Description }.Concat(t.Aliases));
            var tv = await _embedder.EmbedAsync(tText, ct);
            (t as TableDoc).Vector = tv;

            foreach (var c in t.Columns)
            {
                var cText = string.Join(" ", new[] { c.Name, c.Description }.Concat(c.Aliases));
                var cv = await _embedder.EmbedAsync(cText, ct);
                (c as ColumnDoc).Vector = cv;
            }
        }

        return new SchemaIndex
        {
            KeywordToTables = new Dictionary<string, HashSet<string>>(),
            KeywordToColumns = new Dictionary<string, HashSet<(string Table, string Column)>>(),
            Graph = new Dictionary<string, HashSet<string>>()
        };
    }
}
