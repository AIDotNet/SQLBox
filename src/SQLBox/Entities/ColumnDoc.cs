using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed class ColumnDoc
{
    public string Name { get; init; } = string.Empty;
    public string[] Aliases { get; init; } = System.Array.Empty<string>();
    public string Description { get; init; } = string.Empty;
    public string DataType { get; init; } = string.Empty;
    public bool Nullable { get; init; }
    public string? Default { get; init; }
    public IReadOnlyDictionary<string, object?>? Stats { get; init; }
    public float[]? Vector { get; set; }
}
