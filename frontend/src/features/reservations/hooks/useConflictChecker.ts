import { useState, useEffect, useCallback, useRef } from 'react';
import { useApi } from '../../../shared/utils/api';
import { formatApiDate } from '../../../shared/utils/dateUtils';
import type { Reservation } from '../../../shared/types';

/**
 * Interfaz que representa un conflicto de reserva detectado.
 * Contiene información sobre el espacio, la reserva conflictiva y su estado.
 */
export interface ReservationConflict {
    spaceId: number;
    spaceName: string;
    reservationId: number;
    title: string;
    type: string;
    userName: string;
    startTime: string;
    endTime: string;
    status: string;
    onlySpace: boolean;
}

/**
 * Hook especializado en la detección proactiva de solapamientos de reservas.
 * Evita que el usuario intente reservar un espacio ya ocupado antes de enviar el formulario.
 * 
 * @param reservationId - ID de la reserva actual (opcional, utilizado para excluirla durante una edición).
 * @returns Objeto con el estado actual de los conflictos, indicadores de carga y funciones para gestionar la validación.
 */
export const useConflictChecker = (reservationId?: number) => {
    const { request } = useApi();
    const [conflicts, setConflicts] = useState<ReservationConflict[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    
    // Timer para el debounce
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Realiza la comprobación de conflictos contra la API.
     */
    const checkConflicts = useCallback(async (
        spaceIds: number[], 
        startTime: Date | null, 
        endTime: Date | null
    ) => {
        if (spaceIds.length === 0 || !startTime || !endTime) {
            setConflicts([]);
            return;
        }

        setIsChecking(true);
        try {
            const params = new URLSearchParams({
                spaceIds: spaceIds.join(','),
                startTime: formatApiDate(startTime),
                endTime: formatApiDate(endTime)
            });

            if (reservationId) {
                params.append('excludeId', reservationId.toString());
            }

            const data = await request(`/api/reservations/conflicts?${params.toString()}`);
            setConflicts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fallo al comprobar conflictos:", err);
            setConflicts([]);
        } finally {
            setIsChecking(false);
        }
    }, [request, reservationId]);

    /**
     * Limpia el estado de conflictos de forma inmediata.
     */
    const clearConflicts = useCallback(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        setConflicts([]);
        setIsChecking(false);
    }, []);

    /**
     * Wrapper con debounce para evitar llamadas excesivas a la API
     * mientras el usuario ajusta el selector de fechas.
     */
    const debouncedCheck = useCallback((
        spaceIds: number[], 
        startTime: Date | null, 
        endTime: Date | null
    ) => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Si los datos son insuficientes, limpiamos inmediatamente sin esperar al debounce
        if (spaceIds.length === 0 || !startTime || !endTime) {
            setConflicts([]);
            setIsChecking(false);
            return;
        }

        debounceTimer.current = setTimeout(() => {
            checkConflicts(spaceIds, startTime, endTime);
        }, 500); // 500ms de margen de calma
    }, [checkConflicts]);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return {
        conflicts,
        isChecking,
        checkConflicts: debouncedCheck,
        clearConflicts,
        hasConflicts: conflicts.length > 0
    };
};
