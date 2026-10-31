import { ERROR_CODES, ErrorCode } from '@sofe/shared';

export interface ApiErrorResponse {
  statusCode: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class AdminApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(res: ApiErrorResponse) {
    super(res.message);
    this.name = 'AdminApiError';
    this.statusCode = res.statusCode;
    this.code = res.code;
    this.details = res.details;
  }
}

const DEFAULT_BASE_URL = 'http://localhost:4000/api/v1';

export class AdminApiClient {
  private token: string | null = null;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    let json: Record<string, unknown> | null = null;
    try {
      json = (await response.json()) as Record<string, unknown>;
    } catch {
      // response without json
    }

    if (!response.ok) {
      const errRes: ApiErrorResponse = {
        statusCode: response.status,
        code: (json?.code as ErrorCode) || ERROR_CODES.INTERNAL,
        message: (json?.message as string) || `Request failed with status ${response.status}`,
        details: json?.details as Record<string, unknown> | undefined,
      };
      throw new AdminApiError(errRes);
    }

    // Unwrap envelope { data: ... } or return json
    return (json?.data !== undefined ? json.data : json) as T;
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const adminApiClient = new AdminApiClient();
