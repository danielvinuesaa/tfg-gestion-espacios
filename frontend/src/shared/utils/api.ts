import { useMemo, useCallback } from 'react';
import { useSnackbar } from '../../context/SnackbarContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Excepción personalizada para errores de la API.
 * Permite transportar el código de estado y los errores de validación estructurados.
 */
export class ApiException extends Error {
    constructor(
        public message: string,
        public status: number,
        public validationErrors?: Record<string, string>,
        public errorType?: string
    ) {
        super(message);
        this.name = 'ApiException';
    }
}

/**
 * Utilidad para realizar peticiones fetch centralizando la gestión de errores (401, 403).
 * Proporciona una capa de abstracción para evitar repetir lógica de headers y errores.
 */
export const useApi = () => {
    const { token, logout } = useAuth();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();

    /**
     * Realiza una petición fetch con gestión automática de errores y tokens.
     * 
     * @param url Endpoint de la API (relativo a la raíz).
     * @param options Opciones estándar de fetch (method, body, etc).
     * @returns Los datos de la respuesta (JSON, Blob o texto plano).
     * @throws {ApiException} Si la respuesta no es exitosa.
     */
    const request = useCallback(async (url: string, options: RequestInit = {}) => {
        const headers = new Headers(options.headers || {});
        
        // Inyectar token si existe
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        // Si el body es un objeto, poner Content-Type JSON
        if (options.body && typeof options.body === 'string') {
            headers.set('Content-Type', 'application/json');
        }

        try {
            const response = await fetch(url, { ...options, headers });

            // Gestión centralizada de errores comunes
            // Excluimos el endpoint de login de la redirección automática por 401
            if (response.status === 401 && !url.includes('/api/auth/authenticate')) {
                logout();
                navigate('/login');
                showSnackbar('Tu sesión ha expirado. Por favor, identifícate de nuevo.', 'warning');
                throw new ApiException('Sesión expirada', 401);
            }

            if (response.status === 403) {
                showSnackbar('No tienes permisos suficientes para realizar esta acción.', 'error');
                throw new ApiException('Acceso denegado', 403);
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiException(
                    errorData.message || `Error en la petición: ${response.status}`,
                    response.status,
                    errorData.validationErrors,
                    errorData.error
                );
            }

            // Si es un NO_CONTENT (204), retornamos null
            if (response.status === 204) return null;

            // Determinar tipo de respuesta según el Content-Type
            const contentType = response.headers.get('Content-Type');
            if (contentType?.includes('application/json')) {
                return await response.json();
            } else if (
                contentType?.includes('application/pdf') || 
                contentType?.includes('application/octet-stream') ||
                contentType?.includes('text/csv')
            ) {
                return await response.blob();
            }
            
            return await response.text();
        } catch (error: any) {
            if (error instanceof ApiException) throw error;
            if (error.name === 'AbortError') throw error;
            
            console.error(`API Network Error [${url}]:`, error);
            throw new ApiException('Error de conexión con el servidor', 0);
        }
    }, [token, logout, showSnackbar, navigate]);

    return useMemo(() => ({ request }), [request]);
};
