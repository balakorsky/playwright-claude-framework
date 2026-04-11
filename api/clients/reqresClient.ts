import { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './baseClient';

export class ReqresClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  async login(email: string, password?: string): Promise<APIResponse> {
    const data: { email: string; password?: string } = { email };
    if (password !== undefined) {
      data.password = password;
    }
    return this.post('login', data);
  }

  async getUsers(page: number = 1): Promise<APIResponse> {
    return this.get('users', { page });
  }

  async getUser(id: number): Promise<APIResponse> {
    return this.get(`users/${id}`);
  }

  async createUser(name: string, job: string): Promise<APIResponse> {
    return this.post('users', { name, job });
  }

  async updateUser(id: number, name: string, job: string): Promise<APIResponse> {
    return this.put(`users/${id}`, { name, job });
  }

  async deleteUser(id: number): Promise<APIResponse> {
    return this.delete(`users/${id}`);
  }
}
