import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useLocation } from 'react-router-dom';
import { useApi } from '../../../shared/utils/api';
import { parseApiDate, formatApiDate, formatDisplayDate } from '../../../shared/utils/dateUtils';
import { startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { Space, Reservation } from '../../../shared/types';

// --- CONSTANTES Y TIPOS ---

/**
 * Interfaz que define la estructura de un evento adaptado para su visualización
 * en el componente del calendario (React Big Calendar).
 */
export interface CalendarEvent {
    /** Identificador único del evento. */
    id: number;
    /** Título descriptivo que se muestra en la interfaz del calendario. */
    title: string;
    /** Fecha y hora de inicio de la reserva. */
    start: Date;
    /** Fecha y hora de finalización de la reserva. */
    end: Date;
    /** Objeto original de la reserva subyacente que origina el evento. */
    resource: Reservation;
}

/** Constante que define todos los estados posibles de una reserva para propósitos de filtrado. */
export const ALL_STATUSES = ['APROBADA', 'SOLICITADA', 'BLOQUEO'] as const;

/** Constante que agrupa los tipos de actividad contemplados en el sistema. */
export const ALL_TYPES = ['CLASE', 'EXAMEN', 'OTRO'] as const;

// --- FUNCIONES AUXILIARES (Puras) ---

/**
 * Verifica si una reserva coincide con los filtros de espacio seleccionados.
 */
const matchesSpaceFilter = (res: Reservation, selectedIds: number[]) => {
    if (selectedIds.length === 0) return true;
    return res.spaces?.some(s => selectedIds.includes(s.id));
};

/**
 * Verifica si una reserva coincide con los tipos de reserva seleccionados.
 */
const matchesTypeFilter = (res: Reservation, selectedTypes: string[]) => {
    if (selectedTypes.length === 0) return true;
    return selectedTypes.includes(res.type || 'OTRO');
};

/**
 * Transforma una entidad de reserva del backend en un evento compatible con React Big Calendar.
 */
const mapToCalendarEvent = (res: Reservation): CalendarEvent => {
    const spaceCount = res.spaces?.length || 0;
    const spaceLabel = spaceCount > 1 
        ? `(${spaceCount}) Espacios` 
        : (res.spaces?.[0]?.name || 'Espacio desconocido');
    
    return {
        id: res.id,
        title: res.status === 'BLOQUEO' 
            ? `[${spaceLabel}] BLOQUEADO - ${res.description}` 
            : `${spaceLabel} - ${res.title || res.user.name}`,
        start: parseApiDate(res.startTime),
        end: parseApiDate(res.endTime),
        resource: res
    };
};

// --- HOOK PRINCIPAL ---

/**
 * Hook personalizado que orquesta la gestión integral de eventos y filtros en el calendario.
 * 
 * Sus principales responsabilidades son:
 * 1. Ejecutar y administrar las peticiones de datos (espacios y reservas) empleando TanStack Query.
 * 2. Mantener y gestionar el estado local correspondiente a los filtros aplicados (espacios, estados, tipos).
 * 3. Implementar una lógica de inicialización robusta que reconcilie los parámetros URL con los valores por defecto.
 * 4. Proveer métodos para la ejecución de acciones interactivas, tales como la actualización mediante Drag & Drop y aprobaciones.
 *
 * @param currentDate - La fecha de referencia actual para calcular el rango temporal de consulta de los eventos.
 * @param _currentView - La vista actual activa en el calendario (p. ej., mes, semana, día), utilizada en lógica extendida.
 * @returns Un objeto estructurado con los eventos filtrados, colecciones de espacios, el estado actual de los filtros y funciones controladoras para modificar dichos filtros e interactuar con el backend.
 */
export const useCalendarEvents = (currentDate: Date, _currentView: string) => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    const { showSnackbar } = useSnackbar();
    const location = useLocation();

    // Referencias para controlar el ciclo de vida de la inicialización y evitar bucles
    const isInitialized = useRef({ spaces: false, types: true });

    // -- ESTADOS DE FILTRADO LOCAL --
    const [selectedSpaceIds, setSelectedSpaceIds] = useState<number[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([...ALL_STATUSES]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([...ALL_TYPES]);
    const [syncingEventId, setSyncingEventId] = useState<number | null>(null);

    // Rango de consulta: Calculamos un margen de 3 meses para asegurar fluidez en navegación
    const queryRange = useMemo(() => ({
        start: formatApiDate(startOfMonth(subMonths(currentDate, 1))),
        end: formatApiDate(endOfMonth(addMonths(currentDate, 1)))
    }), [currentDate]);

    // -- QUERY: CARGA DE ESPACIOS (Catálogo base) --
    const { data: spaces = [] } = useQuery<Space[]>({
        queryKey: ['/api/spaces', { size: 1000 }],
        queryFn: () => request('/api/spaces?size=1000').then(d => d.content || d),
        staleTime: 5 * 60 * 1000
    });

    // -- QUERY: CARGA DE EVENTOS (Reservas) --
    const { data: rawEvents = [], isLoading: loading, error, refetch } = useQuery<CalendarEvent[]>({
        queryKey: ['/api/reservations', 'calendar', queryRange],
        queryFn: async () => {
            const params = new URLSearchParams({ 
                startDate: queryRange.start, 
                endDate: queryRange.end, 
                size: '2000' 
            });
            const data = await request(`/api/reservations?${params.toString()}`);
            const reservationsList: Reservation[] = Array.isArray(data) ? data : (data.content || []);
            
            return reservationsList.map(mapToCalendarEvent);
        },
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true
    });

    // -- EFECTOS DE SINCRONIZACIÓN E INICIALIZACIÓN --

    /**
     * Sincronización de Espacios: 
     * Prioriza IDs de la URL (notificaciones) o selecciona todos por defecto en la primera carga.
     */
    useEffect(() => {
        if (spaces.length > 0 && !isInitialized.current.spaces) {
            const spaceIdParam = new URLSearchParams(location.search).get('spaceId');
            
            if (spaceIdParam) {
                const idsFromUrl = spaceIdParam.split(',').map(Number).filter(id => !isNaN(id));
                if (idsFromUrl.length > 0) setSelectedSpaceIds(idsFromUrl);
            } else {
                setSelectedSpaceIds(spaces.map(s => s.id));
            }
            isInitialized.current.spaces = true;
        }
    }, [spaces, location.search]);

    // -- LÓGICA DE FILTRADO LOCAL --

    const filteredEvents = useMemo(() => {
        // Fallback permisivo: Mientras no tengamos datos base de espacios, mostramos todo para evitar parpadeos
        if (spaces.length === 0 || rawEvents.length === 0) return rawEvents;

        // Comprobación de intención: Si el usuario ha deseleccionado todo explícitamente (ya inicializado)
        const userClearedSpaces = selectedSpaceIds.length === 0 && isInitialized.current.spaces;

        if (userClearedSpaces) return [];

        return rawEvents.filter(evt => {
            const res = evt.resource;
            // 1. Filtrado por Estado (Checkboxes obligatorios)
            if (!selectedStatuses.includes(res.status)) return false;

            // 2. Filtrado por Espacios (Inyectado por función auxiliar)
            if (!matchesSpaceFilter(res, selectedSpaceIds)) return false;

            // 3. Filtrado por Tipos (Inyectado por función auxiliar)
            if (!matchesTypeFilter(res, selectedTypes)) return false;

            return true;
        });
    }, [rawEvents, selectedStatuses, selectedSpaceIds, selectedTypes, spaces]);

    // -- ACCIONES Y MUTACIONES --
    
    /**
     * Actualiza una reserva tras una interacción de Drag & Drop o redimensionamiento.
     */
    const handleUpdateEvent = async (id: number, start: Date, end: Date, originalEvent: CalendarEvent) => {
        const res = originalEvent.resource;
        setSyncingEventId(id);
        try {
            await request(`/api/reservations/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    spaceIds: res.spaces.map(s => s.id),
                    startTime: formatApiDate(start),
                    endTime: formatApiDate(end),
                    type: res.type,
                    title: res.title || res.user.name,
                    subjectId: res.subject?.id,
                    description: res.description,
                    responsibleName: res.responsibleName,
                    isBlock: res.status === 'BLOQUEO'
                })
            });
            
            // Invalidación proactiva de cachés relacionadas
            ['/api/reservations', '/api/stats', '/api/audit-logs'].forEach(key => 
                queryClient.invalidateQueries({ queryKey: [key] })
            );
            
            showSnackbar(`Reserva actualizada: ${formatDisplayDate(start, 'HH:mm')} - ${formatDisplayDate(end, 'HH:mm')}`);
        } catch (err) {
            // El error es gestionado por la utilidad api.ts
        } finally {
            setSyncingEventId(null);
        }
    };

    /**
     * Aprueba una reserva rápidamente desde la vista de calendario.
     */
    const handleApprove = async (resId: number) => {
        try {
            await request(`/api/reservations/${resId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'APROBADA' })
            });
            showSnackbar("Reserva aprobada correctamente.");
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            return true;
        } catch (err) {
            return false;
        }
    };

    // -- INTERFAZ PÚBLICA DEL HOOK --

    return {
        filteredEvents, 
        spaces, 
        selectedSpaceIds, 
        selectedStatuses, 
        selectedTypes, 
        allTypes: ALL_TYPES,
        // Handlers de UI con marcado proactivo de inicialización completada
        toggleSpace: (id: number) => {
            isInitialized.current.spaces = true;
            setSelectedSpaceIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
        },
        toggleAllSpaces: (ids: number[], select: boolean) => {
            isInitialized.current.spaces = true;
            setSelectedSpaceIds(select 
                ? Array.from(new Set([...selectedSpaceIds, ...ids])) 
                : selectedSpaceIds.filter(id => !ids.includes(id)));
        },
        toggleStatus: (status: string) => setSelectedStatuses(prev => 
            prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]),
        toggleAllStatuses: (select: boolean) => setSelectedStatuses(select ? [...ALL_STATUSES] : []),
        toggleType: (type: string) => {
            isInitialized.current.types = true;
            setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
        },
        toggleAllTypes: (select: boolean) => {
            isInitialized.current.types = true;
            setSelectedTypes(select ? [...ALL_TYPES] : []);
        },
        loading, 
        error: error ? (error as any).message : null, 
        syncingEventId, 
        handleUpdateEvent, 
        handleApprove, 
        fetchReservations: refetch
    };
};
