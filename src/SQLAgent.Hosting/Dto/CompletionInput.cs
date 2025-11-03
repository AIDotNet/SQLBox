namespace SQLAgent.Hosting.Dto;

/// <summary>
/// 聊天消息（对话历史）
/// </summary>
public class ChatMessageDto
{
    /// <summary>
    /// 消息角色：user, assistant, system
    /// </summary>
    public string Role { get; set; } = string.Empty;
    
    /// <summary>
    /// 消息内容
    /// </summary>
    public string Content { get; set; } = string.Empty;
}

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
    /// 对话历史记录（包含当前用户消息）
    /// </summary>
    public List<ChatMessageDto> Messages { get; set; } = new();
    
    /// <summary>
    /// 是否执行SQL
    /// </summary>
    public bool Execute { get; set; } = true;
    
    /// <summary>
    /// 是否返回图表建议
    /// </summary>
    public bool SuggestChart { get; set; } = true;
    
    /// <summary>
    /// AI 提供商 ID（必需）
    /// </summary>
    public string ProviderId { get; set; } = string.Empty;
    
    /// <summary>
    /// AI 模型名称（必需）
    /// </summary>
    public string Model { get; set; } = string.Empty;
}