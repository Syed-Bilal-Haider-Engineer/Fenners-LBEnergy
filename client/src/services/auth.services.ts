import { AuthResponse } from "../@types/auth.type";
import { api } from "../_lib/api/client";


export const authService = {
  signup: (data: any) =>
    api.post<AuthResponse>("/auth/register", data).then((res) => res.data),

  login: (data: any) =>
    api.post<AuthResponse>("/auth/login", data).then((res) => res.data),
};