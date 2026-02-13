// React Query default configuration for better performance
export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    },
  },
};

// Specific configurations for different data types
export const userQueryConfig = {
  staleTime: 30 * 60 * 1000, // 30 minutes - user data changes rarely
  cacheTime: 60 * 60 * 1000, // 1 hour
};

export const subscriptionQueryConfig = {
  staleTime: 10 * 60 * 1000, // 10 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
};

export const entityQueryConfig = {
  staleTime: 2 * 60 * 1000, // 2 minutes - entities change more frequently
  cacheTime: 5 * 60 * 1000, // 5 minutes
};