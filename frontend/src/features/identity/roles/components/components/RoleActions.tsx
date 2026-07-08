import React from 'react';
import { Stack, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import type { Role } from '../../../../../shared/types';

/**
 * Propiedades del componente {@link RoleActions}.
 */
interface RoleActionsProps {
    /** Objeto que representa el rol sobre el que se aplicarán las acciones. */
    role: Role;
    /** Indica si el rol es un rol protegido del sistema (no editable/eliminable). */
    isSystemRole: boolean;
    /** Función de retorno para manejar la acción seleccionada (ver, editar, eliminar, restaurar). */
    handleAction: (action: string, role: Role) => void;
}

/**
 * Componente que renderiza los botones de acción disponibles para un rol específico en el listado.
 * Gestiona el estado visual de los botones dependiendo de si el rol está eliminado o es protegido.
 * 
 * @param props - Propiedades necesarias para renderizar la barra de acciones.
 * @returns Componente JSX con las herramientas de acción para el rol.
 */
const RoleActions: React.FC<RoleActionsProps> = ({ 
    role, isSystemRole, handleAction
}) => {
    const isDeleted = role.status === 'ELIMINADO';

    if (isDeleted) {
        return (
            <Tooltip title="Restaurar Rol">
                <IconButton 
                    size="small" color="success" 
                    onClick={(e) => { e.stopPropagation(); handleAction('restore', role); }}
                    data-testid={`restore-role-${role.id}`}
                >
                    <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Stack direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Ver detalles">
                <IconButton 
                    size="small" 
                    onClick={() => handleAction('view', role)}
                    data-testid={`view-details-${role.id}`}
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title={isSystemRole ? "Rol del sistema protegido" : "Editar"}>
                <span>
                    <IconButton 
                        size="small" color="primary" disabled={isSystemRole}
                        onClick={() => handleAction('edit', role)}
                        data-testid={`edit-role-${role.id}`}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={isSystemRole ? "Rol del sistema protegido" : "Eliminar"}>
                <span>
                    <IconButton 
                        size="small" color="error" disabled={isSystemRole}
                        onClick={() => handleAction('delete', role)}
                        data-testid={`delete-role-${role.id}`}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
    );
};

export default RoleActions;
