import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLogin } from './useLogin';
import { useAuth } from '../../../context/AuthContext';
import { useApi } from '../../../shared/utils/api';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn()
}));
vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el hook `useLogin`.
 * Verifica la inicialización de estados, la actualización de credenciales,
 * el flujo de inicio de sesión exitoso y el manejo de errores de autenticación.
 */
describe('useLogin', () => {
    const mockLogin = vi.fn();
    const mockRequest = vi.fn();
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ login: mockLogin });
        (useApi as any).mockReturnValue({ request: mockRequest });
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    /**
     * Verifica que los estados de correo, contraseña, carga y error
     * se inicializan con los valores por defecto esperados.
     */
    it('debe inicializar estados correctamente', () => {
        const { result } = renderHook(() => useLogin());
        expect(result.current.email).toBe('');
        expect(result.current.password).toBe('');
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
    });

    /**
     * Verifica que las funciones `setEmail` y `setPassword` actualizan
     * correctamente el estado del hook.
     */
    it('debe actualizar email y password', () => {
        const { result } = renderHook(() => useLogin());
        act(() => {
            result.current.setEmail('test@es.com');
            result.current.setPassword('pass123');
        });
        expect(result.current.email).toBe('test@es.com');
        expect(result.current.password).toBe('pass123');
    });

    /**
     * Verifica que, ante un inicio de sesión válido, se envían las credenciales
     * a la API, se actualiza el contexto de autenticación y se redirige a la página principal.
     */
    it('debe realizar login exitoso y navegar al home', async () => {
        mockRequest.mockResolvedValue({ token: 'fake-token' });
        const { result } = renderHook(() => useLogin());

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/auth/authenticate', expect.any(Object));
        expect(mockLogin).toHaveBeenCalledWith('fake-token');
        expect(mockNavigate).toHaveBeenCalledWith('/');
        expect(result.current.loading).toBe(false);
    });

    /**
     * Verifica que si la API rechaza las credenciales, se establece
     * el mensaje de error apropiado y no se realiza la autenticación local.
     */
    it('debe manejar errores de autenticación', async () => {
        mockRequest.mockRejectedValue(new Error('Credenciales inválidas'));
        const { result } = renderHook(() => useLogin());

        await act(async () => {
            await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
        });

        expect(result.current.error).toBe('Credenciales inválidas');
        expect(result.current.loading).toBe(false);
        expect(mockLogin).not.toHaveBeenCalled();
    });
});
