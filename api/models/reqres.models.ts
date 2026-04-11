export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

export interface ErrorResponse {
  error: string;
}

export interface LoginSuccessResponse {
  token: string;
}

export interface UsersListResponse {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  data: User[];
}

export interface UserResponse {
  data: User;
}

export interface CreateUserResponse {
  name: string;
  job: string;
  id: string;
  createdAt: string;
}

export interface UpdateUserResponse {
  name: string;
  job: string;
  updatedAt: string;
}
