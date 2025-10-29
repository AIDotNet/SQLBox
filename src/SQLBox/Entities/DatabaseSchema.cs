using System.Collections.Generic;
using System.Linq;

namespace SQLBox.Entities;

public sealed class DatabaseSchema
{
    public string Name { get; init; } = string.Empty;
    public string Dialect { get; init; } = "sqlite";
    public IReadOnlyList<TableDoc> Tables { get; init; } = new List<TableDoc>();

    public TableDoc? FindTable(string name)
        => Tables.FirstOrDefault(t => string.Equals(t.Name, name, System.StringComparison.OrdinalIgnoreCase)
                                       || t.Aliases.Contains(name, System.StringComparer.OrdinalIgnoreCase));
}

