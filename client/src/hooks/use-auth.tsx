import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  userRole: "researcher" | "customer" | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & { role: "researcher" | "customer" };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [userRole, setUserRole] = useState<"researcher" | "customer" | null>(null);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Store the role in local state before sending to server
      setUserRole(credentials.role);
      
      // Store role in session storage for persistence across page refreshes
      sessionStorage.setItem('userRole', credentials.role);
      
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on role
      if (userRole === "customer") {
        setLocation("/customer/dashboard");
      } else {
        setLocation("/");
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      // Clear role on error
      setUserRole(null);
      sessionStorage.removeItem('userRole');
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser & { role?: "researcher" | "customer" }) => {
      // Store role if provided in registration data
      if (credentials.role) {
        setUserRole(credentials.role);
        sessionStorage.setItem('userRole', credentials.role);
      }
      
      const res = await apiRequest("POST", "/api/register", credentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Redirect based on role
      if (userRole === "customer") {
        setLocation("/customer/dashboard");
      } else {
        setLocation("/");
      }
      
      toast({
        title: "Registration successful",
        description: `Welcome to BRNOUT, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      // Clear role on error
      setUserRole(null);
      sessionStorage.removeItem('userRole');
      
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/logout");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear role information
      setUserRole(null);
      sessionStorage.removeItem('userRole');
      
      // Redirect to login page
      setLocation("/auth");
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load user role from session storage on initial load and when user changes
  useEffect(() => {
    const savedRole = sessionStorage.getItem('userRole') as "researcher" | "customer" | null;
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, [user]);
  
  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        userRole,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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