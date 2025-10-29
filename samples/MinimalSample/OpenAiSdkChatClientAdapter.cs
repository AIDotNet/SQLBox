using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using OpenAI.Chat;
using ChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace MinimalSample;

// Minimal adapter from OpenAI .NET SDK ChatClient to Microsoft.Extensions.AI.IChatClient
internal sealed class OpenAiSdkChatClientAdapter : IChatClient
{
    private readonly ChatClient _inner;
    public OpenAiSdkChatClientAdapter(ChatClient inner) => _inner = inner;

    public async Task<ChatResponse> GetResponseAsync(IEnumerable<Microsoft.Extensions.AI.ChatMessage> messages, ChatOptions? options = null, CancellationToken cancellationToken = default)
    {
        var list = new List<global::OpenAI.Chat.ChatMessage>();
        foreach (var m in messages)
        {
            var text = m.Text ?? string.Empty;
            var role = m.Role;
            global::OpenAI.Chat.ChatMessage mapped;
            if (role == Microsoft.Extensions.AI.ChatRole.System)
                mapped = global::OpenAI.Chat.ChatMessage.CreateSystemMessage(text);
            else if (role == Microsoft.Extensions.AI.ChatRole.Assistant)
                mapped = global::OpenAI.Chat.ChatMessage.CreateAssistantMessage(text);
            else
                mapped = global::OpenAI.Chat.ChatMessage.CreateUserMessage(text);
            list.Add(mapped);
        }
        var result = await _inner.CompleteChatAsync(list.ToArray());
        var contentText = result?.Value?.Content?.ToString() ?? string.Empty;
        if (result?.Value?.Content?.Count>0)
        {
            return new ChatResponse(new ChatMessage(ChatRole.Assistant, result.Value.Content.First().Text));
        }
        return new ChatResponse(new Microsoft.Extensions.AI.ChatMessage(Microsoft.Extensions.AI.ChatRole.Assistant, contentText));
    }

    public async IAsyncEnumerable<ChatResponseUpdate> GetStreamingResponseAsync(IEnumerable<Microsoft.Extensions.AI.ChatMessage> messages, ChatOptions? options = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var resp = await GetResponseAsync(messages, options, cancellationToken);
        yield return new ChatResponseUpdate(Microsoft.Extensions.AI.ChatRole.Assistant, resp.Text ?? string.Empty);
    }

    public object? GetService(System.Type serviceType, object? serviceKey)
        => null;

    public void Dispose() { }
}
