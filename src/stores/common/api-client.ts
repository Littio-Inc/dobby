import axios, { type AxiosError } from 'axios';
import { getIdToken } from '../auth-store';

// API client for Azkaban (authentication service)
export const azkabanApi = axios.create({
  baseURL: import.meta.env.PUBLIC_AZKABAN_API_URL || 'http://localhost:8001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API client for Cassandra (payouts service)
// In production, Cassandra uses AWS IAM authentication
// In local development, we can call directly without IAM
export const cassandraApi = axios.create({
  baseURL: import.meta.env.PUBLIC_CASSANDRA_API_URL || 'https://jxxg0opg96.execute-api.us-east-1.amazonaws.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Azkaban: Add Firebase ID Token
azkabanApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API-Client] Token added to request:', config.url);
      } else {
        console.error('[API-Client] No token available for request:', config.url);
        // Don't make the request if there's no token
        throw new Error('No authentication token available');
      }
    } catch (error) {
      console.error('[API-Client] Error getting token:', error);
      throw error;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Request interceptor for Cassandra: Add Firebase ID Token (for local dev)
// In production, AWS IAM handles authentication
cassandraApi.interceptors.request.use(
  async (config) => {
    // In local development, we can add token if needed
    // In production, AWS IAM handles this automatically
    if (import.meta.env.DEV) {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Handle errors and refresh token
const handleAuthError = async (error: AxiosError, apiInstance: typeof azkabanApi | typeof cassandraApi) => {
  if (error.response?.status === 401) {
    // Token expired - Firebase handles refresh automatically
    const { login } = await import('../auth-store');
    // Try to get new token
    const newToken = await getIdToken();
    if (newToken && error.config) {
      // Retry request with new token
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return apiInstance.request(error.config);
    } else {
      // If no token, redirect to login
      await login();
    }
  }
  return Promise.reject(error);
};

azkabanApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => handleAuthError(error, azkabanApi),
);

cassandraApi.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => handleAuthError(error, cassandraApi),
);

// Default export for backward compatibility (points to Azkaban)
export default azkabanApi;
