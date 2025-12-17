import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiClient } from "./api";

/**
 * Hook to initialize API client with Clerk authentication
 * Call this in components that need to make authenticated API requests
 */
export function useApiClient() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && getToken) {
      // Set the token getter function for the API client
      apiClient.setTokenGetter(getToken);
    }
  }, [isLoaded, getToken]);

  return apiClient;
}

