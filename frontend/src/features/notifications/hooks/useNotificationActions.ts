import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { useApi } from '../../../shared/utils/api';
import type { Notification } from '../../../shared/types';

/**
 * Gancho personalizado para gestionar el comportamiento al interactuar con una notificación.
 * Incluye la lógica de navegación dinámica y apertura de diálogos de detalles según el estado de la reserva
 * y los permisos del usuario.
 *
 * @returns Objeto con la función `handleNotificationClick` para procesar el evento de selección.
 */
export const useNotificationActions = () => {
    const navigate = useNavigate();
    const { request } = useApi();
    const { markAsRead } = useNotifications();
    const { hasPermission } = useAuth();

    const handleNotificationClick = async (
        notification: Notification, 
        onShowDetails?: (reservation: any) => void,
        setLoading?: (loading: boolean) => void
    ) => {
        // 1. Marcar como leída si no lo está
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // 2. Si tiene reservationId, comprobamos estado para ver si abrimos diálogo o navegamos
        if (notification.reservationId) {
            if (setLoading) setLoading(true);
            try {
                const data = await request(`/api/reservations/${notification.reservationId}`);
                
                const canViewCalendar = hasPermission('VER_TODAS_RESERVAS');

                // Si está RECHAZADA o CANCELADA, o si NO tiene permiso para ver el calendario,
                // mostramos detalles directamente (no están en el calendario por defecto o no puede entrar)
                if (data.status === 'RECHAZADA' || data.status === 'CANCELADA' || !canViewCalendar) {
                    if (onShowDetails) {
                        onShowDetails(data);
                    } else {
                        navigate(`/notificaciones?openReservationId=${notification.reservationId}`);
                    }
                    if (setLoading) setLoading(false);
                    return;
                }

                // Si está en otro estado, aprovechamos la fecha de la reserva para navegar al calendario exacto
                if (notification.actionPath && notification.actionPath.startsWith('/calendar') && data.startTime) {
                    const dateStr = typeof data.startTime === 'string' ? data.startTime.split('T')[0] : '';
                    if (dateStr) {
                        const separator = notification.actionPath.includes('?') ? '&' : '?';
                        navigate(`${notification.actionPath}${separator}date=${dateStr}`);
                        if (setLoading) setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error("Error al procesar acción de notificación:", err);
            } finally {
                if (setLoading) setLoading(false);
            }
        }

        // 3. Fallback: Navegación estándar por actionPath
        if (notification.actionPath) {
            navigate(notification.actionPath);
        }
    };

    return { handleNotificationClick };
};