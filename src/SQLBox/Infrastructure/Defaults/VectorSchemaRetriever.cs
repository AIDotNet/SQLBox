using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SQLBox.Entities;

namespace SQLBox.Infrastructure.Defaults;

// Vector-only retriever: selects top-K tables by cosine similarity between
// question embedding and table embedding.
public sealed class VectorSchemaRetriever : ISchemaRetriever
{
    private readonly IEmbedder _embedder;
    public VectorSchemaRetriever(IEmbedder embedder) => _embedder = embedder;

    public async Task<SchemaContext> RetrieveAsync(string question, DatabaseSchema schema, SchemaIndex index, int topK, CancellationToken ct = default)
    {
        var qv = await _embedder.EmbedAsync(question, ct);
        var scores = new List<(TableDoc Table, double Score)>();

        foreach (var t in schema.Tables)
        {
            var tv = t.Vector;
            if (tv == null || tv.Length == 0)
            {
                // If missing, embed table metadata on the fly
                var text = string.Join(" ", new[] { t.Name, t.Description }.Concat(t.Aliases));
                tv = await _embedder.EmbedAsync(text, ct);
                (t as TableDoc).Vector = tv;
            }
            scores.Add((t, CosSim(qv, tv)));
        }

        var selected = scores.OrderByDescending(s => s.Score)
                              .Take(Math.Max(1, topK))
                              .Select(s => s.Table)
                              .ToList();

        return new SchemaContext { Tables = selected };

        static double CosSim(float[] a, float[] b)
        {
            var len = Math.Min(a.Length, b.Length);
            if (len == 0) return 0;
            double dot = 0, na = 0, nb = 0;
            for (int i = 0; i < len; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
            var denom = Math.Sqrt(na) * Math.Sqrt(nb);
            return denom > 0 ? dot / denom : 0;
        }
    }
}

