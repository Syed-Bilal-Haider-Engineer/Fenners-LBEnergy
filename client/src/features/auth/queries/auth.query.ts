import { authService } from "@/src/services/auth.services";
import { useMutation } from "@tanstack/react-query";


export function useAuthMutations() {
  const login = useMutation({
    mutationFn: authService.login,
  });

  const signup = useMutation({
    mutationFn: authService.signup,
  });


  return {
    login,
    signup
  };
}