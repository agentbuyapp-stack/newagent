import { apiClient } from "./api";

/**
 * Simple hook that returns the API client singleton.
 * Token is now managed via localStorage automatically.
 */
export function useApiClient() {
  return apiClient;
}
