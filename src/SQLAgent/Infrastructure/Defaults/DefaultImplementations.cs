using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using SQLAgent.Entities;
using SQLAgent.Prompts;

namespace SQLAgent.Infrastructure.Defaults;

public sealed class InMemorySchemaProvider(DatabaseSchema schema) : ISchemaProvider
{
    private readonly DatabaseSchema _schema = schema;
    public Task<DatabaseSchema> LoadAsync(CancellationToken ct = default) => Task.FromResult(_schema);
}
