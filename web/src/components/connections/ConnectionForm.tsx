import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { connectionApi } from '@/services/api';
import type { CreateConnectionRequest } from '@/types/connection';

interface ConnectionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ConnectionForm({ onSuccess, onCancel }: ConnectionFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateConnectionRequest>({
    name: '',
    databaseType: 'sqlite',
    connectionString: '',
    description: '',
  });

  const createMutation = useMutation({
    mutationFn: connectionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">连接名称</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="例如: 生产数据库"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">数据库类型</label>
        <Select
          value={formData.databaseType}
          onChange={(e) =>
            setFormData({ ...formData, databaseType: e.target.value })
          }
        >
          <option value="sqlite">SQLite</option>
          <option value="mssql">SQL Server</option>
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">连接字符串</label>
        <Textarea
          value={formData.connectionString}
          onChange={(e) =>
            setFormData({ ...formData, connectionString: e.target.value })
          }
          placeholder="例如: Data Source=mydb.db"
          required
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">描述（可选）</label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="描述这个数据库连接的用途"
          rows={2}
        />
      </div>

      {createMutation.isError && (
        <div className="text-sm text-destructive">
          创建失败: {(createMutation.error as Error).message}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '创建中...' : '创建连接'}
        </Button>
      </div>
    </form>
  );
}
