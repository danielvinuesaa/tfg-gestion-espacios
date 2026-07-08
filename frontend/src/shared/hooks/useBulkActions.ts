import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../utils/api';
import type { BulkConflictSummary } from '../types/bulk';

/**
 * Interfaz que define las opciones de inicialización y configuración para el hook `useBulkActions`.
 */
interface UseBulkActionsOptions {
    /** El nombre pluralizado del recurso manejado, utilizado para conformar los mensajes de retroalimentación. */
    resourceNamePlural: string;
    /** La ruta o endpoint del API base asociado a las operaciones de la entidad (ej: `/api/users`). */
    endpoint: string;
    /** Función callback requerida que se dispara al culminar exitosamente la operación masiva. */
    onSuccess: (message: string) => void;
    /** Función opcional que recupera los parámetros de búsqueda (filtros) aplicables en operaciones globales. */
    getFilters?: () => URLSearchParams;
}

/**
 * Hook personalizado de nivel profesional para el manejo integral de selecciones y acciones masivas (bulk).
 * Se encarga del estado de la selección, de las comprobaciones previas de conflictos, la ejecución
 * del borrado en lote y la subsecuente invalidación de la caché de TanStack Query para sincronizar el estado global.
 * 
 * @param options - Objeto de configuración con el endpoint y callbacks vinculados.
 * @returns Un objeto que agrupa el estado de la selección y funciones utilitarias para la interacción masiva.
 */
export const useBulkActions = ({
    resourceNamePlural,
    endpoint,
    onSuccess,
    getFilters
}: UseBulkActionsOptions) => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isGlobalSelection, setIsGlobalSelection] = useState(false);
    const [loadingBulk, setLoadingBulk] = useState(false);
    const [bulkConflictSummary, setBulkConflictSummary] = useState<BulkConflictSummary | null>(null);
    const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

    const handleSelectOne = useCallback((id: number) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
        setIsGlobalSelection(false);
    }, []);

    const handleSelectAll = useCallback((ids: number[]) => {
        setSelectedIds(ids);
        setIsGlobalSelection(false);
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
        setIsGlobalSelection(false);
        setBulkConflictSummary(null);
    }, []);

    const checkBulkConflicts = useCallback(async () => {
        setLoadingBulk(true);
        try {
            const params = isGlobalSelection && getFilters ? getFilters() : new URLSearchParams();
            if (!isGlobalSelection) {
                selectedIds.forEach(id => params.append('ids', id.toString()));
            }

            const summary = await request(`${endpoint}/bulk/conflicts?${params.toString()}`);
            setBulkConflictSummary(summary);
            setIsBulkDeleteDialogOpen(true);
        } catch (error) {
            console.error("Error checking bulk conflicts", error);
        } finally {
            setLoadingBulk(false);
        }
    }, [endpoint, getFilters, isGlobalSelection, request, selectedIds]);

    const handleBulkDelete = async (force: boolean = false, extraParams?: Record<string, string | number>) => {
        setLoadingBulk(true);
        try {
            const params = isGlobalSelection && getFilters ? getFilters() : new URLSearchParams();
            if (!isGlobalSelection) {
                selectedIds.forEach(id => params.append('ids', id.toString()));
            }
            if (force) params.append('force', 'true');
            
            if (extraParams) {
                Object.entries(extraParams).forEach(([key, value]) => {
                    params.append(key, String(value));
                });
            }

            const deleteUrl = endpoint.endsWith('/bulk') ? endpoint : `${endpoint}/bulk`;
            await request(`${deleteUrl}?${params.toString()}`, {
                method: 'DELETE'
            });

            // -- INVALIDACIÓN TRANSVERSAL GLOBAL --
            queryClient.invalidateQueries({ queryKey: [endpoint] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });

            onSuccess(`Se han eliminado los ${resourceNamePlural} correctamente.`);
            clearSelection();
            setIsBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error in bulk delete", error);
        } finally {
            setLoadingBulk(false);
        }
    };

    return {
        selectedIds,
        isGlobalSelection,
        loadingBulk,
        bulkConflictSummary,
        isBulkDeleteDialogOpen,
        handleSelectOne,
        handleSelectAll,
        clearSelection,
        setIsGlobalSelection,
        toggleBulkDeleteModal: (open: boolean) => {
            if (open) checkBulkConflicts();
            else setIsBulkDeleteDialogOpen(false);
        },
        handleBulkDelete
    };
};
