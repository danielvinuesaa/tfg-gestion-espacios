import { useState, useEffect, useCallback } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Space } from '../../../shared/types';
import { useResource } from '../../../shared/hooks/useResource';
import { useApi } from '../../../shared/utils/api';

/**
 * Hook de negocio para la gestión y listado de Espacios usando TanStack Query.
 * Integra la lógica de paginación, ordenación y filtrado proporcionada por `useResource`
 * y añade operaciones específicas del dominio de espacios, como la restauración.
 *
 * @returns Objeto que contiene la lista de espacios, el estado de carga, la información
 * de paginación y las funciones necesarias para interactuar con los filtros y la restauración.
 */
export const useSpaces = () => {
    const { request } = useApi();
    const queryClient = useQueryClient();

    const [includeDeleted, setIncludeDeleted] = useState<boolean>(() => {
        return localStorage.getItem('spaces_include_deleted') === 'true';
    });

    const resource = useResource<Space>('/api/spaces', {
        initialSort: 'name',
        initialDirection: 'asc',
        initialFilters: { includeDeleted }
    });

    useEffect(() => {
        localStorage.setItem('spaces_include_deleted', String(includeDeleted));
        resource.setFilters({ includeDeleted });
    }, [includeDeleted]);

    // Mutación para restauración con invalidación automática
    const restoreMutation = useMutation({
        mutationFn: async (id: number) => {
            return await request(`/api/spaces/${id}/restore`, { method: 'POST' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
        }
    });

    const restoreSpace = async (id: number) => {
        await restoreMutation.mutateAsync(id);
    };

    const clearFilters = useCallback(() => {
        setIncludeDeleted(false);
        resource.setFilters({
            name: '',
            type: '',
            status: '',
            minCapacity: '',
            minComputers: ''
        });
    }, [resource]);

    return {
        spaces: resource.data,
        loading: resource.loading,
        isFetching: resource.isFetching,
        error: resource.error,
        pagination: resource.pagination,
        filters: resource.filters,
        
        setPage: resource.setPage,
        setSize: resource.setSize,
        setSort: resource.setSort,
        setFilters: resource.setFilters,
        refresh: resource.refresh,
        
        includeDeleted,
        setIncludeDeleted,
        restoreSpace,
        clearFilters
    };
};
