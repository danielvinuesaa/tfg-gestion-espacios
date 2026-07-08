import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../utils/api';

/**
 * Interfaz que modela el estado interno del sistema de paginación y ordenamiento.
 */
export interface PaginationState {
    /** Índice numérico (basado en 0) de la página actual. */
    page: number;
    /** Cantidad máxima de registros mostrados por página. */
    size: number;
    /** Sumatoria total de elementos que cumplen con el criterio de búsqueda a través de todas las páginas. */
    totalElements: number;
    /** Cantidad total de páginas calculadas con base en el tamaño y el número de elementos. */
    totalPages: number;
    /** Clave o nombre del campo bajo el cual se rige el ordenamiento de los datos. */
    sortBy: string;
    /** Dirección del ordenamiento ('asc' para ascendente o 'desc' para descendente). */
    direction: 'asc' | 'desc';
}

/**
 * Opciones de inicialización opcionales para configurar el comportamiento primario del recurso.
 */
export interface ResourceOptions {
    /** La página inicial a cargar (por defecto 0). */
    initialPage?: number;
    /** La cantidad inicial de registros a cargar por página (por defecto 10). */
    initialSize?: number;
    /** La propiedad clave inicial de ordenamiento (por defecto 'id'). */
    initialSort?: string;
    /** La dirección inicial de ordenamiento (por defecto 'desc'). */
    initialDirection?: 'asc' | 'desc';
    /** Objeto opcional conteniendo los pares clave-valor iniciales para el filtrado. */
    initialFilters?: Record<string, any>;
}

/**
 * Hook universal de nivel profesional estructurado sobre TanStack Query para el consumo estandarizado de APIs REST.
 * Gestiona automáticamente el estado de red, la caché subyacente, los controles de paginación, el filtrado y el ordenamiento.
 * 
 * @typeParam T - El tipo representativo de la entidad de datos extraída.
 * @typeParam TFilters - El tipo representativo del modelo de filtros asociado (por defecto, un objeto genérico).
 * @param resourceUrl - La URL base (endpoint) desde la que se consumirán los datos (por ejemplo, `/api/users`).
 * @param options - Parámetros de configuración iniciales opcionales.
 * @returns Las funciones delegadas y los estados consolidados para alimentar componentes de vistas de datos.
 */
export function useResource<T, TFilters = Record<string, any>>(resourceUrl: string, options: ResourceOptions = {}) {
    const { request } = useApi();
    const queryClient = useQueryClient();
    
    // Estado de Paginación y Filtros (local al componente pero dispara queries)
    const [pagination, setPagination] = useState({
        page: options.initialPage || 0,
        size: options.initialSize || 10,
        sortBy: options.initialSort || 'id',
        direction: options.initialDirection || 'desc'
    });

    const [filters, setFilters] = useState<TFilters>((options.initialFilters as unknown as TFilters) || ({} as TFilters));

    // -- GENERACIÓN DE QUERY KEY ÚNICA --
    // Es vital para que la caché sepa qué datos servir según la página/filtros
    const queryKey = useMemo(() => [resourceUrl, pagination, filters], [resourceUrl, pagination, filters]);

    // -- DEFINICIÓN DE LA QUERY CON TANSTACK --
    const { 
        data, 
        isLoading, 
        isFetching,
        error, 
        refetch 
    } = useQuery({
        queryKey,
        queryFn: async ({ signal }) => {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                size: pagination.size.toString(),
                sort: `${pagination.sortBy},${pagination.direction}`
            });

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        value.forEach(v => params.append(key, String(v)));
                    } else {
                        params.append(key, String(value));
                    }
                }
            });

            const result = await request(`${resourceUrl}?${params.toString()}`, { signal });
            return result;
        },
        // Mantiene los datos antiguos mientras carga los nuevos (evita parpadeos)
        placeholderData: (previousData) => previousData,
    });

    // -- ACCIONES DE CONTROL --
    const setPage = useCallback((newPage: number) => 
        setPagination(prev => ({ ...prev, page: newPage })), []);

    const setSize = useCallback((newSize: number) => 
        setPagination(prev => ({ ...prev, size: newSize, page: 0 })), []);

    const setSort = useCallback((field: string) => {
        setPagination(prev => ({
            ...prev,
            sortBy: field,
            direction: prev.sortBy === field && prev.direction === 'asc' ? 'desc' : 'asc',
            page: 0
        }));
    }, []);

    const updateFilters = useCallback((newFilters: Partial<TFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 0 }));
    }, []);

    const refresh = useCallback(() => refetch(), [refetch]);

    // Metadata de paginación extraída de la respuesta de Spring
    const paginationMeta: PaginationState = useMemo(() => ({
        ...pagination,
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 0
    }), [data, pagination]);

    return { 
        data: data?.content || [], 
        loading: isLoading, 
        isFetching,
        error: error ? (error as any).message : null, 
        pagination: paginationMeta, 
        filters, 
        setPage, 
        setSize, 
        setSort, 
        setFilters: updateFilters, 
        refresh 
    };
}
