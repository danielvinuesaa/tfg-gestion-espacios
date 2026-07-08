import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Reservation, Space, User, Subject } from '../../../shared/types';
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useApi } from '../../../shared/utils/api';
import { useResource } from '../../../shared/hooks/useResource';
import { formatApiDate } from '../../../shared/utils/dateUtils';

/**
 * Interfaz que define los criterios de filtrado disponibles para la búsqueda de reservas.
 */
export interface ReservationFilters {
    status: string;
    type: string;
    spaceId?: string[];
    userId?: string[];
    subjectId?: string[];
    startDate: string | null;
    endDate: string | null;
    search: string;
    scope: string;
    includeCancelled: boolean;
}

/**
 * Hook de negocio principal para la gestión y consulta de reservas.
 * Orquesta la recuperación paginada de reservas, el manejo de filtros avanzados
 * y la carga de catálogos necesarios mediante TanStack Query.
 * 
 * @returns Un objeto que contiene las reservas, metadatos de paginación, filtros activos, y funciones para mutar su estado.
 */
export const useReservations = () => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const { hasPermission, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const { showSnackbar } = useSnackbar();

    // -- QUERIES DE CATÁLOGOS (CACHÉ COMPARTIDA) --
    
    const { data: allSpaces = [] } = useQuery<Space[]>({
        queryKey: ['/api/spaces', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/spaces?size=1000');
            return data.content || data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos de validez para catálogos estáticos
    });

    const { data: allSubjects = [] } = useQuery<Subject[]>({
        queryKey: ['/api/subjects', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/subjects?size=1000');
            return data.content || data;
        },
        staleTime: 5 * 60 * 1000,
    });

    const canViewUsers = isAdmin || 
                         hasPermission('GESTIONAR_USUARIOS') || 
                         hasPermission('GESTIONAR_ROLES') || 
                         hasPermission('VER_TODAS_RESERVAS') || 
                         hasPermission('APROBAR_RESERVA') || 
                         hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') || 
                         hasPermission('CANCELAR_RESERVA');

    const { data: allUsers = [] } = useQuery<User[]>({
        queryKey: ['/api/users', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/users?size=1000');
            return data.content || data;
        },
        enabled: canViewUsers,
        staleTime: 5 * 60 * 1000,
    });

    // -- RECURSO PRINCIPAL (RESERVAS) --
    const savedIncludeCancelled = localStorage.getItem('reservations_include_cancelled') === 'true';
    
    const resource = useResource<Reservation, ReservationFilters>('/api/reservations', {
        initialSort: 'startTime',
        initialDirection: 'asc',
        initialFilters: { 
            scope: 'managed',
            status: '',
            type: '',
            spaceId: [],
            userId: [],
            subjectId: [],
            startDate: null,
            endDate: null,
            search: '',
            includeCancelled: savedIncludeCancelled
        }
    });

    useEffect(() => {
        localStorage.setItem('reservations_include_cancelled', String(resource.filters.includeCancelled || false));
    }, [resource.filters.includeCancelled]);

    /**
     * Actualiza el estado de una reserva (Aprobar/Rechazar/Cancelar).
     * Invalida automáticamente la caché para reflejar cambios.
     */
    const updateStatus = useCallback(async (id: number, status: string) => {
        try {
            await request(`/api/reservations/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            showSnackbar(`Reserva ${status.toLowerCase()} correctamente.`);
            
            // INVALIDACIÓN TRANSVERSAL COMPLETA
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            
            return true;
        } catch (err) {
            return false;
        }
    }, [request, queryClient, showSnackbar]);

    const clearFilters = useCallback(() => {
        resource.setFilters({
            status: '',
            type: '',
            spaceId: [],
            userId: [],
            subjectId: [],
            startDate: null,
            endDate: null,
            search: '',
            scope: 'managed',
            includeCancelled: localStorage.getItem('reservations_include_cancelled') === 'true' // Mantiene la preferencia de usuario en reset
        });
    }, [resource]);

    return {
        // Estado del Recurso
        reservations: resource.data,
        loading: resource.loading,
        isFetching: resource.isFetching, // Añadimos indicador de actualización en background
        error: resource.error,
        pagination: resource.pagination,
        filters: resource.filters,
        
        // Catálogos
        allSpaces,
        allUsers,
        allSubjects,

        // Métodos de Control
        setPage: resource.setPage,
        setSize: resource.setSize,
        setSort: resource.setSort,
        setFilters: resource.setFilters,
        refresh: resource.refresh,
        clearFilters,
        updateStatus
    };
};
