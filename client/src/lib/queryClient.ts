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

export async function downloadFile(url: string, filename?: string) {
  try {
    console.log('[downloadFile] Starting download:', url);
    
    const authToken = localStorage.getItem('authToken');
    const selectedCompany = localStorage.getItem('selectedCompany');
    
    // For Replit iframe compatibility, we need to add auth to URL as query params
    // since window.open doesn't allow custom headers
    const urlObj = new URL(url, window.location.origin);
    if (authToken) {
      urlObj.searchParams.set('token', authToken);
      console.log('[downloadFile] Auth token added to URL');
    }
    if (selectedCompany) {
      urlObj.searchParams.set('company', selectedCompany);
      console.log('[downloadFile] Company key added to URL:', selectedCompany);
    }
    
    const finalUrl = urlObj.toString();
    console.log('[downloadFile] Opening URL in new tab:', finalUrl);
    
    // Open in new tab - this works better in iframe environments like Replit
    window.open(finalUrl, '_blank');
    
    console.log('[downloadFile] Download triggered successfully');
  } catch (error) {
    console.error('[downloadFile] Error:', error);
    throw error;
  }
}

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
