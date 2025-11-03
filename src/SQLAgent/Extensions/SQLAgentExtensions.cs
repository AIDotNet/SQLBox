using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using SQLAgent.Facade;

namespace SQLAgent.Extensions;

public static class SQLAgentExtensions
{
    public static SQLAgentBuilder AddSQLAgent(IServiceCollection services)
    {
        return new SQLAgentBuilder(services);
    }
}