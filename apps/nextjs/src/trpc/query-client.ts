import {
  defaultShouldDehydrateQuery,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import SuperJSON from "superjson";

export const createQueryClient = () => {
  // Custom query cache
  const queryCache = new QueryCache({
    onError: (error) => {
      console.error("Query Cache Error:", error);
    },
  });

  return new QueryClient({
    queryCache,
    defaultOptions: {
      queries: {
        // StaleTime for better caching
        staleTime: 5 * 60 * 1000, // 5 minutes

        // Retry configuration
        retry: (failureCount, error) => {
          if (
            error instanceof Error &&
            (error.message.includes("unauthorized") ||
              error.message.includes("not found"))
          ) {
            return false;
          }

          // Limit retries and back off
          return failureCount < 3;
        },

        // Caching
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchInterval: false,

        // Timeout for queries
        networkMode: "offlineFirst",
        gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      },

      // Dehydration and hydration with SuperJSON
      dehydrate: {
        serializeData: SuperJSON.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
      hydrate: {
        deserializeData: SuperJSON.deserialize,
      },
    },
  });
};
