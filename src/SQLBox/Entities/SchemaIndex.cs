using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed class SchemaIndex
{
    // Simple inverted index for quick keyword -> table/column lookup.
    public IReadOnlyDictionary<string, HashSet<string>> KeywordToTables { get; init; }
        = new Dictionary<string, HashSet<string>>();

    public IReadOnlyDictionary<string, HashSet<(string Table, string Column)>> KeywordToColumns { get; init; }
        = new Dictionary<string, HashSet<(string Table, string Column)>>();

    // Undirected graph: table -> neighbor tables (via FK or inferred joins)
    public IReadOnlyDictionary<string, HashSet<string>> Graph { get; init; }
        = new Dictionary<string, HashSet<string>>();
}
