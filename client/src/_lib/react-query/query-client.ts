import { QueryClient } from "@tanstack/react-query";

let client: QueryClient | undefined;

export function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return client;
}