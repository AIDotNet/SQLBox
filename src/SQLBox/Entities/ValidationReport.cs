using System.Collections.Generic;

namespace SQLBox.Entities;

public sealed record ValidationReport(
    bool IsValid,
    string[] Warnings,
    string[] Errors,
    string[] TouchedTables,
    string Confidence
);

