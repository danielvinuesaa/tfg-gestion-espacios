import { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { useApi } from '../shared/utils/api';
import type { Notification } from '../features/notifications/types/notification';

/**
 * Interfaz que define el contrato del contexto de notificaciones.
 */
interface NotificationContextType {
    /** Lista actual de notificaciones. */
    notifications: Notification[];
    /** Número de notificaciones no leídas. */
    unreadCount: number;
    /** Indica si las notificaciones se están cargando. */
    loading: boolean;
    /** Mensaje de error, si lo hubiese. */
    error: string | null;
    /** Número total de páginas disponibles. */
    totalPages: number;
    /** Cantidad total de elementos. */
    totalElements: number;
    /** Función para obtener notificaciones paginadas. */
    fetchNotifications: (page?: number, size?: number) => Promise<any>;
    /** Función para refrescar el conteo de notificaciones no leídas. */
    fetchUnreadCount: () => Promise<any>;
    /** Marca una notificación específica como leída. */
    markAsRead: (id: number) => Promise<void>;
    /** Marca todas las notificaciones del usuario como leídas. */
    markAllAsRead: () => Promise<void>;
    /** Elimina una notificación específica. */
    deleteNotification: (id: number) => Promise<void>;
    /** Elimina todas las notificaciones del usuario. */
    clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Proveedor Global de Notificaciones basado en TanStack Query.
 * Corregido para sincronización en tiempo real de lista y contador.
 */
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { request } = useApi();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // -- QUERY: CONTADOR DE NO LEÍDAS (Polling activo) --
    const unreadQuery = useQuery({
        queryKey: ['/api/notifications/unread-count'],
        queryFn: () => request('/api/notifications/unread-count'),
        enabled: isAuthenticated,
        refetchInterval: 30000, // Cada 30s
        staleTime: 5000,
    });

    // -- QUERY: LISTA DE NOTIFICACIONES RECIENTES (Polling activo) --
    const notificationsQuery = useQuery({
        queryKey: ['/api/notifications', { page: 0, size: 10 }],
        queryFn: () => request('/api/notifications?page=0&size=10&sort=createdAt,desc'),
        enabled: isAuthenticated,
        refetchInterval: 30000, // Sincronizado con el contador
        staleTime: 5000,
    });

    // -- MUTACIONES CON INVALIDACIÓN AGRESIVA --

    const markReadMutation = useMutation({
        mutationFn: (id: number) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => request('/api/notifications/mark-all-read', { method: 'PUT' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => request(`/api/notifications/${id}`, { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        }
    });

    const clearAllMutation = useMutation({
        mutationFn: () => request('/api/notifications/clear-all', { method: 'DELETE' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
        }
    });

    // -- MÉTODOS PÚBLICOS --

    const markAsRead = async (id: number) => {
        await markReadMutation.mutateAsync(id);
    };

    const markAllAsRead = async () => {
        await markAllReadMutation.mutateAsync();
    };

    const deleteNotification = async (id: number) => {
        await deleteMutation.mutateAsync(id);
    };

    const clearAllNotifications = async () => {
        await clearAllMutation.mutateAsync();
    };

    const fetchNotifications = useCallback(async (page = 0, size = 10) => {
        return queryClient.fetchQuery({
            queryKey: ['/api/notifications', { page, size }],
            queryFn: () => request(`/api/notifications?page=${page}&size=${size}&sort=createdAt,desc`)
        });
    }, [queryClient, request]);

    const fetchUnreadCount = useCallback(async () => {
        return queryClient.fetchQuery({
            queryKey: ['/api/notifications/unread-count'],
            queryFn: () => request('/api/notifications/unread-count')
        });
    }, [queryClient, request]);

    return (
        <NotificationContext.Provider value={{ 
            notifications: notificationsQuery.data?.content || [],
            unreadCount: unreadQuery.data?.count || 0,
            loading: notificationsQuery.isLoading,
            error: notificationsQuery.error ? (notificationsQuery.error as any).message : null,
            totalPages: notificationsQuery.data?.totalPages || 0,
            totalElements: notificationsQuery.data?.totalElements || 0,
            fetchNotifications, 
            fetchUnreadCount, 
            markAsRead, 
            markAllAsRead, 
            deleteNotification, 
            clearAllNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

/**
 * Hook personalizado para acceder de forma sencilla al contexto de notificaciones.
 * 
 * @returns El contexto de notificaciones.
 * @throws Error si se utiliza fuera de un NotificationProvider.
 */
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
