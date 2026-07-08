import React from 'react';
import GenericImportDialog from '../../../../shared/components/GenericImportDialog';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Typography, Alert, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../shared/utils/api';
import type { Role } from '../../../../shared/types';
import ImportConflictChip from '../../../../shared/components/Chips/ImportConflictChip';

/**
 * Propiedades del componente ImportUsersDialog.
 */
interface ImportUsersDialogProps {
    open: boolean;
    handleClose: () => void;
    onSuccess: (message?: string) => void;
}

/**
 * Interfaz que define la estructura de un conflicto detectado durante la importación de usuarios.
 */
interface UserImportConflict {
    name: string;
    email: string;
    role: string;
    currentRole: string;
    currentName: string;
}

/**
 * Adaptador del diálogo de importación para el módulo de Usuarios.
 * Configura y utiliza el componente genérico GenericImportDialog para procesar archivos CSV con datos de usuarios.
 *
 * @param props - Propiedades del componente.
 * @param props.open - Indica si el diálogo de importación se encuentra abierto.
 * @param props.handleClose - Función delegada para cerrar el diálogo.
 * @param props.onSuccess - Función delegada que se ejecuta tras una importación exitosa, opcionalmente recibe un mensaje.
 * @returns Elemento de React que representa el diálogo de importación.
 */
const ImportUsersDialog = ({ open, handleClose, onSuccess }: ImportUsersDialogProps) => {
    const { request } = useApi();
    
    // Obtenemos los roles reales del sistema
    const { data: roles = [] } = useQuery<Role[]>({
        queryKey: ['/api/roles'],
        queryFn: () => request('/api/roles'),
        enabled: open
    });

    const rolesList = roles.length > 0 
        ? roles.map(r => r.name).join(', ') 
        : 'ADMIN, GESTOR, PROFESOR, ALUMNO'; // Fallback por si falla la carga

    const config = {
        title: "Importar Usuarios",
        icon: <GroupAddIcon />,
        apiEndpoints: {
            validate: '/api/users/import/validate',
            import: '/api/users/import'
        },
        // Configuración de TanStack Query integrada
        queryKey: ['/api/users'],
        csvFormat: "Nombre; Email; Rol; Contraseña (opcional)",
        instructions: [
            `Roles válidos: ${rolesList} (solo roles activos).`,
            "Email: Formato estándar (ej: usuario@dominio.es). Es el identificador único.",
            "Nombre: Mínimo 2 caracteres requeridos.",
            "Contraseña: Si se omite para nuevos usuarios, se asignará UniOvi.2026."
        ],
        renderConflictRow: (c: UserImportConflict) => {
            const hasNameChange = c.name !== c.currentName;
            const hasRoleChange = c.role !== c.currentRole;
            return {
                identity: (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">{c.email}</Typography>
                        <Typography variant="caption" color="textSecondary">{c.name}</Typography>
                    </Box>
                ),
                changes: (
                    <Box>
                        {hasNameChange && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                <strong>Nombre:</strong> {c.currentName} → {c.name}
                            </Typography>
                        )}
                        {hasRoleChange && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                <strong>Rol:</strong> {c.currentRole} → {c.role}
                            </Typography>
                        )}
                        {!hasNameChange && !hasRoleChange && (
                            <Typography variant="caption" color="textDisabled" sx={{ fontStyle: 'italic' }}>
                                Sin cambios detectados
                            </Typography>
                        )}
                    </Box>
                ),
                status: <ImportConflictChip type="EXISTING" />
            };
        },
        conflictAlertMessage: (count: number, result: any) => {
            const newCount = result?.newCount || 0;
            const errorCount = result?.errors?.length || 0;

            // Caso 1: Archivo con errores críticos y nada procesable
            if (newCount === 0 && count === 0 && errorCount > 0) {
                return (
                    <Alert severity="error" icon={<WarningAmberIcon />}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Archivo no procesable
                        </Typography>
                        <Typography variant="body2">
                            No se han detectado usuarios válidos. Por favor, revise los errores de formato y la validez de los roles.
                        </Typography>
                    </Alert>
                );
            }

            const severity = count === 0 ? "success" : "warning";
            return (
                <Alert severity={severity} icon={<WarningAmberIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {count === 0 
                            ? (newCount > 0 ? "¡Archivo listo para importar!" : "Archivo validado")
                            : `Se ${count === 1 ? 'ha' : 'han'} detectado ${count} usuario${count === 1 ? '' : 's'} que ya existe${count === 1 ? '' : 'n'}.`}
                    </Typography>
                    {count > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" display="block">• <strong>Importar solo nuevos:</strong> Se añadirán los registros nuevos. Los usuarios existentes se mantendrán sin cambios.</Typography>
                            <Typography variant="body2" display="block">• <strong>Importar y actualizar:</strong> Se actualizarán los nombres y roles de los usuarios actuales con los datos del CSV.</Typography>
                        </Box>
                    )}
                    {count === 0 && newCount > 0 && (
                        <Typography variant="body2">
                            {errorCount === 0 
                                ? "Todos los usuarios del archivo son nuevos y se crearán correctamente en el sistema."
                                : `Se ${newCount === 1 ? 'ha' : 'han'} detectado ${newCount} usuario${newCount === 1 ? '' : 's'} nuevo${newCount === 1 ? '' : 's'} que se ${newCount === 1 ? 'creará' : 'crearán'} correctamente en el sistema.`}
                        </Typography>
                    )}
                </Alert>
            );
        }
    };

    return (
        <GenericImportDialog<UserImportConflict>
            open={open}
            handleClose={handleClose}
            onSuccess={onSuccess}
            config={config}
        />
    );
};

export default ImportUsersDialog;
