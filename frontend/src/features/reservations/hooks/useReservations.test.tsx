import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReservations } from './useReservations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { SnackbarProvider } from '../../../context/SnackbarContext';
import React from 'react';

vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

vi.mock('../../../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SnackbarProvider>
    </QueryClientProvider>
);

/**
 * Suite de pruebas unitarias para el hook useReservations.
 * Verifica la correcta carga de reservas, catálogos, y la lógica
 * de actualización de estado y filtros de búsqueda.
 */
describe('useReservations hook', () => {
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
        (useAuth as any).mockReturnValue({
            hasPermission: () => true,
            user: { id: 1, name: 'Admin', role: 'ADMIN' }
        });
        
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('/api/spaces')) return Promise.resolve([]);
            if (url.includes('/api/subjects')) return Promise.resolve([]);
            if (url.includes('/api/users')) return Promise.resolve([]);
            if (url.includes('/api/reservations')) return Promise.resolve({
                content: [],
                totalElements: 0
            });
            return Promise.resolve({});
        });
    });

    /**
     * Verifica que el hook realice las llamadas necesarias para cargar
     * catálogos y reservas en el montaje inicial.
     */
    it('debe cargar catálogos y reservas al inicializar', async () => {
        const { result } = renderHook(() => useReservations(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('/api/spaces'));
        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('/api/reservations'), expect.any(Object));
    });

    /**
     * Verifica que la función updateStatus realice correctamente
     * la petición PATCH a la API para modificar el estado de una reserva.
     */
    it('debe permitir actualizar el estado de una reserva', async () => {
        mockRequest.mockResolvedValue({});
        const { result } = renderHook(() => useReservations(), { wrapper });

        await act(async () => {
            const success = await result.current.updateStatus(1, 'APROBADA');
            expect(success).toBe(true);
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/reservations/1/status', expect.objectContaining({
            method: 'PATCH'
        }));
    });

    /**
     * Verifica que el hook permita establecer filtros y también
     * limpiarlos, devolviendo el estado a sus valores por defecto.
     */
    it('debe permitir limpiar filtros', async () => {
        const { result } = renderHook(() => useReservations(), { wrapper });

        act(() => {
            result.current.setFilters({ ...result.current.filters, search: 'test' });
        });
        expect(result.current.filters.search).toBe('test');

        act(() => {
            result.current.clearFilters();
        });
        expect(result.current.filters.search).toBe('');
    });

    /**
     * Verifica que por razones de seguridad/optimización, no se realice
     * la petición de usuarios si el perfil no posee permisos de gestión.
     */
    it('no debe cargar la lista de usuarios si el usuario no tiene permisos de gestión', async () => {
        (useAuth as any).mockReturnValue({
            hasPermission: () => false,
            user: { id: 2, name: 'Profe', role: 'PROFESOR' }
        });

        renderHook(() => useReservations(), { wrapper });

        expect(mockRequest).not.toHaveBeenCalledWith(expect.stringContaining('/api/users'));
    });
});
