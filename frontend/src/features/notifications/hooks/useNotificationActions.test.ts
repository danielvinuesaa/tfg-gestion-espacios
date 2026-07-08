import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotificationActions } from './useNotificationActions';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { useApi } from '../../../shared/utils/api';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn()
}));
vi.mock('../../../context/NotificationContext', () => ({
    useNotifications: vi.fn()
}));
vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn(() => ({ user: { id: 1, role: { name: 'ADMIN' } }, hasPermission: vi.fn(() => true) }))
}));
vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el hook useNotificationActions.
 * Comprueba las acciones derivadas de interactuar con una notificación,
 * incluyendo el marcado como leída, la navegación y la carga de detalles.
 */
describe('useNotificationActions', () => {
    const mockNavigate = vi.fn();
    const mockMarkAsRead = vi.fn();
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
        (useNotifications as any).mockReturnValue({ markAsRead: mockMarkAsRead });
        (useApi as any).mockReturnValue({ request: mockRequest });
    });

    /**
     * Verifica que al hacer clic en una notificación que contiene una ruta de acción
     * (actionPath), ésta se marque como leída y se ejecute la navegación a dicha ruta.
     */
    it('debe marcar como leída y navegar por actionPath', async () => {
        const { result } = renderHook(() => useNotificationActions());
        const notification = { id: 1, read: false, actionPath: '/test' };

        await act(async () => {
            await result.current.handleNotificationClick(notification as any);
        });

        expect(mockMarkAsRead).toHaveBeenCalledWith(1);
        expect(mockNavigate).toHaveBeenCalledWith('/test');
    });

    /**
     * Verifica que si una notificación está vinculada a una reserva en estado RECHAZADA,
     * se solicite la información a la API y se invoque la función de mostrar detalles en pantalla.
     */
    it('debe mostrar detalles si la reserva está RECHAZADA', async () => {
        mockRequest.mockResolvedValue({ id: 10, status: 'RECHAZADA' });
        const { result } = renderHook(() => useNotificationActions());
        const notification = { id: 1, read: true, reservationId: 10 };
        const mockShowDetails = vi.fn();

        await act(async () => {
            await result.current.handleNotificationClick(notification as any, mockShowDetails);
        });

        expect(mockRequest).toHaveBeenCalledWith('/api/reservations/10');
        expect(mockShowDetails).toHaveBeenCalledWith({ id: 10, status: 'RECHAZADA' });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    /**
     * Verifica que, en ausencia de la función de mostrar detalles, si la reserva asociada
     * está en un estado final (ej. CANCELADA), la acción redirija a la página de notificaciones
     * con el ID correspondiente pasado como parámetro.
     */
    it('debe navegar a notificaciones con query param si no hay onShowDetails y está CANCELADA', async () => {
        mockRequest.mockResolvedValue({ id: 10, status: 'CANCELADA' });
        const { result } = renderHook(() => useNotificationActions());
        const notification = { id: 1, read: true, reservationId: 10 };

        await act(async () => {
            await result.current.handleNotificationClick(notification as any);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/notificaciones?openReservationId=10');
    });
});
