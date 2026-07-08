import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendarEvents } from './useCalendarEvents';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { SnackbarProvider } from '../../../context/SnackbarContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>
            <SnackbarProvider>
                {children}
            </SnackbarProvider>
        </MemoryRouter>
    </QueryClientProvider>
);

/**
 * Suite de pruebas unitarias para el hook useCalendarEvents.
 * Verifica la correcta obtención de espacios y eventos, el filtrado local
 * por estado/tipo, y las operaciones de actualización (ej. aprobar reserva).
 */
describe('useCalendarEvents', () => {
    const mockRequest = vi.fn();
    const currentDate = new Date(2026, 4, 25);

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
        
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('/api/spaces')) return Promise.resolve([{ id: 1, name: 'Aula 101' }]);
            if (url.includes('/api/reservations')) return Promise.resolve({
                content: [
                    { id: 1, title: 'Reserva 1', status: 'APROBADA', type: 'CLASE', startTime: '2026-05-25T10:00:00', endTime: '2026-05-25T12:00:00', spaces: [{ id: 1, name: 'Aula 101' }], user: { name: 'Juan' } }
                ]
            });
            return Promise.resolve({});
        });
    });

    /**
     * Verifica que al inicializar el hook se realicen las peticiones
     * correspondientes para cargar los espacios y eventos disponibles.
     */
    it('debe cargar espacios y eventos al inicializar', async () => {
        const { result } = renderHook(() => useCalendarEvents(currentDate, 'month'), { wrapper });

        await waitFor(() => {
            expect(result.current.spaces).toHaveLength(1);
            expect(result.current.filteredEvents).toHaveLength(1);
        });

        expect(result.current.allTypes).toContain('CLASE');
    });

    /**
     * Verifica que los eventos puedan ser filtrados localmente según su estado,
     * actualizando la lista de eventos filtrados en consecuencia.
     */
    it('debe filtrar eventos por estado localmente', async () => {
        const { result } = renderHook(() => useCalendarEvents(currentDate, 'month'), { wrapper });

        await waitFor(() => expect(result.current.filteredEvents).toHaveLength(1));

        act(() => {
            result.current.toggleStatus('APROBADA'); // Desmarcar APROBADA
        });

        expect(result.current.filteredEvents).toHaveLength(0);
    });

    /**
     * Verifica que la función handleApprove llame al endpoint correcto
     * para aprobar una reserva y devuelva true si tiene éxito.
     */
    it('debe permitir aprobar una reserva', async () => {
        mockRequest.mockResolvedValue({});
        const { result } = renderHook(() => useCalendarEvents(currentDate, 'month'), { wrapper });

        await act(async () => {
            const success = await result.current.handleApprove(1);
            expect(success).toBe(true);
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/reservations/1/status', expect.objectContaining({
            method: 'PATCH'
        }));
    });

    /**
     * Verifica que si existen identificadores de espacios en los parámetros
     * de la URL, el hook inicialice la selección con dichos espacios.
     */
    it('debe inicializar espacios desde la URL si están presentes', async () => {
        // Para probar location.search necesitamos un router que lo provea.
        // MemoryRouter initialEntries puede ayudar.
        const wrapperWithUrl = ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/calendar?spaceId=1,2']}>
                    <SnackbarProvider>
                        {children}
                    </SnackbarProvider>
                </MemoryRouter>
            </QueryClientProvider>
        );

        const { result } = renderHook(() => useCalendarEvents(currentDate, 'month'), { wrapper: wrapperWithUrl });

        await waitFor(() => {
            expect(result.current.selectedSpaceIds).toEqual([1, 2]);
        });
    });
});
