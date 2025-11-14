export interface KaitoClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retryConfig?: {
    limit?: number;
    methods?: string[];
    statusCodes?: number[];
    backoffLimit?: number;
  };
}

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  cursor?: string;
  hasMore?: boolean;
}

export interface KaitoApiResponse<T = unknown> {
  data?: T;
  status: "success" | "error";
  msg?: string;
}
