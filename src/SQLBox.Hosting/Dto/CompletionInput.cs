namespace SQLBox.Hosting.Dto;

/// <summary>
/// 聊天完成请求
/// </summary>
public class CompletionInput
{
    /// <summary>
    /// 连接ID（必需）
    /// </summary>
    public string ConnectionId { get; set; } = string.Empty;
    
    /// <summary>
    /// 用户问题
    /// </summary>
    public string Question { get; set; } = string.Empty;
    
    /// <summary>
    /// 是否执行SQL
    /// </summary>
    public bool Execute { get; set; } = true;
    
    /// <summary>
    /// 最大返回行数
    /// </summary>
    public int MaxRows { get; set; } = 100;
    
    /// <summary>
    /// 是否返回图表建议
    /// </summary>
    public bool SuggestChart { get; set; } = true;
    
    /// <summary>
    /// SQL方言（可选，如果不提供则从连接中推断）
    /// </summary>
    public string? Dialect { get; set; }
}