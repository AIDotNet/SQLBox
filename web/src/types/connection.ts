// 连接相关类型
export interface DatabaseConnection {
  id: string;
  name: string;
  databaseType: string;
  connectionString: string;
  description?: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConnectionRequest {
  name: string;
  databaseType: string;
  connectionString: string;
  description?: string;
}

export interface UpdateConnectionRequest {
  name?: string;
  databaseType?: string;
  connectionString?: string;
  description?: string;
  isEnabled?: boolean;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  elapsedMs: number;
}
