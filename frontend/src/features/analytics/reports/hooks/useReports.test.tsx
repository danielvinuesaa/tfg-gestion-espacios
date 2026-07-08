import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReports } from './useReports';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../../shared/utils/api';
import { SnackbarProvider } from '../../../../context/SnackbarContext';
import React from 'react';

vi.mock('../../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

// Mock para URL.createObjectURL y revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <SnackbarProvider>
            {children}
        </SnackbarProvider>
    </QueryClientProvider>
);

/**
 * @file useReports.test.tsx
 * @description Suite de pruebas para el hook useReports.
 * Verifica la lógica de estado y llamadas a la API requerida para la generación y validación de informes.
 */
describe('useReports', () => {
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        (useApi as any).mockReturnValue({ request: mockRequest });
        
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('/api/spaces')) return Promise.resolve([]);
            if (url.includes('/api/subjects')) return Promise.resolve([]);
            if (url.includes('validate')) return Promise.resolve([]);
            if (url.includes('signature-logs')) return Promise.resolve(new Blob());
            return Promise.resolve({});
        });
    });

    /**
     * Verifica que el hook inicialice correctamente su estado
     * con el tipo de reporte por defecto y el estado de carga desactivado.
     */
    it('debe inicializar con valores por defecto', () => {
        const { result } = renderHook(() => useReports(), { wrapper });
        expect(result.current.reportType).toBe('SIGNATURES');
        expect(result.current.loading).toBe(false);
    });

    /**
     * Verifica que `isConfigurationIncomplete` se calcule correctamente y actualice
     * cuando se proporcionan los filtros necesarios (ej. selección de espacios).
     */
    it('debe validar si la configuración está incompleta', () => {
        const { result } = renderHook(() => useReports(), { wrapper });
        expect(result.current.isConfigurationIncomplete).toBe(true);

        act(() => {
            result.current.updateFilter('spaceIds', [1]);
        });

        expect(result.current.isConfigurationIncomplete).toBe(false);
    });

    /**
     * Verifica que se llame a los endpoints de validación y de generación
     * del informe en formato PDF, devolviendo el Blob simulado.
     */
    it('debe ejecutar el flujo de validación y generación PDF', async () => {
        const { result } = renderHook(() => useReports(), { wrapper });

        act(() => {
            result.current.updateFilter('spaceIds', [1]);
        });

        await act(async () => {
            await result.current.handleTriggerAction('PDF');
        });

        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('validate-availability'), expect.any(Object));
        expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('signature-logs'), expect.any(Object));
        expect(result.current.previewUrl).toBe('mock-url');
    });

    /**
     * Verifica que si durante la validación previa existen espacios o asignaturas vacías,
     * el hook lo detecte, exponga los IDs vacíos y no ejecute aún la generación final.
     */
    it('debe detectar elementos sin disponibilidad y pedir confirmación', async () => {
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('validate')) return Promise.resolve([1]); 
            return Promise.resolve([]);
        });

        const { result } = renderHook(() => useReports(), { wrapper });

        act(() => {
            result.current.updateFilter('spaceIds', [1, 2]);
        });

        await act(async () => {
            await result.current.handleTriggerAction('PDF');
        });

        expect(result.current.emptyIds).toEqual([1]);
        // No debe haber llamado aún a la generación final
        expect(mockRequest).not.toHaveBeenCalledWith(expect.stringContaining('signature-logs'), expect.objectContaining({ method: 'POST' }));
    });
});
