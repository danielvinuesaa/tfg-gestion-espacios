import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApi, ApiException } from './api';
import { useAuth } from '../../context/AuthContext';
import { useSnackbar } from '../../context/SnackbarContext';
import { useNavigate } from 'react-router-dom';

declare var global: any;

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));
vi.mock('../../context/SnackbarContext', () => ({
    useSnackbar: vi.fn()
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el hook personalizado de consumo de API (useApi).
 * Evalúa la correcta realización de peticiones, inyección de cabeceras de autorización
 * y el manejo adecuado de diversos códigos de error HTTP.
 */
describe('useApi', () => {
    const mockLogout = vi.fn();
    const mockShowSnackbar = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ token: 'mock-token', logout: mockLogout });
        (useSnackbar as any).mockReturnValue({ showSnackbar: mockShowSnackbar });
        (useNavigate as any).mockReturnValue(mockNavigate);
        
        // Mock fetch global
        global.fetch = vi.fn();
    });

    /**
     * Verifica que el hook realice una petición exitosa a la URL especificada,
     * envíe el token de autorización correctamente y devuelva el objeto JSON esperado.
     */
    it('debe realizar una petición exitosa y devolver JSON', async () => {
        const mockResponse = { id: 1, name: 'Test' };
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/json' }),
            json: () => Promise.resolve(mockResponse)
        });

        const { result } = renderHook(() => useApi());
        const data = await result.current.request('/api/test');

        expect(data).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
            headers: expect.any(Headers)
        }));
        
        const headers = (global.fetch as any).mock.calls[0][1].headers;
        expect(headers.get('Authorization')).toBe('Bearer mock-token');
    });

    /**
     * Verifica que, al recibir un error 401 (No autorizado), el hook inicie el proceso
     * de cierre de sesión, redirija al inicio de sesión y muestre una advertencia.
     */
    it('debe manejar error 401 y hacer logout', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 401
        });

        const { result } = renderHook(() => useApi());
        
        await expect(result.current.request('/api/secure')).rejects.toThrow('Sesión expirada');
        
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(mockShowSnackbar).toHaveBeenCalledWith(expect.any(String), 'warning');
    });

    /**
     * Verifica que, ante un error 403 (Prohibido), el hook notifique al usuario
     * mediante un mensaje de error y deniegue el acceso.
     */
    it('debe manejar error 403 y notificar', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 403
        });

        const { result } = renderHook(() => useApi());
        
        await expect(result.current.request('/api/admin-only')).rejects.toThrow('Acceso denegado');
        
        expect(mockShowSnackbar).toHaveBeenCalledWith(expect.any(String), 'error');
    });

    /**
     * Verifica que el hook capture errores 400 y lance una excepción personalizada (ApiException)
     * conteniendo los datos de validación proporcionados por el servidor.
     */
    it('debe lanzar ApiException con datos del servidor en errores 400', async () => {
        const errorData = { message: 'Dato inválido', validationErrors: { field: 'error' } };
        (global.fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve(errorData)
        });

        const { result } = renderHook(() => useApi());
        
        try {
            await result.current.request('/api/fail');
        } catch (error: any) {
            expect(error).toBeInstanceOf(ApiException);
            expect(error.status).toBe(400);
            expect(error.message).toBe('Dato inválido');
            expect(error.validationErrors).toEqual(errorData.validationErrors);
        }
    });

    /**
     * Verifica que si la respuesta tiene un tipo de contenido de archivo (por ejemplo, PDF),
     * el hook devuelva un objeto Blob para permitir su descarga.
     */
    it('debe devolver Blob si el content-type es adecuado', async () => {
        const mockBlob = new Blob(['content'], { type: 'application/pdf' });
        (global.fetch as any).mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Type': 'application/pdf' }),
            blob: () => Promise.resolve(mockBlob)
        });

        const { result } = renderHook(() => useApi());
        const data = await result.current.request('/api/download');

        expect(data).toBeInstanceOf(Blob);
    });
});
