using System.Collections.Generic;
using System.Data.Common;
using System.Threading;
using System.Threading.Tasks;
using SQLAgent.Entities;

namespace SQLAgent.Infrastructure;

public interface ISchemaProvider
{
    Task<DatabaseSchema> LoadAsync(CancellationToken ct = default);
}


public interface IDbConnectionFactory
{
    DbConnection CreateConnection();
}

