using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed class SchemaContext
{
    public IReadOnlyList<TableDoc> Tables { get; init; } = new List<TableDoc>();
}

