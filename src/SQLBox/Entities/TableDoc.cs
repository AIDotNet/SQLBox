using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed class TableDoc
{
    public string Schema { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string[] Aliases { get; init; } = System.Array.Empty<string>();
    public string Description { get; init; } = string.Empty;
    public IReadOnlyList<ColumnDoc> Columns { get; init; } = new List<ColumnDoc>();
    public IReadOnlyList<string> PrimaryKey { get; init; } = new List<string>();

    // Foreign key: local column -> (ref table, ref column)
    public IReadOnlyList<(string Column, string RefTable, string RefColumn)> ForeignKeys { get; init; }
        = new List<(string Column, string RefTable, string RefColumn)>();

    public IReadOnlyDictionary<string, object?>? Stats { get; init; }
    public float[]? Vector { get; set; }
}
