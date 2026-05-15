import { useAuth } from '@clerk/nextjs';

/**
 * Hook para realizar peticiones autenticadas al backend.
 * Utiliza el token de Clerk y maneja la base URL correctamente.
 */
export const useApi = () => {
  const { getToken } = useAuth();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken();
      
      // Asegurar que el endpoint empiece con /api
      let url = endpoint;
      if (!url.startsWith('http') && !url.startsWith('/api')) {
        url = `/api/${url.startsWith('/') ? url.slice(1) : url}`;
      }
      
      // Si el url tiene http://localhost:8000/api, lo cambiamos a /api para usar el proxy
      if (url.includes('http://localhost:8000/api')) {
        url = url.replace('http://localhost:8000/api', '/api');
      }

      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(url, {
        ...options,
        headers,
      });

      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  return {
    fetch: fetchWithAuth,
    get: (endpoint: string, options: RequestInit = {}) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body: any, options: RequestInit = {}) => 
      fetchWithAuth(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any, options: RequestInit = {}) => 
      fetchWithAuth(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: any, options: RequestInit = {}) => 
      fetchWithAuth(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string, options: RequestInit = {}) => 
      fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),
  };
};
