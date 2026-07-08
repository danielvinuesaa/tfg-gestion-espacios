import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAvailabilitySearch } from './useAvailabilitySearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../../context/AuthContext';
import { SnackbarProvider } from '../../../context/SnackbarContext';
import { SettingsProvider } from '../../../context/SettingsContext';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

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
 * @file useAvailabilitySearch.test.tsx
 * @description Suite de pruebas para el hook de búsqueda de disponibilidad.
 * Comprueba los distintos modos de búsqueda, la gestión de estado de resultados
 * y el marcado de filtros modificados (stale).
 */
describe('useAvailabilitySearch hook', () => {
    beforeEach(() => {
        queryClient.clear();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el estado del hook inicialice con el modo no-flexible y la
     * página sin datos de propuestas por defecto.
     */
    it('debe inicializar con los valores por defecto', () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        expect(result.current.filters.flexible).toBe(false);
        expect(result.current.filters.durationHours).toBe(1);
        expect(result.current.searched).toBe(false);
        expect(result.current.isStale).toBe(false);
        expect(result.current.activeProposals).toEqual([]);
    });

    /**
     * Verifica que si faltan los rangos requeridos en modo estricto,
     * el hook genere un error y prevenga la consulta a la API.
     */
    it('debe validar errores antes de buscar (modo estricto)', async () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        act(() => {
            // Faltan fechas startTime y endTime
            result.current.handleSearch();
        });

        expect(result.current.error).toBe('Seleccione un rango horario.');
    });

    /**
     * Verifica que al realizar una búsqueda en modo estricto ("fijo"),
     * devuelva el listado de propuestas estáticas.
     */
    it('debe realizar búsqueda estática correctamente', async () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        act(() => {
            result.current.setFilters({
                ...result.current.filters,
                startTime: new Date('2027-05-25T10:00:00'),
                endTime: new Date('2027-05-25T11:00:00'),
            });
        });

        // Trigger search
        await act(async () => {
            await result.current.handleSearch();
        });

        // MSW returns array of proposals for static search
        await waitFor(() => {
            expect(result.current.activeProposals.length).toBeGreaterThan(0);
        });

        expect(result.current.searched).toBe(true);
        expect(result.current.activeProposals[0].totalCapacity).toBe(50);
        expect(result.current.activeProposals[0].recommendationReason).toBe('Asignación directa individual');
    });

    /**
     * Verifica que al realizar una búsqueda con rango de días y horas (flexible),
     * devuelva los slots ordenados por días y asigne automáticamente
     * el primer resultado con disponibilidad.
     */
    it('debe realizar búsqueda flexible correctamente', async () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        act(() => {
            result.current.setFilters({
                ...result.current.filters,
                flexible: true,
                rangeStart: new Date('2027-05-25'),
                rangeEnd: new Date('2027-05-26'),
                dailyStart: new Date('2027-05-25T08:00:00'),
                dailyEnd: new Date('2027-05-25T20:00:00'),
            });
        });

        await act(async () => {
            await result.current.handleSearch();
        });

        await waitFor(() => {
            expect(result.current.dailyResults.length).toBeGreaterThan(0);
        });

        // En búsqueda flexible se autoselecciona el primer slot con resultados
        expect(result.current.selectedDate).toBe('2027-05-25');
        expect(result.current.selectedSlotIdx).toBe(0);
        
        // Debe tener propuestas activas
        expect(result.current.activeProposals.length).toBe(1);
        expect(result.current.activeProposals[0].efficiencyScore).toBe(100);
    });

    /**
     * Verifica que al modificar parámetros de filtrado tras una búsqueda previa,
     * el hook reconozca que hay datos pendientes de actualizar y se marque como "stale".
     */
    it('debe detectar filtros stales (obsoletos)', async () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        // Setup inicial y busqueda
        act(() => {
            result.current.setFilters({
                ...result.current.filters,
                startTime: new Date('2027-05-25T10:00:00'),
                endTime: new Date('2027-05-25T11:00:00'),
            });
        });

        await act(async () => {
            await result.current.handleSearch();
        });

        expect(result.current.isStale).toBe(false);

        // Modificamos un filtro
        act(() => {
            result.current.setFilters({
                ...result.current.filters,
                minCapacity: '100'
            });
        });

        // Ahora está stale
        expect(result.current.isStale).toBe(true);
    });

    /**
     * Verifica que la función clearFilters devuelva el hook
     * a su estado original previo a cualquier búsqueda.
     */
    it('debe limpiar filtros y resultados', async () => {
        const { result } = renderHook(() => useAvailabilitySearch(), { wrapper });

        act(() => {
            result.current.setFilters({
                ...result.current.filters,
                startTime: new Date('2027-05-25T10:00:00'),
                endTime: new Date('2027-05-25T11:00:00'),
            });
        });

        await act(async () => {
            await result.current.handleSearch();
        });

        expect(result.current.searched).toBe(true);

        act(() => {
            result.current.clearFilters();
        });

        expect(result.current.searched).toBe(false);
        expect(result.current.filters.startTime).toBeNull();
        expect(result.current.activeProposals).toEqual([]);
    });
});
