import { createContext, ReactNode, useContext } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import type { LoginCredentials } from "@shared/schema";
import * as directus from "@/lib/directus";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<any, Error, LoginCredentials>;
  logout: () => void;
  user: any; // Add user property
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const isAuthenticated = !!localStorage.getItem('directus_token');

  const loginMutation = useMutation({
    mutationFn: directus.login,
    onSuccess: (data) => {
      console.log('Login successful:', data);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    localStorage.removeItem('directus_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('user_id');
    window.location.href = '/auth';
  };

  // Get the current user's information
  const user = isAuthenticated ? { id: localStorage.getItem('user_id') } : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loginMutation,
        logout,
        user
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