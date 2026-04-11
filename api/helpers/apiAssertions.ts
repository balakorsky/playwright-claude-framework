import { APIResponse, expect } from '@playwright/test';
import { z } from 'zod';
import { ErrorResponse } from '../models/reqres.models';

export async function assertApiSuccess<T>(
  response: APIResponse,
  successStatus: number,
  allowedStatuses: number[],
  onSuccess: (body: T) => void,
): Promise<void> {
  const status = response.status();
  const body = await response.json();
  expect(allowedStatuses).toContain(status);
  if (status === successStatus) {
    onSuccess(body as T);
  } else {
    expect((body as ErrorResponse).error).toBeDefined();
  }
}

export async function assertApiError(
  response: APIResponse,
  allowedStatuses: number[],
): Promise<void> {
  const status = response.status();
  const error: ErrorResponse = await response.json();
  expect(allowedStatuses).toContain(status);
  expect(error.error).toBeDefined();
}

export function assertStatus(response: APIResponse, allowedStatuses: number[]): void {
  expect(allowedStatuses).toContain(response.status());
}

export function assertSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Schema validation failed:\n${result.error.toString()}`);
  }
  return result.data;
}
