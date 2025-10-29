using System.Text.Json.Serialization;

namespace SQLBox.Hosting.Dto;

/// <summary>
/// SSE消息类型枚举
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SSEMessageType
{
    Text,      // 普通文本
    Sql,       // SQL语句
    Data,      // 查询结果数据
    Chart,     // 图表配置
    Error,     // 错误信息
    Done       // 完成标记
}

/// <summary>
/// SSE消息基类
/// </summary>
public class SSEMessage
{
    /// <summary>
    /// 消息类型
    /// </summary>
    public SSEMessageType Type { get; set; }
    
    /// <summary>
    /// 消息ID
    /// </summary>
    public string MessageId { get; set; } = Guid.NewGuid().ToString();
    
    /// <summary>
    /// 时间戳
    /// </summary>
    public long Timestamp { get; set; } = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
}

/// <summary>
/// 文本消息
/// </summary>
public class TextMessage : SSEMessage
{
    public TextMessage()
    {
        Type = SSEMessageType.Text;
    }
    
    /// <summary>
    /// 文本内容
    /// </summary>
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// SQL消息
/// </summary>
public class SqlMessage : SSEMessage
{
    public SqlMessage()
    {
        Type = SSEMessageType.Sql;
    }
    
    /// <summary>
    /// SQL语句
    /// </summary>
    public string Sql { get; set; } = string.Empty;
    
    /// <summary>
    /// 使用的表
    /// </summary>
    public string[] Tables { get; set; } = Array.Empty<string>();
    
    /// <summary>
    /// 方言
    /// </summary>
    public string? Dialect { get; set; }
}

/// <summary>
/// 数据消息
/// </summary>
public class DataMessage : SSEMessage
{
    public DataMessage()
    {
        Type = SSEMessageType.Data;
    }
    
    /// <summary>
    /// 列名
    /// </summary>
    public string[] Columns { get; set; } = Array.Empty<string>();
    
    /// <summary>
    /// 数据行
    /// </summary>
    public object[][] Rows { get; set; } = Array.Empty<object[]>();
    
    /// <summary>
    /// 总行数
    /// </summary>
    public int TotalRows { get; set; }
}

/// <summary>
/// 图表消息
/// </summary>
public class ChartMessage : SSEMessage
{
    public ChartMessage()
    {
        Type = SSEMessageType.Chart;
    }
    
    /// <summary>
    /// 图表类型 (bar, line, pie, scatter, etc.)
    /// </summary>
    public string ChartType { get; set; } = "bar";
    
    /// <summary>
    /// 图表配置
    /// </summary>
    public ChartConfig Config { get; set; } = new();
    
    /// <summary>
    /// 图表数据
    /// </summary>
    public object Data { get; set; } = new { };
}

/// <summary>
/// 图表配置
/// </summary>
public class ChartConfig
{
    /// <summary>
    /// X轴字段
    /// </summary>
    public string? XAxis { get; set; }
    
    /// <summary>
    /// Y轴字段
    /// </summary>
    public string[]? YAxis { get; set; }
    
    /// <summary>
    /// 标题
    /// </summary>
    public string? Title { get; set; }
    
    /// <summary>
    /// 图例
    /// </summary>
    public bool ShowLegend { get; set; } = true;
}

/// <summary>
/// 错误消息
/// </summary>
public class ErrorMessage : SSEMessage
{
    public ErrorMessage()
    {
        Type = SSEMessageType.Error;
    }
    
    /// <summary>
    /// 错误代码
    /// </summary>
    public string Code { get; set; } = string.Empty;
    
    /// <summary>
    /// 错误消息
    /// </summary>
    public string Message { get; set; } = string.Empty;
    
    /// <summary>
    /// 详细信息
    /// </summary>
    public string? Details { get; set; }
}

/// <summary>
/// 完成消息
/// </summary>
public class DoneMessage : SSEMessage
{
    public DoneMessage()
    {
        Type = SSEMessageType.Done;
    }
    
    /// <summary>
    /// 执行耗时(毫秒)
    /// </summary>
    public long ElapsedMs { get; set; }
}
