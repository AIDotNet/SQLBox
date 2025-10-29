using System.Threading;
using System.Threading.Tasks;
using SQLBox.Entities;

namespace SQLBox.Prompts;

public interface ISqlPromptBuilder
{
    Task<string> BuildPromptAsync(
        string userQuestion,
        string dialect,
        SchemaContext schemaContext,
        CancellationToken ct = default);

    string BuildPrompt(
        string userQuestion,
        string dialect,
        SchemaContext schemaContext);
}