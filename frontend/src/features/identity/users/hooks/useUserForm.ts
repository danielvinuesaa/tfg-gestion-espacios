import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User, Role, UserStatus } from '../../../../shared/types';
import { useApi } from '../../../../shared/utils/api';
import { useBaseForm } from '../../../../shared/hooks/useBaseForm';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Gancho personalizado para gestionar el estado y la lógica de negocio del formulario de creación y edición de usuarios.
 * Integra la comunicación con el servidor mediante TanStack Query y maneja el estado de confirmación de contraseñas, validación, 
 * así como escenarios particulares como la restauración de usuarios eliminados.
 *
 * @param initialData - Datos iniciales del usuario para modo de edición; si es nulo o indefinido se asume creación.
 * @param open - Indica si el formulario está visible (dispara la carga de datos auxiliares como los roles).
 * @param handleClose - Función delegada para cerrar el formulario.
 * @param onSuccess - Función delegada que se ejecuta tras completarse con éxito una operación.
 * @returns Objeto con las propiedades, funciones y el estado interno del formulario de usuarios.
 */
export const useUserForm = (
    initialData: User | null | undefined, 
    open: boolean, 
    handleClose: () => void, 
    onSuccess: (msg: string) => void
) => {
    const { request } = useApi();
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isDeletedError, setIsDeletedError] = useState(false);

    // -- QUERIES --
    const { data: roles = [] } = useQuery<Role[]>({
        queryKey: ['/api/roles'],
        queryFn: () => request('/api/roles'),
        enabled: open
    });

    const form = useBaseForm({
        initialValues: {
            name: '',
            email: '',
            password: '',
            roleId: '',
            status: 'ACTIVO' as UserStatus
        },
        onSubmit: async (values) => {
            if (values.password && values.password !== confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }
            const isUpdate = initialData && typeof initialData === 'object' && 'id' in initialData;
            const method = isUpdate ? 'PUT' : 'POST';
            const url = isUpdate ? `/api/users/${(initialData as any).id}` : '/api/users';
            const result = await request(url, {
                method,
                body: JSON.stringify(values)
            });
            
            // INVALIDACIÓN TRANSVERSAL
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });

            // Si hemos editado al usuario actual, refrescamos su sesión
            if (initialData && user && user.id === initialData.id) {
                await refreshUser();
            }

            return result;
        },
        onSuccess: () => {
            const actionMsg = initialData ? 'actualizado' : 'creado';
            onSuccess(`Usuario "${form.formData.name}" ${actionMsg} correctamente.`);
            handleClose();
        }
    });

    // Sincronización de datos iniciales
    useEffect(() => {
        if (open) {
            const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;

            const initialForm = isEdit ? {
                name: initialData.name,
                email: initialData.email,
                password: '', 
                roleId: initialData.role?.id?.toString() || '',
                status: initialData.status || 'ACTIVO'
            } : { name: '', email: '', password: '', roleId: '', status: 'ACTIVO' as UserStatus };
            
            form.resetForm(initialForm);
            setConfirmPassword('');
            setIsDeletedError(false);
        }
    }, [open, initialData]);

    const restoreUserByEmail = async () => {
        form.setError(null);
        try {
            await request(`/api/users/restore-by-email?email=${encodeURIComponent(form.formData.email)}`, {
                method: 'POST'
            });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });

            onSuccess(`Usuario con email ${form.formData.email} restaurado con éxito.`);
            handleClose();
        } catch (err: any) {
            form.setError(err.message || "Error al restaurar");
        }
    };

    const saveUser = async () => {
        setIsDeletedError(false);
        try {
            await form.submit();
        } catch (err: any) {
            if (err.message === "DELETED_USER_RESTORE_PROMPT") {
                setIsDeletedError(true);
                form.setError("Este email pertenece a un usuario eliminado.");
            }
        }
    };

    return {
        ...form,
        confirmPassword,
        setConfirmPassword,
        roles,
        isDeletedError,
        saveUser,
        restoreUserByEmail
    };
};
