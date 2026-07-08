import React from 'react';
import { Stack, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { User } from '../../../../../../shared/types';

/**
 * Propiedades del componente UserActions.
 */
interface UserActionsProps {
    user: User;
    isProtected: boolean;
    handleAction: (action: any, user: User) => void;
}

/**
 * Componente que renderiza las acciones individuales (editar, bloquear, eliminar, restaurar) para un usuario específico en la tabla.
 *
 * @param props - Propiedades del componente.
 * @param props.user - Objeto del usuario sobre el cual recaen las acciones.
 * @param props.isProtected - Indica si el usuario actual tiene restricciones para ser modificado.
 * @param props.handleAction - Función delegada para ejecutar una acción sobre el usuario.
 * @returns Elemento de React con los botones de acción para el usuario.
 */
const UserActions: React.FC<UserActionsProps> = ({ user, isProtected, handleAction }) => {
    const isDeleted = user.status === 'ELIMINADO';
    const isBlocked = user.status === 'BLOQUEADO';

    if (isDeleted) {
        return (
            <Tooltip title="Restaurar Usuario">
                <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('restore', user); }}>
                    <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        );
    }

    const isAdminAccount = user.email === 'admin@uniovi.es';
    const editLabel = isAdminAccount ? "Cuenta de sistema protegida" : "Editar";
    const blockLabel = isProtected ? "Estado de cuenta protegido" : (isBlocked ? "Desbloquear Acceso" : "Bloquear Acceso");
    const deleteLabel = isAdminAccount ? "Administrador de sistema protegido" : "Eliminar";

    return (
        <Stack direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
            <Tooltip title={editLabel}>
                <span>
                    <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleAction('edit', user)}
                        disabled={isAdminAccount}
                        aria-label={editLabel}
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <Tooltip title={blockLabel}>
                <span>
                    <IconButton 
                        size="small" 
                        color={isBlocked ? "success" : "warning"} 
                        onClick={() => handleAction(isBlocked ? 'unblock' : 'block', user)} 
                        disabled={isProtected}
                        aria-label={blockLabel}
                    >
                        {isBlocked ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                    </IconButton>
                </span>
            </Tooltip>
            
            <Tooltip title={deleteLabel}>
                <span>
                    <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleAction('delete', user)} 
                        disabled={isProtected}
                        aria-label={deleteLabel}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
        </Stack>
    );
};

export default UserActions;
