namespace SQLBox;

public class OpenAIHandle : HttpClientHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var response = base.SendAsync(request, cancellationToken);
        return response;
    }
}