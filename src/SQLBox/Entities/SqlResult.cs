using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed record SqlResult(
    string Sql,
    IReadOnlyDictionary<string, object?> Parameters,
    string Dialect,
    string[] TouchedTables,
    string Explanation,
    string Confidence,
    string[] Warnings,
    string? ExecutionPreview
);

