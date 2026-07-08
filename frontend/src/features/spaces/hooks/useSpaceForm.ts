import { useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import type { Space } from '../../../shared/types';
import { useApi } from '../../../shared/utils/api';
import { useBaseForm } from '../../../shared/hooks/useBaseForm';

/**
 * Hook de negocio para el formulario de Espacios empleando TanStack Query.
 * Gestiona el estado local del formulario, las validaciones iniciales,
 * la petición al servidor (POST/PUT) y la invalidación cruzada de las cachés relacionadas.
 *
 * @param initialData - Datos iniciales del espacio si se trata de una edición.
 * @param open - Indica si el formulario se encuentra visible en la pantalla.
 * @param handleClose - Función para cerrar el diálogo del formulario.
 * @param onSuccess - Función a ejecutar tras una operación de guardado exitosa.
 * @returns Objeto con los estados del formulario, funciones de cambio y la función para guardar.
 */
export const useSpaceForm = (
    initialData: Space | null | undefined, 
    open: boolean, 
    handleClose: () => void, 
    onSuccess: (msg?: string) => void
) => {
    const { request } = useApi();
    const queryClient = useQueryClient();

    const defaultValues: Partial<Space> = {
        name: '',
        type: '' as any,
        totalCapacity: 1,
        computerCount: 0,
        status: 'DISPONIBLE',
        gisId: '',
        additionalInfo: ''
    };

    const form = useBaseForm<Partial<Space>>({
        initialValues: defaultValues,
        onSubmit: async (values) => {
            const isUpdate = initialData && typeof initialData === 'object' && 'id' in initialData;
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `/api/spaces/${(initialData as any).id}` : '/api/spaces';
            const result = await request(url, {
                method,
                body: JSON.stringify(values)
            });
            
            // INVALIDACIÓN TRANSVERSAL: Sincronizamos espacios, estadísticas, reservas y auditoría
            queryClient.invalidateQueries({ queryKey: ['/api/spaces'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            return result;
        },
        onSuccess: () => {
            onSuccess(initialData 
                ? `El espacio "${form.formData.name}" ha sido actualizado correctamente.` 
                : `El espacio "${form.formData.name}" ha sido creado correctamente.`);
            handleClose();
        }
    });

    // Sincronizar datos iniciales al abrir el diálogo
    useEffect(() => {
        if (open) {
            const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;
            
            const data = isEdit ? {
                name: initialData.name,
                type: initialData.type,
                totalCapacity: initialData.totalCapacity,
                computerCount: initialData.computerCount || 0,
                status: initialData.status,
                gisId: initialData.gisId || '',
                additionalInfo: initialData.additionalInfo || ''
            } : defaultValues;
            form.resetForm(data);
        }
    }, [open, initialData]);

    // Sobrescribimos handleChange para asegurar valores numéricos positivos
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'totalCapacity') {
            const val = Math.max(1, parseInt(value) || 1);
            form.setFieldValue(name as any, val);
        } else if (name === 'computerCount') {
            const val = Math.max(0, parseInt(value) || 0);
            form.setFieldValue(name as any, val);
        } else {
            form.handleChange(e);
        }
    };

    return {
        ...form,
        handleChange, 
        saveSpace: form.submit
    };
};
