import { AuthResponse, LoginPayload, RegisterPayload } from "../@types/auth.type";
import { api } from "../_lib/api/client";


export const authService = {
  signup: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data).then((res) => res.data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data).then((res) => res.data),
};
