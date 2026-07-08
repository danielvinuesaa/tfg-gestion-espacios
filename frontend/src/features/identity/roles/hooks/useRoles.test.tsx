import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useRoles } from './useRoles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../../context/AuthContext';
import { SnackbarProvider } from '../../../../context/SnackbarContext';
import { SettingsProvider } from '../../../../context/SettingsContext';
import { BrowserRouter } from 'react-router-dom';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';
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
 * Suite de pruebas unitarias para el hook useRoles.
 * Verifica la carga de roles, el filtrado local por búsqueda,
 * la ordenación de datos y la funcionalidad de restaurar un rol.
 */
describe('useRoles hook', () => {
    beforeEach(() => {
        queryClient.clear();
        localStorage.clear();
        localStorage.setItem('token', 'mock-token');
        vi.useRealTimers();
    });

    /**
     * Verifica que el hook cargue los roles satisfactoriamente desde la API.
     * Comprueba el estado de carga inicial y los datos resultantes una vez finalizada.
     */
    it('debe cargar los roles satisfactoriamente', async () => {
        const { result } = renderHook(() => useRoles(), { wrapper });

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 3000 });

        expect(result.current.roles).toHaveLength(2);
        expect(result.current.roles[0].name).toBe('ADMIN');
    });

    /**
     * Verifica que el hook aplique el filtrado local de roles mediante una búsqueda
     * de texto respetando el tiempo de debounce configurado.
     */
    it('debe filtrar roles localmente por búsqueda con debounce', async () => {
        const { result } = renderHook(() => useRoles(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setSearchQuery('PROFESOR');
        });

        // Esperar al debounce (300ms)
        await waitFor(() => {
            expect(result.current.roles).toHaveLength(1);
            expect(result.current.roles[0].name).toBe('PROFESOR');
        }, { timeout: 1000 });
    });

    /**
     * Verifica que el hook actualice el estado de ordenación (campo y dirección)
     * al solicitar ordenar por una columna, alternando entre ascendente y descendente.
     */
    it('debe cambiar la ordenación y disparar nueva carga', async () => {
        const { result } = renderHook(() => useRoles(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.handleSort('description');
        });

        expect(result.current.sortBy).toBe('description');
        expect(result.current.direction).toBe('asc');

        // Si pulsamos de nuevo el mismo campo, debe cambiar a desc
        act(() => {
            result.current.handleSort('description');
        });
        expect(result.current.direction).toBe('desc');
    });

    /**
     * Verifica que el hook exponga y ejecute correctamente la función para
     * restaurar un rol eliminado, llamando al endpoint correspondiente de la API.
     */
    it('debe permitir restaurar un rol eliminado', async () => {
        let called = false;
        server.use(
            http.post('/api/roles/3/activate', () => {
                called = true;
                return new HttpResponse(null, { status: 204 });
            })
        );

        const { result } = renderHook(() => useRoles(), { wrapper });

        await act(async () => {
            await result.current.restoreRole(3);
        });

        expect(called).toBe(true);
    });
});
