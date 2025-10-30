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
    const headers: HeadersInit = {};
    
    if (authToken) {
      headers['X-Auth-Token'] = authToken;
      console.log('[downloadFile] Auth token added');
    }
    if (selectedCompany) {
      headers['X-Company-Key'] = selectedCompany;
      console.log('[downloadFile] Company key added:', selectedCompany);
    }
    
    console.log('[downloadFile] Fetching with headers:', Object.keys(headers));
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });
    
    console.log('[downloadFile] Response status:', res.status);
    console.log('[downloadFile] Response headers:', {
      contentType: res.headers.get('content-type'),
      contentDisposition: res.headers.get('content-disposition'),
      contentLength: res.headers.get('content-length'),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[downloadFile] Error response:', errorText);
      throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }
    
    // Get content type from response headers
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    console.log('[downloadFile] Content type:', contentType);
    
    // Create blob with correct MIME type
    const arrayBuffer = await res.arrayBuffer();
    console.log('[downloadFile] ArrayBuffer size:', arrayBuffer.byteLength);
    
    const blob = new Blob([arrayBuffer], { type: contentType });
    console.log('[downloadFile] Blob created:', blob.size, 'bytes, type:', blob.type);
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    
    if (filename) {
      link.download = filename;
    } else {
      const contentDisposition = res.headers.get('content-disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          link.download = filenameMatch[1].replace(/['"]/g, '');
        }
      }
    }
    
    console.log('[downloadFile] Download filename:', link.download);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up after a short delay
    setTimeout(() => {
      window.URL.revokeObjectURL(downloadUrl);
      console.log('[downloadFile] Cleanup complete');
    }, 100);
    
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
