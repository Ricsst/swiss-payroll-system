import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Send auth token and selectedCompany from localStorage as headers (for Replit iframe compatibility)
  const authToken = localStorage.getItem('authToken');
  const selectedCompany = localStorage.getItem('selectedCompany');
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (authToken) {
    headers['X-Auth-Token'] = authToken;
  }
  if (selectedCompany) {
    headers['X-Company-Key'] = selectedCompany;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Send auth token and selectedCompany from localStorage as headers (for Replit iframe compatibility)
    const authToken = localStorage.getItem('authToken');
    const selectedCompany = localStorage.getItem('selectedCompany');
    const headers: HeadersInit = {};
    
    if (authToken) {
      headers['X-Auth-Token'] = authToken;
    }
    if (selectedCompany) {
      headers['X-Company-Key'] = selectedCompany;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      cache: "no-store", // Always bypass browser cache
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
