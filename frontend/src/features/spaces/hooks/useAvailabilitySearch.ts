import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { useSettings } from '../../../context/SettingsContext';
import { formatApiDate, parseApiDate } from '../../../shared/utils/dateUtils';
import { format as dfFormat } from 'date-fns';
import type { Space } from '../../../shared/types';
import type { ReservationSlot } from '../../reservations/hooks/useReservationForm';

/** Representa una propuesta de reserva generada por el buscador inteligente. */
export interface ReservationProposal {
    /** Lista de espacios que componen la propuesta (puede ser uno o combinación de varios). */
    spaces: Space[];
    /** Capacidad física total sumada de los espacios. */
    totalCapacity: number;
    /** Capacidad efectiva calculada tras aplicar el ratio de distribución. */
    effectiveCapacity: number;
    /** Cantidad de plazas libres o excedentes en función de lo solicitado. */
    overCapacity: number;
    /** Puntuación heurística que mide la eficiencia de uso del espacio. */
    efficiencyScore: number;
    /** Texto descriptivo que justifica la recomendación de esta propuesta. */
    recommendationReason: string;
    /** Fecha y hora de inicio sugerida (usado en búsquedas flexibles). */
    suggestedStartTime?: string;
    /** Fecha y hora de fin sugerida (usado en búsquedas flexibles). */
    suggestedEndTime?: string;
}

/** Representa los resultados agrupados por una franja horaria específica (modo flexible). */
export interface TimeSlotResults {
    /** Hora de inicio de la franja. */
    startTime: string;
    /** Hora de fin de la franja. */
    endTime: string;
    /** Etiqueta descriptiva para mostrar al usuario. */
    label: string;
    /** Lista de propuestas encontradas para esta franja. */
    proposals: ReservationProposal[];
    /** Número total de propuestas en la franja. */
    count: number;
}

/** Representa los resultados agrupados por un día específico (modo flexible). */
export interface DailyResults {
    /** Fecha correspondiente a los resultados. */
    date: string;
    /** Franjas horarias evaluadas durante el día. */
    timeSlots: TimeSlotResults[];
    /** Número total de propuestas generadas a lo largo de todo el día. */
    totalCount: number;
}

/**
 * Hook personalizado que centraliza la lógica del motor de búsqueda de disponibilidad.
 * Emplea TanStack Query para gestionar las peticiones y caché, y maneja de manera
 * unificada los estados del formulario, la selección de propuestas y la navegación.
 *
 * @returns Objeto con todos los estados, resultados y funciones de control necesarias para la vista.
 */
