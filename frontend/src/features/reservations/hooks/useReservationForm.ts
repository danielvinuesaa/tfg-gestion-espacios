import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Reservation, Space, User, Subject, ReservationType } from '../../../shared/types';
import { useApi } from '../../../shared/utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { parseApiDate, formatApiDate } from '../../../shared/utils/dateUtils';
import { reservationValidation } from '../utils/reservationValidation';
import { useConflictChecker } from './useConflictChecker';

/**
 * Estructura de datos que representa los campos del formulario de reserva.
 */
export interface ReservationFormData {
    spaceIds: number[];
    startTime: Date | null;
    endTime: Date | null;
    title: string;
    type: ReservationType | '';
    subjectId: number | null;
    description: string;
    responsibleId: number | null;
    responsibleName: string;
    isBlock: boolean;
}

/**
 * Representa un hueco temporal inicial seleccionado para una nueva reserva.
 */
export interface ReservationSlot {
    start: Date;
    end: Date;
    spaceIds?: number[];
    spaceId?: number | ''; // Compatibilidad legacy
}

/**
 * Hook maestro para la gestión integral del formulario de reservas, basado en TanStack Query.
 * Maneja la validación, la carga de datos auxiliares (espacios, usuarios, asignaturas) y
 * la interacción con el motor de detección de conflictos.
 * 
 * @param initialData - Datos iniciales de la reserva, presentes si es una edición.
 * @param initialSlot - Hueco temporal preseleccionado desde el calendario.
 * @param open - Estado de visibilidad del formulario.
 * @param handleClose - Función para cerrar el formulario.
 * @param onSuccess - Función callback que se ejecuta tras guardar correctamente.
 * @returns Objeto con los datos del formulario, funciones de manejo y estado global del proceso.
 */
