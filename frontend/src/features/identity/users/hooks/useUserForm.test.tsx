import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserForm } from './useUserForm';
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
 * Suite de pruebas unitarias para el hook useUserForm.
 * Verifica la inicialización del estado del formulario y el envío correcto
 * de datos a la API al crear o editar usuarios.
 */
describe('useUserForm', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
        queryClient.clear();
        
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('/api/roles')) return Promise.resolve([{ id: 1, name: 'ADMIN' }]);
            if (url.includes('/api/users/me')) return Promise.resolve({ id: 1, name: 'Admin', permissions: [] });
            return Promise.resolve({});
        });
    });

    /**
     * Verifica que al crear una instancia del formulario en modo creación
     * los valores iniciales de los campos (por ejemplo, el email) estén vacíos.
     */
    it('debe inicializar el formulario', () => {
        const { result } = renderHook(() => 
            useUserForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );
        expect(result.current.formData.email).toBe('');
    });

    /**
     * Verifica que, al rellenar los campos obligatorios y enviar el formulario,
     * se realice correctamente la petición POST a la API para guardar un nuevo usuario
     * y se ejecute el callback de éxito.
     */
    it('debe llamar a la API al guardar un usuario nuevo', async () => {
        mockRequest.mockResolvedValue({ id: 1, email: 'test@es.com' });
        const { result } = renderHook(() => 
            useUserForm(null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await act(async () => {
            result.current.setFieldValue('email', 'nuevo@es.com');
            result.current.setFieldValue('name', 'Nuevo');
            result.current.setFieldValue('roleId', 1);
        });

        await act(async () => {
            await result.current.saveUser();
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/users', expect.objectContaining({
            method: 'POST'
        }));
        expect(mockOnSuccess).toHaveBeenCalled();
    });
});
