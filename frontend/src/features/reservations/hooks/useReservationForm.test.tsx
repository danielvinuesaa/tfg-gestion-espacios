import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useReservationForm } from './useReservationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { useApi } from '../../../shared/utils/api';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import React from 'react';

// Mocks
vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

vi.mock('../../../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../context/AuthContext')>();
    return {
        ...actual,
        useAuth: vi.fn()
    };
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <MemoryRouter>
                {children}
            </MemoryRouter>
        </AuthProvider>
    </QueryClientProvider>
);

/**
 * Suite de pruebas unitarias para el hook useReservationForm.
 * Verifica la inicialización del formulario, la hidratación de datos,
 * el cambio de campos y la llamada al endpoint para guardar la reserva.
 */
describe('useReservationForm', () => {
    const mockRequest = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
        (useAuth as any).mockReturnValue({
            hasPermission: () => true,
            user: { id: 1, name: 'Admin', role: 'ADMIN' }
        });
        queryClient.clear();
        
        // Mock responses for catalogs
        mockRequest.mockImplementation((url: string) => {
            if (url.includes('/api/spaces')) return Promise.resolve({ content: [{ id: 1, name: 'Aula 101' }] });
            if (url.includes('/api/users')) return Promise.resolve({ content: [] });
            if (url.includes('/api/subjects')) return Promise.resolve({ content: [] });
            if (url.includes('/api/reservations/conflicts')) return Promise.resolve([]);
            return Promise.resolve({});
        });
    });

    /**
     * Verifica que los valores del formulario se inicialicen limpios
     * cuando se abre en modo de creación sin slot inicial.
     */
    it('debe inicializar el formulario en modo creación', async () => {
        const { result } = renderHook(() => 
            useReservationForm(null, null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        expect(result.current.formData.title).toBe('');
        expect(result.current.formData.spaceIds).toEqual([]);
    });

    /**
     * Verifica que al proporcionar un slot (tramo horario y espacio) inicial,
     * el formulario asigne esos valores automáticamente.
     */
    it('debe hidratar el formulario desde initialSlot', async () => {
        const slot = { start: new Date(2026, 5, 25, 10), end: new Date(2026, 5, 25, 11), spaceIds: [1] };
        const { result } = renderHook(() => 
            useReservationForm(null, slot, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await waitFor(() => {
            expect(result.current.formData.spaceIds).toEqual([1]);
            expect(result.current.formData.startTime).toEqual(slot.start);
        });
    });

    /**
     * Verifica que el estado interno se actualice correctamente
     * cuando se invoca la función setFieldValue del hook.
     */
    it('debe permitir cambiar campos y validar', async () => {
        const { result } = renderHook(() => 
            useReservationForm(null, null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        act(() => {
            result.current.setFieldValue('title', 'Mi Evento');
        });

        expect(result.current.formData.title).toBe('Mi Evento');
    });

    /**
     * Verifica que tras llenar la información requerida de la reserva,
     * la función de guardado emita el POST a la API correctamente.
     */
    it('debe llamar a la API al guardar una reserva válida', async () => {
        const futureStart = new Date();
        futureStart.setDate(futureStart.getDate() + 1);
        const futureEnd = new Date(futureStart);
        futureEnd.setHours(futureStart.getHours() + 1);

        const { result } = renderHook(() => 
            useReservationForm(null, null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        await act(async () => {
            result.current.setFieldValue('title', 'Test Reserva');
            result.current.setFieldValue('type', 'OTROS');
            result.current.setFieldValue('spaceIds', [1]);
            result.current.setFieldValue('startTime', futureStart);
            result.current.setFieldValue('endTime', futureEnd);
        });

        await act(async () => {
            await result.current.saveReservation();
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/reservations', expect.objectContaining({
            method: 'POST'
        }));
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockHandleClose).toHaveBeenCalled();
    });

    /**
     * Verifica que no se realicen peticiones innecesarias o no permitidas
     * de lectura de usuarios cuando el usuario en sesión es básico.
     */
    it('no debe cargar la lista de usuarios si el usuario es básico (sin permisos de gestión)', async () => {
        (useAuth as any).mockReturnValue({
            hasPermission: () => false,
            user: { id: 2, name: 'Profe', role: 'PROFESOR' }
        });

        renderHook(() => 
            useReservationForm(null, null, true, mockHandleClose, mockOnSuccess), 
            { wrapper }
        );

        expect(mockRequest).not.toHaveBeenCalledWith(expect.stringContaining('/api/users'));
    });
});
