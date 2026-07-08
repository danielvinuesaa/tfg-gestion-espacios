import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Space, Reservation } from '../../../shared/types';
import { useApi } from '../../../shared/utils/api';
import { useBaseForm } from '../../../shared/hooks/useBaseForm';
import { formatApiDate, parseApiDate } from '../../../shared/utils/dateUtils';
import { reservationValidation } from '../utils/reservationValidation';
import { useConflictChecker } from './useConflictChecker';

/**
 * Estructura de datos para la creación o edición de un bloqueo de espacio.
 */
export interface BlockFormData {
    spaceIds: number[];
    startTime: Date | null;
    endTime: Date | null;
    description: string;
    isBlock: boolean;
}

/**
 * Hook especializado para gestionar la lógica de bloqueos temporales de espacios.
 * Integrado con TanStack Query y el motor de conflictos para validar la viabilidad del bloqueo.
 * 
 * @param space - Espacio predeterminado a bloquear, si existe.
 * @param initialData - Datos iniciales del bloqueo, presentes si es una edición.
 * @param open - Estado de visibilidad del formulario.
 * @param handleClose - Función para cerrar el formulario.
 * @param onSuccess - Función callback a ejecutar tras aplicar el bloqueo exitosamente.
 * @returns Objeto que proporciona el estado del formulario, funciones de control y el motor de conflictos.
 */
export const useBlockForm = (
    space: Space | null, 
    initialData: Reservation | null | undefined,
    open: boolean, 
    handleClose: () => void, 
    onSuccess: (msg: string) => void
) => {
    const { request } = useApi();
    const queryClient = useQueryClient();
    
    // Motor de conflictos proactivo
    const conflictEngine = useConflictChecker(initialData?.id);

    const isEdit = !!initialData;

    const defaultValues: BlockFormData = useMemo(() => {
        if (initialData) {
            return {
                spaceIds: initialData.spaces?.map(s => s.id) || [],
                startTime: parseApiDate(initialData.startTime),
                endTime: parseApiDate(initialData.endTime),
                description: initialData.description || '',
                isBlock: true
            };
        }
        return {
            spaceIds: space ? [space.id] : [],
            startTime: null,
            endTime: null,
            description: '',
            isBlock: true
        };
    }, [space, initialData]);

    const form = useBaseForm<BlockFormData>({
        initialValues: defaultValues,
        onSubmit: async (values) => {
            // Validaciones
            const timeVal = reservationValidation.validateTemporalRange(values as any, false);
            if (!timeVal.isValid) throw new Error(timeVal.error);

            if (!values.description || values.description.trim().length < 5) {
                throw new Error("El motivo del bloqueo debe tener al menos 5 caracteres");
            }

            const body = {
                ...values,
                title: `Bloqueo: ${values.description.substring(0, 30)}${values.description.length > 30 ? '...' : ''}`,
                type: 'OTRO', // Los bloqueos se categorizan como OTRO a nivel de tipo de actividad
                startTime: formatApiDate(values.startTime!),
                endTime: formatApiDate(values.endTime!)
            };

            // Envío al servidor
            const result = isEdit 
                ? await request(`/api/reservations/${initialData!.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(body)
                  })
                : await request('/api/reservations', {
                    method: 'POST',
                    body: JSON.stringify(body)
                  });

            // INVALIDACIÓN: Sincronizamos la lista, el calendario y el dashboard
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            return result;
        },
        onSuccess: () => {
            onSuccess(isEdit 
                ? "El bloqueo ha sido actualizado correctamente."
                : `El espacio "${space?.name || 'seleccionado'}" ha sido bloqueado correctamente.`);
            handleClose();
        }
    });

    /**
     * Sincronización proactiva con el motor de conflictos.
     */
    useEffect(() => {
        if (open && form.formData.spaceIds.length > 0 && form.formData.startTime && form.formData.endTime) {
            conflictEngine.checkConflicts(
                form.formData.spaceIds, 
                form.formData.startTime, 
                form.formData.endTime
            );
        }
    }, [form.formData.startTime, form.formData.endTime, form.formData.spaceIds, open]);

    /**
     * Reiniciar el formulario al abrir el diálogo o cambiar los datos iniciales.
     */
    useEffect(() => {
        if (open) {
            form.resetForm(defaultValues);
        }
    }, [open, defaultValues]);

    return { 
        ...form,
        isEdit,
        setFormData: (data: Partial<BlockFormData>) => form.setFields(data),
        conflictEngine,
        submitBlock: form.submit 
    };
};
