import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSpaces } from './useSpaces';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import { SnackbarProvider } from '../../../context/SnackbarContext';
import { SettingsProvider } from '../../../context/SettingsContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
        <SettingsProvider>
            <QueryClientProvider client={queryClient}>
                <SnackbarProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </SnackbarProvider>
            </QueryClientProvider>
        </SettingsProvider>
    </BrowserRouter>
);

/**
 * Suite de pruebas unitarias para el hook useSpaces.
 * Verifica la correcta obtención de espacios, paginación y manejo de filtros.
 */
describe('useSpaces hook', () => {
    beforeEach(() => {
        queryClient.clear();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el hook carga la lista de espacios correctamente y maneja
     * el estado de carga y la paginación de manera adecuada.
     */
    it('debe cargar los espacios satisfactoriamente con paginación', async () => {
        const { result } = renderHook(() => useSpaces(), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

        expect(result.current.spaces).toHaveLength(2);
        expect(result.current.pagination.totalElements).toBe(2);
        expect(result.current.spaces[0].name).toBe('Aula 101');
    });

    /**
     * Verifica que el hook permita establecer filtros de búsqueda por nombre
     * y posteriormente limpiarlos, actualizando su estado interno.
     */
    it('debe permitir buscar por nombre y limpiar filtros', async () => {
        const { result } = renderHook(() => useSpaces(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        // Filtrar
        act(() => {
            result.current.setFilters({ name: 'Laboratorio' });
        });

        // En un backend real se filtraría, pero aquí el MOCK devuelve siempre 2.
        // Si queremos testear filtrado MOCK, deberíamos añadir soporte en handlers.ts
        // Por ahora verificamos que el estado interno sí se actualizó.
        await waitFor(() => {
            expect(result.current.filters.name).toBe('Laboratorio');
        });

        // Limpiar
        act(() => {
            result.current.clearFilters();
        });

        expect(result.current.filters.name).toBe('');
    });
});