export const useReservationForm = (
    initialData: Reservation | null | undefined, 
    initialSlot: ReservationSlot | null | undefined,
    open: boolean, 
    handleClose: () => void, 
    onSuccess: (msg: string) => void
) => {
    const { request } = useApi();
    const { hasPermission, user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const queryClient = useQueryClient();
    const location = useLocation();
    const isEdit = useMemo(() => !!initialData?.id, [initialData]);
    
    // Motor de conflictos proactivo
    const conflictEngine = useConflictChecker(initialData?.id);
    const [showResponsible, setShowResponsible] = useState(false);

    // -- QUERIES DE CATÁLOGOS (Reutilizando caché global) --
    
    const { data: spaces = [] } = useQuery<Space[]>({
        queryKey: ['/api/spaces', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/spaces?size=1000');
            return data.content || data;
        },
        enabled: open,
        staleTime: 5 * 60 * 1000
    });

    const canViewUsers = isAdmin || 
                         hasPermission('GESTIONAR_USUARIOS') || 
                         hasPermission('GESTIONAR_ROLES') || 
                         hasPermission('VER_TODAS_RESERVAS') || 
                         hasPermission('APROBAR_RESERVA') || 
                         hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') || 
                         hasPermission('CANCELAR_RESERVA');

    const { data: users = [] } = useQuery<User[]>({
        queryKey: ['/api/users', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/users?size=1000');
            return data.content || data;
        },
        enabled: open && canViewUsers,
        staleTime: 5 * 60 * 1000
    });

    const { data: subjects = [] } = useQuery<Subject[]>({
        queryKey: ['/api/subjects', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/subjects?size=1000');
            return data.content || data;
        },
        enabled: open,
        staleTime: 5 * 60 * 1000
    });

    /**
     * Detección de origen.
     */
    const isFromSearch = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('openForm') === 'true' || (initialSlot && !!initialSlot.spaceIds && initialSlot.spaceIds.length > 0);
    }, [location.search, initialSlot]);

    const defaultValues: ReservationFormData = useMemo(() => ({
        spaceIds: [],
        startTime: null,
        endTime: null,
        title: '',
        type: '', 
        subjectId: null,
        description: '',
        responsibleId: null,
        responsibleName: '',
        isBlock: false
    }), []);

    /**
     * Lógica principal de envío y validación mediante useBaseForm.
     */
    const form = useBaseForm<ReservationFormData>({
        initialValues: defaultValues,
        onSubmit: async (values) => {
            // Validaciones
            const timeVal = reservationValidation.validateTemporalRange(values, isEdit);
            if (!timeVal.isValid) throw new Error(timeVal.error);
            const resVal = reservationValidation.validateResources(values.spaceIds);
            if (!resVal.isValid) throw new Error(resVal.error);
            const metaVal = reservationValidation.validateMetadata(values);
            if (!metaVal.isValid) throw new Error(metaVal.error);

            if (conflictEngine.hasConflicts && !values.isBlock) {
                throw new Error("No se puede guardar: existen conflictos de horario detectados.");
            }

            const url = isEdit ? `/api/reservations/${initialData!.id}` : '/api/reservations';
            const method = isEdit ? 'PUT' : 'POST';

            const payload = {
                ...values,
                startTime: formatApiDate(values.startTime!),
                endTime: formatApiDate(values.endTime!),
                responsibleName: showResponsible ? values.responsibleName : ''
            };

            const result = await request(url, {
                method,
                body: JSON.stringify(payload)
            });

            // INVALIDACIÓN CRÍTICA: Sincronizamos calendarios, listas, estadísticas y auditoría
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            return result;
        },
        onSuccess: (result) => {
            const isBlock = form.formData.isBlock || result?.status === 'BLOQUEO';
            const actionMsg = isEdit ? 'actualizada' : (isBlock ? 'bloqueado' : 'creada');
            
            let finalMsg = `Reserva ${actionMsg} correctamente.`;
            if (!isBlock) {
                if (result?.status === 'APROBADA') {
                    finalMsg = isEdit 
                        ? 'Reserva actualizada y aprobada automáticamente.' 
                        : 'Reserva creada y aprobada automáticamente.';
                } else if (result?.status === 'SOLICITADA') {
                    finalMsg = `Reserva ${isEdit ? 'actualizada' : 'creada'} y pendiente de aprobación.`;
                }
            } else if (isBlock) {
                finalMsg = `Espacio ${isEdit ? 'actualizado' : 'bloqueado'} correctamente por administración.`;
            }

            onSuccess(finalMsg);
            handleClose();
        }
    });

    /**
     * Sincronización proactiva de conflictos.
     * Eliminamos el guard para que debouncedCheck pueda limpiar el estado si los campos están vacíos.
     */
    useEffect(() => {
        if (open) {
            conflictEngine.checkConflicts(
                form.formData.spaceIds, 
                form.formData.startTime, 
                form.formData.endTime
            );
        }
    }, [form.formData.spaceIds, form.formData.startTime, form.formData.endTime, open, conflictEngine.checkConflicts]);

    /**
     * Hidratación del formulario.
     */
    useEffect(() => {
        if (open) {
            // Limpiamos conflictos previos al hidratar/resetear el formulario
            conflictEngine.clearConflicts();
            
            let initialForm = { ...defaultValues };

            if (isEdit && initialData) {
                initialForm = {
                    spaceIds: initialData.spaces?.map(s => s.id) || [],
                    startTime: parseApiDate(initialData.startTime),
                    endTime: parseApiDate(initialData.endTime),
                    title: initialData.title || '',
                    type: initialData.type || '',
                    subjectId: initialData.subject?.id || null,
                    description: initialData.description || '',
                    responsibleId: initialData.responsible?.id || null,
                    responsibleName: initialData.responsibleName || '',
                    isBlock: initialData.status === 'BLOQUEO'
                };
                const hasDiffResponsible = !!initialData.responsible || (!!initialData.responsibleName && initialData.responsibleName !== initialData.user?.name);
                setShowResponsible(hasDiffResponsible);
            } 
            else if (initialSlot) {
                const sIds = initialSlot.spaceIds || (initialSlot.spaceId ? [Number(initialSlot.spaceId)] : []);
                initialForm = {
                    ...initialForm,
                    spaceIds: sIds,
                    startTime: initialSlot.start,
                    endTime: initialSlot.end
                };
            }
            
            form.resetForm(initialForm);
        }
    }, [open, initialData, initialSlot, isEdit, defaultValues]);

    return {
        ...form,
        spaces, users, subjects,
        showResponsible, setShowResponsible,
        isFromSearch,
        conflictEngine,
        saveReservation: form.submit
    };
};
