import { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { User, Role } from '../../../../shared/types';
import { useApi } from '../../../../shared/utils/api';
import { useResource } from '../../../../shared/hooks/useResource';

/**
 * Gancho de negocio especializado en la gestión integral de la entidad Usuario.
 * Construido sobre TanStack Query y useResource para proporcionar invalidación de caché automática,
 * sincronización de filtros con el almacenamiento local y métodos para la mutación del estado y recuperación de usuarios.
 *
 * @returns Objeto que encapsula el estado reactivo de los usuarios, metadatos de paginación, filtros activos,
 *          listado de roles disponibles, y métodos para interactuar con la API (actualizar estado, restaurar, etc.).
 */
export const useUsers = () => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const [roles, setRoles] = useState<Role[]>([]);

    const [includeDeleted, setIncludeDeleted] = useState<boolean>(() => {
        return localStorage.getItem('users_include_deleted') === 'true';
    });

    // Delegamos la carga al nuevo useResource (con TanStack Query interno)
    const resource = useResource<User>('/api/users', {
        initialSort: 'name',
        initialDirection: 'asc',
        initialFilters: { includeDeleted }
    });

    // Cargar roles (podríamos pasarlo a useQuery también, pero lo mantenemos simple por ahora)
    useEffect(() => {
        request('/api/roles').then(setRoles).catch(console.error);
    }, [request]);

    // Sincronizar localStorage y filtros
    useEffect(() => {
        localStorage.setItem('users_include_deleted', String(includeDeleted));
        resource.setFilters({ includeDeleted });
    }, [includeDeleted]);

    // -- MUTACIONES (ESENCIAL EN TANSTACK) --

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, name, email, roleId, force }: { id: number, status: string, name: string, email: string, roleId: number, force?: boolean }) => {
            return await request(`/api/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name, email, roleId, status, force })
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        }
    });

    const restoreMutation = useMutation({
        mutationFn: async (id: number) => {
            return await request(`/api/users/${id}/restore`, { method: 'POST' });
        },
        onSuccess: () => {
            // INVALIDACIÓN: Esto hace que todas las listas de usuarios se refresquen solas
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
        }
    });

    const updateUserStatus = async (user: User, newStatus: string, force?: boolean) => {
        await updateStatusMutation.mutateAsync({
            id: user.id,
            status: newStatus,
            name: user.name,
            email: user.email,
            roleId: user.role.id,
            force
        });
    };

    const restoreUser = async (id: number) => {
        await restoreMutation.mutateAsync(id);
    };

    const clearFilters = useCallback(() => {
        setIncludeDeleted(false);
        resource.setFilters({ name: '', roleId: '' });
    }, [resource]);

    return {
        // Estado del recurso (ahora reactivo y con caché)
        users: resource.data,
        loading: resource.loading,
        isFetching: resource.isFetching,
        error: resource.error,
        pagination: resource.pagination,
        filters: resource.filters,
        
        // Métodos delegados
        setPage: resource.setPage,
        setSize: resource.setSize,
        setSort: resource.setSort,
        setFilters: resource.setFilters,
        refresh: resource.refresh,
        
        // Específico de usuarios
        roles,
        includeDeleted,
        setIncludeDeleted,
        updateUserStatus,
        restoreUser,
        clearFilters
    };
};
