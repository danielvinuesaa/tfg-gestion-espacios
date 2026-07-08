import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useResource } from './useResource';
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
 * Suite de pruebas unitarias para el hook `useResource`.
 * Verifica la correcta obtención de datos paginados, la interacción
 * con la paginación, ordenación y la aplicación de filtros.
 */
describe('useResource', () => {
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
        queryClient.clear();
    });

    /**
     * Verifica que al inicializarse sin parámetros extra, el hook solicita
     * la primera página con el tamaño por defecto y actualiza el estado `data`.
     */
    it('debe cargar datos con paginación por defecto', async () => {
        mockRequest.mockResolvedValue({
            content: [{ id: 1, name: 'Test' }],
            totalElements: 1,
            totalPages: 1
        });

        const { result } = renderHook(() => useResource('/api/test'), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.data).toHaveLength(1);
            expect(result.current.pagination.page).toBe(0);
        });

        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('page=0&size=10'), expect.any(Object));
    });

    /**
     * Verifica que la función `setPage` actualiza la página solicitada
     * y dispara una nueva petición a la API.
     */
    it('debe permitir cambiar de página', async () => {
        mockRequest.mockResolvedValue({ content: [], totalElements: 0 });
        const { result } = renderHook(() => useResource('/api/test'), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setPage(2);
        });

        await waitFor(() => {
            expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('page=2'), expect.any(Object));
        });
    });

    /**
     * Verifica que al invocar `setSort` repetidamente sobre la misma columna,
     * se alterna correctamente el sentido de la ordenación (asc/desc).
     */
    it('debe alternar dirección al ordenar por el mismo campo', async () => {
        mockRequest.mockResolvedValue({ content: [], totalElements: 0 });
        const { result } = renderHook(() => useResource('/api/test', { initialSort: 'name', initialDirection: 'asc' }), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setSort('name');
        });

        await waitFor(() => {
            // La coma se codifica como %2C en URLSearchParams
            expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('sort=name%2Cdesc'), expect.any(Object));
        });
    });

    /**
     * Verifica que al establecer nuevos filtros mediante `setFilters`,
     * se reinicia la paginación volviendo a la página 0 y se incluyen los filtros.
     */
    it('debe resetear página al filtrar', async () => {
        mockRequest.mockResolvedValue({ content: [], totalElements: 0 });
        const { result } = renderHook(() => useResource('/api/test', { initialPage: 5 }), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setFilters({ search: 'query' });
        });

        await waitFor(() => {
            expect(result.current.pagination.page).toBe(0);
            expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('search=query'), expect.any(Object));
        });
    });
});
