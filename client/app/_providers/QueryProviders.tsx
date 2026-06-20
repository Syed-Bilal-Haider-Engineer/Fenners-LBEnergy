"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/src/_lib/react-query/query-client";

const queryClient = getQueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}