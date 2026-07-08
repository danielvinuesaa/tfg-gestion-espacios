import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useUsers } from './useUsers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../../context/AuthContext';
import { SnackbarProvider } from '../../../../context/SnackbarContext';
import { SettingsProvider } from '../../../../context/SettingsContext';
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
 * Suite de pruebas unitarias para el hook useUsers.
 * Verifica la carga paginada de usuarios desde la API y el comportamiento
 * ante la aplicación de filtros de búsqueda.
 */
describe('useUsers hook', () => {
    beforeEach(() => {
        queryClient.clear();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el hook recupere correctamente la lista inicial de usuarios
     * con los datos de paginación proporcionados por la API.
     */
    it('debe cargar los usuarios satisfactoriamente con paginación', async () => {
        const { result } = renderHook(() => useUsers(), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

        expect(result.current.users).toHaveLength(2);
        expect(result.current.pagination.totalElements).toBe(2);
        expect(result.current.users[0].email).toBe('admin@uniovi.es');
    });

    /**
     * Verifica que al modificar el estado de los filtros (por ejemplo,
     * cambiar el término de búsqueda), el hook inicie una nueva petición y
     * devuelva los resultados filtrados.
     */
    it('debe permitir cambiar el término de búsqueda', async () => {
        const { result } = renderHook(() => useUsers(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            // El filtro se llama 'name' en useUsers/useResource
            result.current.setFilters({ name: 'Profesor' });
        });

        await waitFor(() => {
            expect(result.current.users).toHaveLength(1);
            expect(result.current.users[0].name).toBe('Profesor Test');
        });
    });
});
