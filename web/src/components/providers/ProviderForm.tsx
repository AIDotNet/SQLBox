import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { TagInput } from '../ui/tag-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import type { AIProvider, AIProviderInput } from '../../types/aiProvider';
import { COMMON_MODELS } from '../../types/aiProvider';

interface ProviderFormProps {
  provider: AIProvider | null;
  onSave: (input: AIProviderInput) => void;
  onCancel: () => void;
}

export function ProviderForm({ provider, onSave, onCancel }: ProviderFormProps) {
  const [formData, setFormData] = useState<AIProviderInput>({
    name: '',
    type: 'OpenAI',
    endpoint: '',
    apiKey: '',
    availableModels: [],
    defaultModel: '',
    isEnabled: true,
    extraConfig: '',
  });

  useEffect(() => {
    if (provider) {
      // 处理 availableModels：确保是数组格式
      const modelsArray = Array.isArray(provider.availableModels)
        ? provider.availableModels
        : [];
      setFormData({
        name: provider.name,
        type: provider.type,
        endpoint: provider.endpoint || '',
        apiKey: '', // 编辑时不显示加密的 API Key
        availableModels: modelsArray,
        defaultModel: provider.defaultModel || '',
        isEnabled: provider.isEnabled,
        extraConfig: provider.extraConfig || '',
      });
    } else {
      // 新建时设置默认模型
      setFormData((prev) => ({
        ...prev,
        availableModels: COMMON_MODELS.OpenAI,
      }));
    }
  }, [provider]);

  const handleTypeChange = (type: string) => {
    setFormData((prev) => {
      const models = COMMON_MODELS[type as keyof typeof COMMON_MODELS] || [];
      let endpoint = prev.endpoint;
      let apiKey = prev.apiKey;
      
      // 为不同提供商设置默认端点和 API Key
      if (type === 'OpenAI') {
        endpoint = '';
      } else if (type === 'Ollama') {
        endpoint = 'http://localhost:11434/v1';
        apiKey = 'sk-ollama-local';
      }
      
      return {
        ...prev,
        type,
        availableModels: models,
        endpoint,
        apiKey,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const needsEndpoint = formData.type !== 'OpenAI';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">提供商名称 *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="例如: 我的 OpenAI"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">提供商类型 *</Label>
        <Select 
          key={provider?.id || 'new'} 
          value={formData.type} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择提供商类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OpenAI">OpenAI</SelectItem>
            <SelectItem value="AzureOpenAI">Azure OpenAI</SelectItem>
            <SelectItem value="CustomOpenAI">自定义 OpenAI 兼容</SelectItem>
            <SelectItem value="Ollama">Ollama</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {formData.type === 'OpenAI' && '使用 OpenAI 官方 API'}
          {formData.type === 'AzureOpenAI' && '使用 Azure OpenAI 服务'}
          {formData.type === 'CustomOpenAI' && '使用自定义的 OpenAI 兼容端点'}
          {formData.type === 'Ollama' && '使用 Ollama 本地模型服务'}
        </p>
      </div>

      {needsEndpoint && (
        <div className="space-y-2">
          <Label htmlFor="endpoint">API 端点 *</Label>
          <Input
            id="endpoint"
            value={formData.endpoint}
            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
            placeholder={
              formData.type === 'AzureOpenAI'
                ? 'https://your-resource.openai.azure.com'
                : formData.type === 'Ollama'
                  ? 'http://localhost:11434/v1'
                  : 'https://api.example.com/v1'
            }
            required={needsEndpoint}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="apiKey">API 密钥 {!provider && formData.type !== 'Ollama' && '*'}</Label>
        <Input
          id="apiKey"
          type="password"
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          placeholder={provider ? '留空表示不修改现有密钥' : 'sk-...'}
          required={!provider && formData.type !== 'Ollama'}
        />
        <p className="text-sm text-muted-foreground">
          {formData.type === 'Ollama' 
            ? 'Ollama 本地服务使用固定密钥 sk-ollama-local'
            : provider 
              ? '仅在需要更新密钥时填写，留空则保持原密钥不变'
              : '您的 API 密钥将被安全存储'
          }
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="models">可用模型 *</Label>
        <TagInput
          value={Array.isArray(formData.availableModels) ? formData.availableModels : []}
          onChange={(tags) =>
            setFormData({ ...formData, availableModels: tags })
          }
          placeholder="输入模型名称后按回车添加，如: gpt-4"
          className="min-h-20"
        />
        <p className="text-sm text-muted-foreground">
          输入模型名称后按回车键添加标签
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultModel">默认模型</Label>
        <Input
          id="defaultModel"
          value={formData.defaultModel}
          onChange={(e) =>
            setFormData({ ...formData, defaultModel: e.target.value })
          }
          placeholder="gpt-4"
        />
        <p className="text-sm text-muted-foreground">
          留空则使用第一个可用模型
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="enabled"
          checked={formData.isEnabled}
          onCheckedChange={(checked: boolean) =>
            setFormData({ ...formData, isEnabled: checked })
          }
        />
        <Label htmlFor="enabled">启用此提供商</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="extraConfig">额外配置 (JSON)</Label>
        <Textarea
          id="extraConfig"
          value={formData.extraConfig}
          onChange={(e) =>
            setFormData({ ...formData, extraConfig: e.target.value })
          }
          placeholder='{"temperature": 0.7}'
          rows={3}
        />
        <p className="text-sm text-muted-foreground">
          可选的 JSON 格式配置
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
