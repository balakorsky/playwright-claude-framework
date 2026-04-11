import { APIRequestContext, APIResponse } from '@playwright/test';

export abstract class BaseApiClient {
  constructor(protected request: APIRequestContext) {}

  protected get(path: string, params?: Record<string, string | number | boolean>): Promise<APIResponse> {
    return this.request.get(path, {
      params,
      headers: this.defaultHeaders(),
    });
  }

  protected post(path: string, data?: unknown): Promise<APIResponse> {
    return this.request.post(path, {
      data,
      headers: this.defaultHeaders(),
    });
  }

  protected put(path: string, data?: unknown): Promise<APIResponse> {
    return this.request.put(path, {
      data,
      headers: this.defaultHeaders(),
    });
  }

  protected delete(path: string): Promise<APIResponse> {
    return this.request.delete(path, {
      headers: this.defaultHeaders(),
    });
  }

  private defaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
}
