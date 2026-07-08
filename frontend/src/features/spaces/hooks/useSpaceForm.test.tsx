import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSpaceForm } from './useSpaceForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import React from 'react';

vi.mock('../../../shared/utils/api', () => ({
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
 * @file useSpaceForm.test.tsx
 * @description Suite de pruebas para el hook useSpaceForm.
 * Valida la lógica de estado del formulario de creación y edición de espacios,
 * así como la integración con la API subyacente.
 */
describe('useSpaceForm', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
        queryClient.clear();
    });

    /**
     * Verifica que el estado interno se inicialice vacío y 
     * con valores neutros por defecto cuando se está en modo creación.
     */
    it('debe inicializar el formulario con valores por defecto', () => {
        const { result } = renderHook(() => 
            useSpaceForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );
        expect(result.current.formData.name).toBe('');
        expect(result.current.formData.status).toBe('DISPONIBLE');
    });

    /**
     * Verifica que el formulario reciba y pre-cargue los valores de un
     * espacio cuando se inicializa en modo de edición.
     */
    it('debe hidratar el formulario con datos iniciales en modo edición', async () => {
        const initialData = { id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50, status: 'DISPONIBLE' };
        const { result } = renderHook(() => 
            useSpaceForm(initialData as any, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await waitFor(() => {
            expect(result.current.formData.name).toBe('Aula 101');
        });
    });

    /**
     * Verifica que no se permitan valores negativos en campos numéricos
     * como la capacidad total; asignando el valor a 1 si esto sucede.
     */
    it('debe validar que la capacidad sea positiva', () => {
        const { result } = renderHook(() => 
            useSpaceForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        act(() => {
            result.current.handleChange({ 
                target: { name: 'totalCapacity', value: '-10' } 
            } as any);
        });

        expect(result.current.formData.totalCapacity).toBe(1);
    });

    /**
     * Verifica que al ejecutar el guardado del formulario, se lance una 
     * petición por API (POST/PUT) y se manejen adecuadamente los callbacks.
     */
    it('debe llamar a la API al guardar', async () => {
        mockRequest.mockResolvedValue({ id: 1, name: 'Test' });
        const { result } = renderHook(() => 
            useSpaceForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await act(async () => {
            result.current.setFieldValue('name', 'Nueva Aula');
            result.current.setFieldValue('type', 'AULA');
        });

        await act(async () => {
            await result.current.saveSpace();
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/spaces', expect.objectContaining({
            method: 'POST'
        }));
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockHandleClose).toHaveBeenCalled();
    });
});
