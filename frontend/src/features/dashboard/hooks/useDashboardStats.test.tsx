import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboardStats } from './useDashboardStats';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { SettingsProvider } from '../../../context/SettingsContext';
import React from 'react';

vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SettingsProvider>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </SettingsProvider>
);

/**
 * Suite de pruebas unitarias para el hook useDashboardStats.
 * Verifica que el hook recupere correctamente las estadísticas de la API
 * y maneje el cambio del rango de fechas de consulta.
 */
describe('useDashboardStats', () => {
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
        
        // Mock successful stats response
        mockRequest.mockResolvedValue({ 
            systemTotals: { totalSpaces: 10 },
            periodActivity: {},
            recentActivity: []
        });
    });

    /**
     * Verifica que, al inicializarse, el hook realice una petición a la API
     * con el rango de fechas por defecto y exponga los datos obtenidos.
     */
    it('debe cargar estadísticas con el rango por defecto', async () => {
        const { result } = renderHook(() => useDashboardStats(), { wrapper });

        await waitFor(() => {
            expect(result.current.stats?.systemTotals.totalSpaces).toBe(10);
        });

        expect(mockRequest).toHaveBeenCalledWith(
            expect.stringContaining('/api/stats?startDate=')
        );
    });

    /**
     * Verifica que al invocar la función para cambiar el rango de fechas,
     * el hook dispare una nueva petición a la API con los nuevos parámetros.
     */
    it('debe permitir cambiar el rango de fechas', async () => {
        const { result } = renderHook(() => useDashboardStats(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            result.current.setDateRange({ start: '2026-01-01', end: '2026-01-31' });
        });

        await waitFor(() => {
            expect(mockRequest).toHaveBeenCalledWith(
                expect.stringContaining('startDate=2026-01-01')
            );
        });
    });
});
