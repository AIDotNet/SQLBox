import type {
  DatabaseConnection,
  CreateConnectionRequest,
  UpdateConnectionRequest,
  TestConnectionResponse,
} from '../types/connection';

// 开发环境使用后端地址，生产环境使用相对路径
const API_BASE = import.meta.env.DEV ? 'http://localhost:5227/api' : '/api';

export const connectionApi = {
  // 获取所有连接
  async getAll(includeDisabled = false): Promise<DatabaseConnection[]> {
    const response = await fetch(
      `${API_BASE}/connections?includeDisabled=${includeDisabled}`
    );
    if (!response.ok) throw new Error('Failed to fetch connections');
    return response.json();
  },

  // 获取单个连接
  async getById(id: string): Promise<DatabaseConnection> {
    const response = await fetch(`${API_BASE}/connections/${id}`);
    if (!response.ok) throw new Error('Failed to fetch connection');
    return response.json();
  },

  // 创建连接
  async create(data: CreateConnectionRequest): Promise<DatabaseConnection> {
    const response = await fetch(`${API_BASE}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create connection');
    }
    return response.json();
  },

  // 更新连接
  async update(
    id: string,
    data: UpdateConnectionRequest
  ): Promise<DatabaseConnection> {
    const response = await fetch(`${API_BASE}/connections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update connection');
    return response.json();
  },

  // 删除连接
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/connections/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete connection');
  },

  // 测试连接
  async test(id: string): Promise<TestConnectionResponse> {
    const response = await fetch(`${API_BASE}/connections/${id}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test connection');
    return response.json();
  },
};
