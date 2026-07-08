import { useState, useEffect, useCallback } from 'react';
import { useResource } from '../../../shared/hooks/useResource';
import { formatApiDate } from '../../../shared/utils/dateUtils';

/**
 * Hook personalizado para la gestión y consulta del historial de registros de auditoría.
 * Proporciona funcionalidades como el retraso de ejecución (debounce) en búsquedas,
 * filtrado por fechas y usuario, además de manejar la paginación de resultados.
 *
 * @returns Un objeto que contiene el estado actual (datos, carga, error), la configuración de filtros, y métodos de utilidad para la UI.
 */
export const useAuditLog = () => {
    const {
        data: logs, loading, error, pagination, filters, setPage, setFilters
    } = useResource<any>('/api/audit-logs', { 
        initialSize: 20, 
        initialSort: 'timestamp', 
        initialDirection: 'desc' 
    });

    // Estados locales para los inputs antes de aplicar el filtro (UI Sync)
    const [performedBy, setPerformedBy] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Debounce manual para la búsqueda por usuario
    useEffect(() => {
        const timer = setTimeout(() => {
            if (filters.performedBy !== performedBy) {
                setFilters({ performedBy });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [performedBy, setFilters, filters.performedBy]);

    /**
     * Aplica el rango de fechas actualizando los filtros del recurso.
     */
    const applyDateFilters = useCallback(() => {
        setFilters({
            startDate: startDate ? formatApiDate(startDate) : undefined,
            endDate: endDate ? (() => {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Asegurar fin del día
                return formatApiDate(end);
            })() : undefined
        });
    }, [startDate, endDate, setFilters]);

    /**
     * Restablece todos los criterios de filtrado a sus valores predeterminados.
     */
    const clearFilters = useCallback(() => {
        setPerformedBy('');
        setStartDate(null);
        setEndDate(null);
        setFilters({ performedBy: '', action: '', startDate: undefined, endDate: undefined });
    }, [setFilters]);

    const hasFilters = !!(filters.action || filters.performedBy || filters.startDate || filters.endDate);

    return {
        logs,
        loading,
        error,
        pagination,
        filters,
        setPage,
        setFilters,
        // UI Helpers
        performedBy, setPerformedBy,
        startDate, setStartDate,
        endDate, setEndDate,
        applyDateFilters,
        clearFilters,
        hasFilters
    };
};
