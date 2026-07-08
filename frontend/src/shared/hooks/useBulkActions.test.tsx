import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBulkActions } from './useBulkActions';
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
 * Suite de pruebas unitarias para el hook `useBulkActions`.
 * Verifica la gestión de la selección de elementos (individual, múltiple y global),
 * la consulta de conflictos en acciones masivas y la ejecución de borrados en lote.
 */
describe('useBulkActions', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();

    const options = {
        resourceNamePlural: 'items',
        endpoint: '/api/items',
        onSuccess: mockOnSuccess
    };

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
    });

    /**
     * Verifica que los métodos `handleSelectOne` y `handleSelectAll`
     * funcionen correctamente activando o desactivando la selección de los IDs provistos.
     */
    it('debe gestionar selección individual y múltiple', () => {
        const { result } = renderHook(() => useBulkActions(options), { wrapper });

        act(() => {
            result.current.handleSelectOne(1);
            result.current.handleSelectOne(2);
        });
        expect(result.current.selectedIds).toEqual([1, 2]);

        act(() => {
            result.current.handleSelectOne(1); // Toggle off
        });
        expect(result.current.selectedIds).toEqual([2]);

        act(() => {
            result.current.handleSelectAll([10, 20]);
        });
        expect(result.current.selectedIds).toEqual([10, 20]);
    });

    /**
     * Verifica que al intentar abrir el modal de borrado, el hook realice una
     * petición para comprobar los conflictos de los elementos seleccionados
     * y actualice el estado interno adecuadamente.
     */
    it('debe llamar a la API de conflictos al abrir el modal', async () => {
        mockRequest.mockResolvedValue({ totalTarget: 2, conflictCount: 0 });
        const { result } = renderHook(() => useBulkActions(options), { wrapper });

        act(() => {
            result.current.handleSelectAll([1, 2]);
        });
        
        await waitFor(() => expect(result.current.selectedIds).toEqual([1, 2]));

        act(() => {
            result.current.toggleBulkDeleteModal(true);
        });

        expect(result.current.loadingBulk).toBe(true);

        await waitFor(() => {
            expect(result.current.bulkConflictSummary).toEqual({ totalTarget: 2, conflictCount: 0 });
            expect(result.current.isBulkDeleteDialogOpen).toBe(true);
        });

        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('ids=1&ids=2'));
    });

    /**
     * Verifica que el método `handleBulkDelete` realice la solicitud de borrado
     * por ID explícitos y limpie la selección tras un borrado exitoso.
     */
    it('debe ejecutar el borrado masivo y limpiar selección', async () => {
        mockRequest.mockResolvedValue({});
        const { result } = renderHook(() => useBulkActions(options), { wrapper });

        act(() => {
            result.current.handleSelectAll([1, 2]);
        });

        await act(async () => {
            await result.current.handleBulkDelete(false);
        });

        expect(mockRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/items/bulk?ids=1&ids=2'),
            expect.objectContaining({ method: 'DELETE' })
        );
        expect(mockOnSuccess).toHaveBeenCalledWith('Se han eliminado los items correctamente.');
        expect(result.current.selectedIds).toEqual([]);
    });

    /**
     * Verifica que si se activa la selección global (afectando a todos los
     * elementos filtrados), `handleBulkDelete` efectúa la solicitud enviando
     * los parámetros de filtro en lugar de una lista cerrada de IDs.
     */
    it('debe soportar selección global', async () => {
        const getFilters = () => new URLSearchParams({ search: 'test' });
        const { result } = renderHook(() => useBulkActions({ ...options, getFilters }), { wrapper });

        act(() => {
            result.current.setIsGlobalSelection(true);
        });

        await act(async () => {
            await result.current.handleBulkDelete(true); // force=true
        });

        expect(mockRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/items/bulk?search=test&force=true'),
            expect.any(Object)
        );
    });
});
