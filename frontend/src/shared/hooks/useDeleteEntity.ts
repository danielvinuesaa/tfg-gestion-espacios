import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApi } from '../utils/api';
import type { EntityConflictResponse } from '../../features/spaces/types/conflicts';

/**
 * Interfaz de opciones para configurar el hook `useDeleteEntity`.
 */
interface UseDeleteEntityOptions {
    /** La ruta de la API para consultar conflictos asociados (por ejemplo: `/api/users/{id}/conflicts`). */
    conflictsUrl: string | null;
    /** La ruta de la API empleada para ejecutar la eliminación definitiva (por ejemplo: `/api/users/{id}`). */
    deleteUrl: string | null;
    /** Indicador booleano que señala si el diálogo está abierto, activando la consulta de conflictos. */
    open: boolean;
    /** Función callback ejecutada tras un borrado exitoso. */
    onSuccess: (message: string) => void;
    /** El mensaje de éxito a emitir mediante el callback una vez culminado el proceso. */
    successMessage: string;
}

/**
 * Hook personalizado para encapsular y estandarizar la lógica de borrado de entidades individuales,
 * integrándose con TanStack Query. Administra de forma transparente los estados de carga, la consulta de
 * conflictos referenciales, el manejo de errores y la invalidación automática de cachés para sincronizar la vista.
 * 
 * @param options - Objeto de configuración con URLs y callbacks.
 * @returns Funciones y variables de estado para controlar la interacción de borrado.
 */
export const useDeleteEntity = ({
    conflictsUrl,
    deleteUrl,
    open,
    onSuccess,
    successMessage
}: UseDeleteEntityOptions) => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [checkingConflicts, setCheckingConflicts] = useState(false);
    const [rawConflicts, setRawConflicts] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const conflicts: EntityConflictResponse | null = useMemo(() => {
        if (rawConflicts === null || rawConflicts === undefined) return null;
        if (typeof rawConflicts === 'number') return { hasConflicts: rawConflicts > 0, conflictCount: rawConflicts, details: [] };
        if (Array.isArray(rawConflicts)) return { hasConflicts: rawConflicts.length > 0, conflictCount: rawConflicts.length, details: rawConflicts };
        return rawConflicts as EntityConflictResponse;
    }, [rawConflicts]);

    useEffect(() => {
        if (open && conflictsUrl) {
            setCheckingConflicts(true);
            setError(null);
            setRawConflicts(null);

            request(conflictsUrl)
                .then(data => setRawConflicts(data))
                .catch(err => setError(err instanceof Error ? err.message : "Error al obtener conflictos"))
                .finally(() => setCheckingConflicts(false));
        }
    }, [open, conflictsUrl, request]);

    const handleDelete = async (extraParams?: Record<string, string | number>) => {
        if (!deleteUrl) return;
        
        const hasConflicts = conflicts?.hasConflicts || false;
        const urlObj = new URL(deleteUrl, window.location.origin);
        if (hasConflicts) urlObj.searchParams.append('force', 'true');
        
        if (extraParams) {
            Object.entries(extraParams).forEach(([key, value]) => {
                urlObj.searchParams.append(key, String(value));
            });
        }

        setLoading(true);
        setError(null);

        try {
            await request(urlObj.pathname + urlObj.search, { method: 'DELETE' });

            // -- INVALIDACIÓN AUTOMÁTICA --
            // Extraemos la base de la URL (ej: /api/users/123 -> /api/users)
            const queryBase = deleteUrl.split('/').slice(0, -1).join('/');
            if (queryBase) {
                queryClient.invalidateQueries({ queryKey: [queryBase] });
            }

            // INVALIDACIÓN TRANSVERSAL: El Dashboard, Auditoría y Roles siempre deben actualizarse tras un borrado
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });

            onSuccess(successMessage);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        checkingConflicts,
        conflicts,
        error,
        handleDelete
    };
};
