using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SQLBox.Entities;

namespace SQLBox.Prompts;

public static class SqlGenerationPromptTemplate
{
    public static string BuildPrompt(string userQuestion, string dialect, SchemaContext schemaContext)
    {
        var schemaDescription = BuildSchemaDescription(schemaContext);
        var rules = BuildSqlRules(dialect, schemaContext);
        var examples = BuildExamples(dialect);

        return $"""
            You are an expert SQL query generator with deep knowledge of database schemas and SQL optimization.

            DATABASE SCHEMA INFORMATION:
            {schemaDescription}

            SQL GENERATION RULES:
            {rules}

            EXAMPLES:
            {examples}

            USER QUESTION:
            {userQuestion}

            IMPORTANT REQUIREMENTS:
            1. Analyze the user's question carefully and identify the required tables and columns
            2. Use only the tables and columns that exist in the provided schema
            3. Follow the SQL dialect syntax: {dialect}
            4. Return your response as valid JSON with exactly these fields: sql (string), params (object), tables (string[])
            5. Ensure all table and column names match the schema exactly (case-sensitive)
            6. Use appropriate JOINs based on the foreign key relationships provided
            7. Add meaningful WHERE clauses to filter results appropriately
            8. Include ORDER BY clauses when logical ordering is implied
            9. Use LIMIT clauses for potentially large result sets
            10. Parameterize all literal values (dates, numbers, strings) using the params object

            Generate the SQL query now:
            """;
    }

    private static string BuildSchemaDescription(SchemaContext context)
    {
        if (context.Tables == null || context.Tables.Count == 0)
        {
            return "No table schema information available.";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Total tables available: {context.Tables.Count}");
        sb.AppendLine();

        foreach (var table in context.Tables.OrderBy(t => t.Name))
        {
            sb.AppendLine($"Table: {table.Name}");

            if (!string.IsNullOrEmpty(table.Schema))
                sb.AppendLine($"  Schema: {table.Schema}");

            if (!string.IsNullOrEmpty(table.Description))
                sb.AppendLine($"  Description: {table.Description}");

            if (table.Aliases?.Length > 0)
                sb.AppendLine($"  Aliases: {string.Join(", ", table.Aliases)}");

            sb.AppendLine($"  Columns ({table.Columns.Count}):");
            foreach (var column in table.Columns.OrderBy(c => c.Name))
            {
                var nullableIndicator = column.Nullable ? "NULL" : "NOT NULL";
                var defaultInfo = !string.IsNullOrEmpty(column.Default) ? $" DEFAULT {column.Default}" : "";
                var description = !string.IsNullOrEmpty(column.Description) ? $" - {column.Description}" : "";
                var aliases = column.Aliases?.Length > 0 ? $" (aliases: {string.Join(", ", column.Aliases)})" : "";

                sb.AppendLine($"    {column.Name}: {column.DataType} {nullableIndicator}{defaultInfo}{description}{aliases}");
            }

            if (table.PrimaryKey?.Count > 0)
            {
                sb.AppendLine($"  Primary Key: {string.Join(", ", table.PrimaryKey)}");
            }

            if (table.ForeignKeys?.Count > 0)
            {
                sb.AppendLine("  Foreign Keys:");
                foreach (var fk in table.ForeignKeys)
                {
                    sb.AppendLine($"    {fk.Column} -> {fk.RefTable}.{fk.RefColumn}");
                }
            }

            sb.AppendLine();
        }

        return sb.ToString().Trim();
    }

    private static string BuildSqlRules(string dialect, SchemaContext context)
    {
        var rules = new List<string>
        {
            $"SQL Dialect: {dialect}",
            "Only generate SELECT queries (no INSERT, UPDATE, DELETE, DDL statements)",
            "Use explicit column names instead of SELECT *",
            "Add appropriate WHERE clauses to filter results",
            "Use JOINs when multiple tables are needed based on foreign key relationships",
            "Include ORDER BY clauses for logical ordering",
            "Add LIMIT clauses for large potential result sets",
            "Parameterize all literal values using the params object",
            "Return results as valid JSON with sql, params, and tables fields"
        };

        // Add dialect-specific rules
        switch (dialect.ToLowerInvariant())
        {
            case "postgres":
            case "postgresql":
                rules.Add("Use $1, $2, etc. for parameter placeholders");
                rules.Add("Use ILIKE for case-insensitive string matching");
                break;
            case "mysql":
                rules.Add("Use ? for parameter placeholders");
                rules.Add("Use LIKE for string matching (case-insensitive by default)");
                break;
            case "sqlite":
                rules.Add("Use ? for parameter placeholders");
                rules.Add("Use LIKE for string matching (case-insensitive by default)");
                break;
            case "mssql":
            case "sqlserver":
                rules.Add("Use @p1, @p2, etc. for parameter placeholders");
                rules.Add("Use LIKE for case-insensitive string matching");
                break;
        }

        return string.Join("\n", rules.Select((rule, index) => $"{index + 1}. {rule}"));
    }

    private static string BuildExamples(string dialect)
    {
        var placeholderStyle = GetPlaceholderStyle(dialect);
        var param1 = GetParamName(dialect, 1);
        var param2 = GetParamName(dialect, 2);

        return $"Simple query example:\n" +
               $"{{\"sql\": \"SELECT id, name, email FROM users WHERE created_at >= {placeholderStyle} AND status = {placeholderStyle} LIMIT 100\", " +
               $"\"params\": {{\"{param1}\": \"2024-01-01\", \"{param2}\": \"active\"}}, " +
               $"\"tables\": [\"users\"]}}\n\n" +
               $"JOIN query example:\n" +
               $"{{\"sql\": \"SELECT u.name, o.order_date, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE u.country = {placeholderStyle} AND o.status = {placeholderStyle} ORDER BY o.order_date DESC LIMIT 50\", " +
               $"\"params\": {{\"{param1}\": \"USA\", \"{param2}\": \"completed\"}}, " +
               $"\"tables\": [\"users\", \"orders\"]}}";
    }

    private static string GetPlaceholderStyle(string dialect)
    {
        return dialect.ToLowerInvariant() switch
        {
            "postgres" or "postgresql" => "$1",
            "mysql" or "sqlite" => "?",
            "mssql" or "sqlserver" => "@p1",
            _ => "?"
        };
    }

    private static string GetParamName(string dialect, int index)
    {
        return dialect.ToLowerInvariant() switch
        {
            "postgres" or "postgresql" => $"${index}",
            "mysql" or "sqlite" => $"param{index}",
            "mssql" or "sqlserver" => $"@p{index}",
            _ => $"param{index}"
        };
    }
}