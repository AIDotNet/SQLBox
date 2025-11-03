using System.Net;
using Microsoft.SemanticKernel;
using SQLAgent.Entities;

namespace SQLAgent
{
    public static class KernelFactory
    {
        public static Kernel CreateKernel(string model, string apiKey, string endpoint,
            Action<IKernelBuilder>? kernelBuilderAction = null,
            AIProviderType type = AIProviderType.OpenAI)
        {
            var kernelBuilder = Kernel.CreateBuilder();

            if (type is AIProviderType.OpenAI or AIProviderType.Ollama)
            {
                kernelBuilder.AddOpenAIChatCompletion(model, new Uri(endpoint), apiKey,
                    httpClient: new HttpClient(new OpenAIHandle()
                    {
                        // 启用压缩
                        AutomaticDecompression = DecompressionMethods.Brotli | DecompressionMethods.GZip |
                                                 DecompressionMethods.Deflate
                    })
                    {
                        Timeout = TimeSpan.FromSeconds(600)
                    });
            }
            else if (type == AIProviderType.AzureOpenAI)
            {
                kernelBuilder.AddAzureOpenAIChatCompletion(model, endpoint, apiKey);
            }
            else
            {
                throw new NotSupportedException($"AI provider type '{type}' is not supported.");
            }

            kernelBuilderAction?.Invoke(kernelBuilder);

            var kernel = kernelBuilder.Build();


            return kernel;
        }
    }
}