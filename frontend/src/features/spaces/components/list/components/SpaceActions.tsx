import React from 'react';
import { Stack, Tooltip, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import type { Space } from '../../../types/space';

/**
 * Propiedades para el componente SpaceActions.
 */
interface SpaceActionsProps {
    /** La entidad de espacio sobre la cual se realizarán las acciones. */
    space: Space;
    /** Indica si el usuario tiene permisos para editar el espacio. */
    canEdit: boolean;
    /** Indica si el usuario tiene permisos para eliminar el espacio. */
    canDelete: boolean;
    /** 
     * Función que maneja la acción seleccionada.
     * @param action - Identificador de la acción a ejecutar ('edit', 'block', 'delete', 'restore').
     * @param space - El espacio sobre el cual aplicar la acción, opcional.
     */
    handleAction: (action: any, space?: Space) => void;
}

/**
 * Componente que provee un conjunto de botones de acción para la gestión de un espacio.
 * Las acciones disponibles (editar, bloquear temporalmente, eliminar o restaurar) se muestran
 * en función de los permisos del usuario y del estado actual del espacio.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el conjunto de botones de acción correspondientes.
 */
const SpaceActions: React.FC<SpaceActionsProps> = ({ space, canEdit, canDelete, handleAction }) => {
    const isEliminado = space.status === 'ELIMINADO';

    if (isEliminado) {
        return (
            <Tooltip title="Restaurar espacio">
                <IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); handleAction('restore', space); }}>
                    <RestoreFromTrashIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Stack data-testid={`space-actions-${space.id}`} direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
            {canEdit && (
                <>
                    <Tooltip title="Editar espacio">
                        <IconButton 
                            size="small" color="primary" 
                            onClick={() => handleAction('edit', space)}
                            aria-label="Editar espacio"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Gestionar bloqueo temporal">
                        <IconButton 
                            size="small" color="warning" 
                            onClick={() => handleAction('block', space)}
                            aria-label="Gestionar bloqueo temporal"
                        >
                            <BlockIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}
            {canDelete && (
                <Tooltip title="Eliminar espacio">
                    <IconButton 
                        size="small" color="error" 
                        onClick={() => handleAction('delete', space)}
                        aria-label="Eliminar espacio"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
};

export default SpaceActions;