export const useAvailabilitySearch = () => {
    const { request } = useApi();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { timeSettings } = useSettings();

    const initialFilters = useMemo(() => ({
        startTime: null as Date | null,
        endTime: null as Date | null,
        flexible: false,
        rangeStart: null as Date | null,
        rangeEnd: null as Date | null,
        dailyStart: null as Date | null,
        dailyEnd: null as Date | null,
        durationHours: 1,
        includeWeekends: false,
        minCapacity: '',
        distributionRatio: 1.0,
        types: [] as string[]
    }), []);

    const [filters, setFilters] = useState(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState(initialFilters);
    const [searched, setSearched] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Determina si los resultados mostrados coinciden con los filtros actuales de la UI
    const isStale = useMemo(() => {
        if (!searched) return false;
        return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
    }, [filters, appliedFilters, searched]);

    // Estados de navegación dentro de los resultados
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
    const [selectedProposalIdx, setSelectedProposalIdx] = useState<number>(0);
    const [reservationFormOpen, setReservationFormOpen] = useState(false);
    const [reservationSlot, setReservationSlot] = useState<ReservationSlot | null>(null);

    // -- QUERY DE BÚSQUEDA INTEGRADA --
    const { data: searchData, isLoading, error: queryError, refetch } = useQuery({
        queryKey: ['/api/spaces/search-available', appliedFilters],
        queryFn: async () => {
            const body = appliedFilters.flexible ? {
                flexible: true,
                rangeStart: dfFormat(appliedFilters.rangeStart!, "yyyy-MM-dd"),
                rangeEnd: dfFormat(appliedFilters.rangeEnd!, "yyyy-MM-dd"),
                dailyStart: dfFormat(appliedFilters.dailyStart!, "HH:mm:ss"),
                dailyEnd: dfFormat(appliedFilters.dailyEnd!, "HH:mm:ss"),
                durationHours: appliedFilters.durationHours,
                includeWeekends: appliedFilters.includeWeekends,
                minCapacity: appliedFilters.minCapacity ? parseInt(appliedFilters.minCapacity) : null,
                distributionRatio: appliedFilters.distributionRatio,
                types: appliedFilters.types.length > 0 ? appliedFilters.types : null
            } : {
                flexible: false,
                startTime: formatApiDate(appliedFilters.startTime!),
                endTime: formatApiDate(appliedFilters.endTime!),
                minCapacity: appliedFilters.minCapacity ? parseInt(appliedFilters.minCapacity) : null,
                distributionRatio: appliedFilters.distributionRatio,
                types: appliedFilters.types.length > 0 ? appliedFilters.types : null
            };

            return request('/api/spaces/search-available', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        },
        enabled: searched, // Solo se activa cuando el usuario ha pulsado al menos una vez
        staleTime: Infinity, // Controlamos el refresco manualmente
    });

    // -- PROCESAMIENTO DE RESULTADOS --
    
    const proposals = useMemo(() => (!appliedFilters.flexible ? (searchData as ReservationProposal[] || []) : []), [appliedFilters.flexible, searchData]);
    const dailyResults = useMemo(() => (appliedFilters.flexible ? (searchData as DailyResults[] || []) : []), [appliedFilters.flexible, searchData]);

    const isOnlyWeekendsSelected = useMemo(() => {
        if (!filters.flexible || filters.includeWeekends || !filters.rangeStart || !filters.rangeEnd) return false;
        let current = new Date(filters.rangeStart);
        const end = new Date(filters.rangeEnd);
        while (current <= end) {
            const day = current.getDay();
            if (day !== 0 && day !== 6) return false;
            current.setDate(current.getDate() + 1);
        }
        return true;
    }, [filters.flexible, filters.includeWeekends, filters.rangeStart, filters.rangeEnd]);

    const selectedDayData = useMemo(() => 
        dailyResults.find(d => d.date === selectedDate),
    [dailyResults, selectedDate]);

    const activeProposals = useMemo(() => {
        if (!appliedFilters.flexible) return proposals;
        if (!selectedDayData || selectedSlotIdx === null) return [];
        return selectedDayData.timeSlots[selectedSlotIdx]?.proposals || [];
    }, [appliedFilters.flexible, proposals, selectedDayData, selectedSlotIdx]);

    // -- ACCIONES --

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLocalError(null);
        
        if (!filters.flexible) {
            if (!filters.startTime || !filters.endTime) return setLocalError("Seleccione un rango horario.");
            if (isNaN(filters.startTime.getTime()) || isNaN(filters.endTime.getTime())) return setLocalError("Fecha o hora inválida.");
            if (filters.endTime <= filters.startTime) return setLocalError("Rango horario inválido.");
            if (filters.startTime < new Date()) return setLocalError("No se pueden buscar disponibilidades en fechas pasadas.");
        } else {
            if (!filters.rangeStart || !filters.rangeEnd || !filters.dailyStart || !filters.dailyEnd) return setLocalError("Complete todos los campos.");
            if (isNaN(filters.rangeStart.getTime()) || isNaN(filters.rangeEnd.getTime())) return setLocalError("Rango de fechas inválido.");
            if (filters.rangeEnd < filters.rangeStart) return setLocalError("Rango de fechas inválido (fin antes del inicio).");
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const rangeStart = new Date(filters.rangeStart);
            rangeStart.setHours(0, 0, 0, 0);
            if (rangeStart < today) return setLocalError("No se pueden buscar disponibilidades en fechas pasadas.");
            
            if (filters.dailyEnd <= filters.dailyStart) return setLocalError("Franja diaria inválida.");
        }

        // Al pulsar el botón, sincronizamos los filtros de UI con los aplicados
        setAppliedFilters(filters);
        setSearched(true);
        setSelectedProposalIdx(0);
        
        // Esperamos al siguiente tick para que TanStack Query vea el cambio de appliedFilters en la key
        setTimeout(async () => {
            const result = await refetch();
            
            // Autoselección de primer resultado en modo flexible
            if (filters.flexible && result.data) {
                const results = result.data as DailyResults[];
                const firstDayWithData = results.find(d => d.totalCount > 0);
                if (firstDayWithData) {
                    setSelectedDate(firstDayWithData.date);
                    setSelectedSlotIdx(0);
                    setSelectedProposalIdx(0);
                } else if (results.length > 0) {
                    setSelectedDate(results[0].date);
                    setSelectedSlotIdx(null);
                    setSelectedProposalIdx(0);
                }
            }
        }, 0);
    }, [filters, refetch]);

    const clearFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setSearched(false);
        setLocalError(null);
        setSelectedDate(null);
        setSelectedSlotIdx(null);
        setSelectedProposalIdx(0);
        queryClient.removeQueries({ queryKey: ['/api/spaces/search-available'] });
    }, [initialFilters, queryClient]);

    const navigateToReservation = useCallback((proposal: ReservationProposal) => {
        const startStr = proposal.suggestedStartTime 
            ? proposal.suggestedStartTime 
            : (appliedFilters.startTime ? formatApiDate(appliedFilters.startTime) : null);
            
        const endStr = proposal.suggestedEndTime 
            ? proposal.suggestedEndTime 
            : (appliedFilters.endTime ? formatApiDate(appliedFilters.endTime) : null);

        if (startStr && endStr) {
            setReservationSlot({
                start: parseApiDate(startStr),
                end: parseApiDate(endStr),
                spaceIds: proposal.spaces.map(s => s.id)
            });
            setReservationFormOpen(true);
        }
    }, [appliedFilters.startTime, appliedFilters.endTime]);

    const handleCloseReservationForm = useCallback(() => {
        setReservationFormOpen(false);
        setReservationSlot(null);
    }, []);

    return {
        filters, setFilters,
        appliedFilters,
        loading: isLoading, 
        searched, 
        isStale,
        error: localError || (queryError ? (queryError as any).message : null),
        dailyResults, selectedDate, setSelectedDate,
        selectedSlotIdx, setSelectedSlotIdx,
        selectedProposalIdx, setSelectedProposalIdx,
        activeProposals, selectedDayData,
        isOnlyWeekendsSelected,
        handleSearch, clearFilters, navigateToReservation,
        reservationFormOpen, reservationSlot, handleCloseReservationForm
    };
};
