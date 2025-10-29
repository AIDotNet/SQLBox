using Microsoft.Extensions.AI;
using SQLBox.Facade;

namespace SQLBox.Infrastructure.Providers.ExtensionsAI;

public static class BuilderExtensions
{
    public static SqlGenBuilder UseExtensionsAiLlm(this SqlGenBuilder builder, IChatClient chat)
        => builder.WithLlmClient(new ExtensionsAiLlmClient(chat));
}
