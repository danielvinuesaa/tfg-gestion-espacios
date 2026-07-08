import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Role, Subject } from '../../../../shared/types';
import { useApi } from '../../../../shared/utils/api';
import { useBaseForm } from '../../../../shared/hooks/useBaseForm';
import { useAuth } from '../../../../context/AuthContext';

/**
 * Mapa de dependencias de permisos para lógica de negocio proactiva.
 */
const DEPENDENCIES: Record<string, string[]> = {
    'CREAR_ESPACIOS': ['LEER_ESPACIOS'],
    'EDITAR_ESPACIOS': ['LEER_ESPACIOS'],
    'ELIMINAR_ESPACIOS': ['LEER_ESPACIOS'],
    'APROBAR_RESERVA': ['VER_TODAS_RESERVAS'],
    'APROBAR_ASIGNATURAS_GESTIONADAS': ['VER_TODAS_RESERVAS'],
    'CANCELAR_RESERVA': ['VER_TODAS_RESERVAS'],
    'IMPORTAR_RESERVAS': ['VER_TODAS_RESERVAS'],
    'EXPORTAR_RESERVAS': ['VER_TODAS_RESERVAS'],
};

const formatPermName = (name: string) => {
    return name.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Estructura de datos para el formulario de roles.
 */
export interface RoleFormData {
    /** Nombre identificativo del rol. */
    name: string;
    /** Descripción del propósito del rol. */
    description: string;
    /** Lista de permisos técnicos asignados. */
    permissions: string[];
    /** Lista de IDs de las asignaturas sobre las que el rol tendrá jurisdicción. */
    subjectIds: number[];
}

/**
 * Hook de negocio avanzado para la gestión del formulario de Roles.
 * Implementa la validación, la carga de catálogos y la lógica proactiva de dependencias
 * entre permisos, utilizando TanStack Query para la sincronización con el servidor.
 * 
 * @param initialData - Datos del rol a editar, o nulo/indefinido para uno nuevo.
 * @param open - Estado de visibilidad del formulario.
 * @param handleClose - Función para cerrar el formulario.
 * @param onSuccess - Función callback a ejecutar tras guardar correctamente.
 * @returns Objeto con el estado del formulario y funciones de manejo de eventos.
 */
export const useRoleForm = (
    initialData: Role | null | undefined, 
    open: boolean, 
    handleClose: () => void, 
    onSuccess: (msg: string) => void
) => {
    const { request } = useApi();
    const { user, refreshUser } = useAuth();
    const queryClient = useQueryClient();
    const [info, setInfo] = useState<string | null>(null);

    // -- QUERIES --
    const { data: allSubjects = [] } = useQuery<Subject[]>({
        queryKey: ['/api/subjects'],
        queryFn: () => request('/api/subjects'),
        enabled: open
    });

    const form = useBaseForm<RoleFormData>({
        initialValues: {
            name: '',
            description: '',
            permissions: [],
            subjectIds: []
        },
        onSubmit: async (values) => {
            const isEdit = !!initialData?.id;
            const url = isEdit ? `/api/roles/${initialData.id}` : '/api/roles';
            const method = isEdit ? 'PUT' : 'POST';
            const result = await request(url, {
                method,
                body: JSON.stringify({
                    ...values,
                    name: values.name.trim()
                })
            });

            // INVALIDACIÓN TRANSVERSAL COMPLETA
            queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
            queryClient.invalidateQueries({ queryKey: ['/api/users'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/audit-logs'] });
            queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });

            // Si hemos editado el rol que tiene el usuario actual, refrescamos su sesión
            if (initialData && user && user.role === initialData.name) {
                await refreshUser();
            }

            return result;
        },
        onSuccess: () => {
            onSuccess(initialData 
                ? `Rol "${form.formData.name}" actualizado correctamente.` 
                : `Rol "${form.formData.name}" creado correctamente.`);
            handleClose();
        }
    });

    // Sincronizar datos iniciales
    useEffect(() => {
        if (open) {
            const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;

            const name = isEdit ? initialData.name : '';
            const description = isEdit ? initialData.description : '';
            const permissions = isEdit ? (initialData.permissionNames || 
                         (Array.isArray(initialData.permissions) 
                            ? (initialData.permissions as any[]).map(p => typeof p === 'string' ? p : p.name) 
                            : [])) : [];
            const subjectIds = isEdit ? (initialData.subjects?.map(s => s.id) || []) : [];
            
            form.resetForm({ name, description, permissions, subjectIds });
            setInfo(null);
        }
    }, [open, initialData]);


    const toggleCategory = useCallback((categoryPerms: string[], checked: boolean) => {
        setInfo(null);
        let newSelection = [...form.formData.permissions];
        let infoMsg = '';
        
        if (checked) {
            categoryPerms.forEach(perm => {
                if (!newSelection.includes(perm)) {
                    newSelection.push(perm);
                    if (DEPENDENCIES[perm]) {
                        DEPENDENCIES[perm].forEach(dep => {
                            if (!newSelection.includes(dep)) newSelection.push(dep);
                        });
                    }
                }
            });
            
            if (categoryPerms.includes('APROBAR_RESERVA') && newSelection.includes('APROBAR_ASIGNATURAS_GESTIONADAS')) {
                newSelection = newSelection.filter(p => p !== 'APROBAR_ASIGNATURAS_GESTIONADAS');
                form.setFieldValue('subjectIds', []);
                infoMsg = 'Información: El permiso global de aprobación sustituye a la gestión por asignaturas.';
            }
        } else {
            newSelection = newSelection.filter(p => !categoryPerms.includes(p));
            if (categoryPerms.includes('APROBAR_ASIGNATURAS_GESTIONADAS')) form.setFieldValue('subjectIds', []);

            const dependentChildren = Object.keys(DEPENDENCIES).filter(key => 
                DEPENDENCIES[key].some(dep => categoryPerms.includes(dep)) && newSelection.includes(key)
            );

            if (dependentChildren.length > 0) {
                newSelection = newSelection.filter(p => !dependentChildren.includes(p));
                infoMsg = 'Información: Se han desactivado automáticamente permisos que dependían de la categoría desmarcada.';
            }
        }
        
        if (infoMsg) setInfo(infoMsg);
        form.setFieldValue('permissions', Array.from(new Set(newSelection)));
    }, [form.formData.permissions, form.setFieldValue]); // eslint-disable-line react-hooks/exhaustive-deps

    const togglePermission = (perm: string, checked: boolean) => {
        let newSelection = [...form.formData.permissions];
        form.setError(null);
        setInfo(null);
        
        if (checked) {
            newSelection.push(perm);
            
            if (perm === 'APROBAR_RESERVA' && newSelection.includes('APROBAR_ASIGNATURAS_GESTIONADAS')) {
                newSelection = newSelection.filter(p => p !== 'APROBAR_ASIGNATURAS_GESTIONADAS');
                form.setFieldValue('subjectIds', []);
                setInfo('Información: El permiso global de aprobación sustituye y desactiva la gestión individual por asignaturas.');
            }

            if (DEPENDENCIES[perm]) {
                const addedDeps: string[] = [];
                DEPENDENCIES[perm].forEach(dep => {
                    if (!newSelection.includes(dep)) {
                        newSelection.push(dep);
                        addedDeps.push(formatPermName(dep));
                    }
                });
                if (addedDeps.length > 0) {
                    setInfo(`Información: Se ha activado automáticamente el permiso base necesario: ${addedDeps.join(', ')}.`);
                }
            }
        } else {
            const dependentChildren = Object.keys(DEPENDENCIES).filter(key => 
                DEPENDENCIES[key].includes(perm) && newSelection.includes(key)
            );

            if (dependentChildren.length > 0) {
                newSelection = newSelection.filter(p => !dependentChildren.includes(p));
                setInfo(`Información: Se han desactivado automáticamente los permisos que requerían "${formatPermName(perm)}".`);
            }

            newSelection = newSelection.filter(p => p !== perm);
            if (perm === 'APROBAR_ASIGNATURAS_GESTIONADAS') form.setFieldValue('subjectIds', []);
        }
        
        form.setFieldValue('permissions', Array.from(new Set(newSelection)));
    };

    return {
        ...form,
        info,
        allSubjects,
        togglePermission,
        toggleCategory,
        saveRole: form.submit
    };
};
