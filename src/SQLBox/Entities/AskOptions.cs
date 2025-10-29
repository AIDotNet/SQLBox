using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed record AskOptions(
    string? Dialect = null,
    bool Execute = false,
    int TopK = 8,
    bool ReturnExplanation = true,
    bool AllowWrite = false
);

