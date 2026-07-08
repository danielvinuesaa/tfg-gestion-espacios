import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDeleteEntity } from './useDeleteEntity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../utils/api';
import React from 'react';

vi.mock('../utils/api', () => ({
    useApi: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
);

/**
 * Suite de pruebas unitarias para el hook `useDeleteEntity`.
 * Verifica la lógica de comprobación de conflictos previos al borrado,
 * la ejecución de la petición de borrado (con la bandera `force` si es necesario)
 * y el manejo de errores del servidor.
 */
describe('useDeleteEntity', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();

    const options = {
        conflictsUrl: '/api/test/1/conflicts',
        deleteUrl: '/api/test/1',
        open: true,
        onSuccess: mockOnSuccess,
        successMessage: 'Borrado con éxito'
    };

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
    });

    /**
     * Verifica que cuando se abre el diálogo o componente (open = true),
     * el hook consulta el endpoint de conflictos y actualiza el estado interno
     * al terminar.
     */
    it('debe cargar conflictos al abrir', async () => {
        mockRequest.mockResolvedValue({ hasConflicts: true, conflictCount: 5 });

        const { result } = renderHook(() => useDeleteEntity(options), { wrapper });

        expect(result.current.checkingConflicts).toBe(true);

        await waitFor(() => {
            expect(result.current.checkingConflicts).toBe(false);
            expect(result.current.conflicts?.conflictCount).toBe(5);
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/test/1/conflicts');
    });

    /**
     * Verifica que al llamar a `handleDelete` y existir conflictos detectados,
     * la petición de borrado incluye la query param `force=true`.
     */
    it('debe llamar a DELETE con force=true si hay conflictos', async () => {
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('conflicts')) return Promise.resolve({ hasConflicts: true });
            return Promise.resolve({});
        });

        const { result } = renderHook(() => useDeleteEntity(options), { wrapper });

        await waitFor(() => expect(result.current.checkingConflicts).toBe(false));

        await act(async () => {
            await result.current.handleDelete();
        });

        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('force=true'), expect.objectContaining({
            method: 'DELETE'
        }));
        expect(mockOnSuccess).toHaveBeenCalledWith('Borrado con éxito');
    });

    /**
     * Verifica el comportamiento del hook en caso de que el servidor devuelva un
     * error durante el borrado, asegurando que se extraiga el mensaje de error y
     * no se llame al callback de éxito.
     */
    it('debe manejar errores al borrar', async () => {
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('conflicts')) return Promise.resolve({ hasConflicts: false });
            return Promise.reject(new Error('Error del servidor'));
        });

        const { result } = renderHook(() => useDeleteEntity(options), { wrapper });

        await waitFor(() => expect(result.current.checkingConflicts).toBe(false));

        await act(async () => {
            await result.current.handleDelete();
        });

        expect(result.current.error).toBe('Error del servidor');
        expect(mockOnSuccess).not.toHaveBeenCalled();
    });
});
