import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  avatar: z.string().url(),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const LoginSuccessResponseSchema = z.object({
  token: z.string(),
});

export const UsersListResponseSchema = z.object({
  page: z.number(),
  per_page: z.number(),
  total: z.number(),
  total_pages: z.number(),
  data: z.array(UserSchema),
});

export const UserResponseSchema = z.object({
  data: UserSchema,
});

export const CreateUserResponseSchema = z.object({
  name: z.string(),
  job: z.string(),
  id: z.string(),
  createdAt: z.string().datetime({ offset: true }),
});

export const UpdateUserResponseSchema = z.object({
  name: z.string(),
  job: z.string(),
  updatedAt: z.string().datetime({ offset: true }),
});
