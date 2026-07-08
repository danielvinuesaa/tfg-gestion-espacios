import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoleForm } from './useRoleForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApi } from '../../../../shared/utils/api';
import { AuthProvider } from '../../../../context/AuthContext';
import React from 'react';

vi.mock('../../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            {children}
        </AuthProvider>
    </QueryClientProvider>
);

/**
 * Suite de pruebas unitarias para el hook useRoleForm.
 * Comprueba el manejo del estado del formulario, la gestión de la
 * lista de permisos y las llamadas API necesarias para guardar un rol.
 */
describe('useRoleForm', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
        queryClient.clear();
        
        mockRequest.mockResolvedValue({});
    });

    /**
     * Verifica que, al empezar el proceso de creación, el hook asigne
     * valores iniciales limpios al formulario.
     */
    it('debe inicializar con valores por defecto', () => {
        const { result } = renderHook(() => 
            useRoleForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );
        expect(result.current.formData.name).toBe('');
        expect(result.current.formData.permissions).toEqual([]);
    });

    /**
     * Verifica que la función que altera individualmente los permisos del
     * rol modifique correctamente la lista de permisos dentro del estado.
     */
    it('debe permitir añadir y quitar permisos', () => {
        const { result } = renderHook(() => 
            useRoleForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        act(() => {
            result.current.togglePermission('VER_ESPACIOS', true);
        });
        expect(result.current.formData.permissions).toContain('VER_ESPACIOS');

        act(() => {
            result.current.togglePermission('VER_ESPACIOS', false);
        });
        expect(result.current.formData.permissions).not.toContain('VER_ESPACIOS');
    });

    /**
     * Verifica que se puedan marcar simultáneamente múltiples permisos
     * pertenecientes a una misma categoría.
     */
    it('debe marcar toda una categoría', () => {
        const { result } = renderHook(() => 
            useRoleForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        act(() => {
            result.current.toggleCategory(['P1', 'P2'], true);
        });
        expect(result.current.formData.permissions).toContain('P1');
        expect(result.current.formData.permissions).toContain('P2');
    });

    /**
     * Verifica que tras llenar los datos necesarios, al lanzar el guardado,
     * el hook ejecute una petición POST a la ruta de roles en la API.
     */
    it('debe llamar a la API al guardar', async () => {
        const { result } = renderHook(() => 
            useRoleForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await act(async () => {
            result.current.setFieldValue('name', 'NUEVO_ROL');
        });

        await act(async () => {
            await result.current.saveRole();
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/roles', expect.objectContaining({
            method: 'POST'
        }));
        expect(mockOnSuccess).toHaveBeenCalled();
    });
});
