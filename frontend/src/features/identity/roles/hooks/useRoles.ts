import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Role } from '../../../../shared/types';
import { useApi } from '../../../../shared/utils/api';

/**
 * Hook de negocio para la gestión y consulta del listado de roles.
 * Centraliza la carga de datos con TanStack Query, el filtrado local para 
 * mayor eficiencia en la interfaz y la sincronización del estado mediante mutaciones.
 * 
 * @returns Objeto que contiene los roles, el estado de carga y funciones de control.
 */
export const useRoles = () => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    
    // -- Búsqueda con Debounce (Consistencia UX) --
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // -- Persistencia de Eliminados --
    const [includeDeleted, setIncludeDeleted] = useState<boolean>(() => {
        return localStorage.getItem('roles_include_deleted') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('roles_include_deleted', String(includeDeleted));
    }, [includeDeleted]);

    // -- Estados de Ordenación Backend --
    const [sortBy, setSortBy] = useState<string>('name');
    const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

    // -- QUERY (LECTURA) --
    const { 
        data: roles = [], 
        isLoading: loading, 
        isFetching,
        error, 
        refetch 
    } = useQuery<Role[]>({
        queryKey: ['/api/roles', sortBy, direction, includeDeleted],
        queryFn: async () => {
            const params = new URLSearchParams({
                sortBy,
                direction,
                includeDeleted: String(includeDeleted)
            });
            return await request(`/api/roles?${params.toString()}`);
        },
        placeholderData: (previousData) => previousData,
    });

    // -- FILTRADO LOCAL (Eficiencia) --
    const filteredRoles = useMemo(() => {
        const query = debouncedQuery.toLowerCase().trim();
        if (!query) return roles;
        
        return roles.filter(role => 
            role.name.toLowerCase().includes(query) || 
            role.description?.toLowerCase().includes(query)
        );
    }, [roles, debouncedQuery]);

    const handleSort = useCallback((field: string) => {
        setSortBy(prevSortBy => {
            const isAsc = prevSortBy === field && direction === 'asc';
            setDirection(isAsc ? 'desc' : 'asc');
            return field;
        });
    }, [direction]);

    // -- MUTACIÓN (ESCRITURA) --
    const restoreMutation = useMutation({
        mutationFn: async (id: number) => {
            // Alineamos con el endpoint real del backend: /activate
            return await request(`/api/roles/${id}/activate`, { method: 'POST' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
        }
    });

    const restoreRole = async (id: number) => {
        await restoreMutation.mutateAsync(id);
    };

    return {
        roles: filteredRoles,
        allRoles: roles, // Lista completa sin filtro de búsqueda
        loading,
        isFetching,
        error: error ? (error as any).message : null,
        sortBy,
        direction,
        searchQuery,
        setSearchQuery,
        includeDeleted,
        setIncludeDeleted,
        handleSort,
        restoreRole,
        refresh: refetch
    };
};
