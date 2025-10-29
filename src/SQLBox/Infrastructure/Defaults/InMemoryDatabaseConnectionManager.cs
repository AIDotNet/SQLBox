using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SQLBox.Entities;

namespace SQLBox.Infrastructure.Defaults;

/// <summary>
/// 内存数据库连接管理器的默认实现
/// Default in-memory implementation of database connection manager
/// </summary>
public sealed class InMemoryDatabaseConnectionManager : IDatabaseConnectionManager
{
    private readonly ConcurrentDictionary<string, DatabaseConnection> _connections = new();

    /// <inheritdoc />
    public Task<DatabaseConnection> AddConnectionAsync(DatabaseConnection connection, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connection.Id))
        {
            throw new ArgumentException("Connection ID cannot be empty", nameof(connection));
        }

        if (!_connections.TryAdd(connection.Id, connection))
        {
            throw new InvalidOperationException($"Connection with ID '{connection.Id}' already exists");
        }

        return Task.FromResult(connection);
    }

    /// <inheritdoc />
    public Task<DatabaseConnection> UpdateConnectionAsync(DatabaseConnection connection, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connection.Id))
        {
            throw new ArgumentException("Connection ID cannot be empty", nameof(connection));
        }

        if (!_connections.ContainsKey(connection.Id))
        {
            throw new InvalidOperationException($"Connection with ID '{connection.Id}' does not exist");
        }

        var updatedConnection = new DatabaseConnection
        {
            Id = connection.Id,
            Name = connection.Name,
            DatabaseType = connection.DatabaseType,
            ConnectionString = connection.ConnectionString,
            Description = connection.Description,
            CreatedAt = connection.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            IsEnabled = connection.IsEnabled,
            Metadata = connection.Metadata
        };
        _connections[connection.Id] = updatedConnection;

        return Task.FromResult(updatedConnection);
    }

    /// <inheritdoc />
    public Task DeleteConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
        {
            throw new ArgumentException("Connection ID cannot be empty", nameof(connectionId));
        }

        _connections.TryRemove(connectionId, out _);
        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<DatabaseConnection?> GetConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionId))
        {
            throw new ArgumentException("Connection ID cannot be empty", nameof(connectionId));
        }

        _connections.TryGetValue(connectionId, out var connection);
        return Task.FromResult(connection);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<DatabaseConnection>> GetAllConnectionsAsync(bool includeDisabled = false, CancellationToken cancellationToken = default)
    {
        var connections = _connections.Values
            .Where(c => includeDisabled || c.IsEnabled)
            .OrderBy(c => c.Name)
            .ToList();

        return Task.FromResult<IReadOnlyList<DatabaseConnection>>(connections);
    }

    /// <inheritdoc />
    public Task<bool> TestConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        // 这是一个简单的实现，仅检查连接是否存在
        // This is a simple implementation that only checks if the connection exists
        // 在实际应用中，这里应该尝试打开数据库连接进行测试
        // In a real application, this should attempt to open the database connection for testing
        
        if (string.IsNullOrWhiteSpace(connectionId))
        {
            return Task.FromResult(false);
        }

        var exists = _connections.ContainsKey(connectionId);
        return Task.FromResult(exists);
    }
}
