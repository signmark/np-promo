import { createContext, ReactNode, useContext } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import type { LoginCredentials } from "@shared/schema";
import * as directus from "@/lib/directus";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<any, Error, LoginCredentials>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const isAuthenticated = !!localStorage.getItem('directus_token');

  const loginMutation = useMutation({
    mutationFn: directus.login,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem('directus_token');
    window.location.href = '/auth';
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loginMutation,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
