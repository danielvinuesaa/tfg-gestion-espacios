import React from 'react';
import { Stack, Tooltip, IconButton } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Reservation } from '../../../../../shared/types';

/**
 * Propiedades del componente ReservationActions.
 */
interface ReservationActionsProps {
    reservation: Reservation;
    handleAction: (action: any, res: Reservation) => void;
    canApprove: (res: Reservation) => boolean;
    canEdit: (res: Reservation) => boolean;
    canDelete: (res: Reservation) => boolean;
}

/**
 * Componente especializado para la botonera de acciones en las filas de las tablas de reservas.
 * 
 * Centraliza la lógica de renderizado de los controles interactivos asociados a cada entidad,
 * evaluando los permisos en tiempo real (`canApprove`, `canEdit`, `canDelete`) y el estado actual de la reserva
 * para mostrar u ocultar dinámicamente las acciones permitidas (ver detalles, aprobar, rechazar, editar, cancelar).
 * 
 * @param props - Propiedades requeridas por el subcomponente de acciones.
 * @param props.reservation - Entidad de reserva sobre la cual se aplicarán las acciones.
 * @param props.handleAction - Función orquestadora central que recibe el tipo de acción y la entidad a procesar.
 * @param props.canApprove - Función evaluadora de los permisos de aprobación del usuario actual.
 * @param props.canEdit - Función evaluadora de los permisos de modificación del usuario actual.
 * @param props.canDelete - Función evaluadora de los permisos de cancelación/eliminación del usuario actual.
 * @returns Botonera interactiva renderizada con iconos y tooltips contextuales.
 */
const ReservationActions: React.FC<ReservationActionsProps> = ({
    reservation, handleAction,
    canApprove, canEdit, canDelete
}) => {
    return (
        <Stack direction="row" spacing={0.5} justifyContent="center" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Ver detalles">
                <IconButton 
                    size="small" 
                    onClick={() => handleAction('view', reservation)}
                    aria-label="Ver detalles"
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            
            {reservation.status === 'SOLICITADA' && canApprove(reservation) && (
                <>
                    <Tooltip title="Aprobar">
                        <IconButton 
                            color="success" size="small" 
                            onClick={() => handleAction('approve', reservation)}
                            aria-label="Aprobar"
                        >
                            <CheckIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Rechazar">
                        <IconButton 
                            color="error" size="small" 
                            onClick={() => handleAction('reject', reservation)}
                            aria-label="Rechazar"
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}
            
            {canEdit(reservation) && (
                <Tooltip title="Editar">
                    <IconButton 
                        color="primary" size="small" 
                        onClick={() => handleAction('edit', reservation)}
                        aria-label="Editar"
                    >
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            
            {canDelete(reservation) && reservation.status !== 'CANCELADA' && reservation.status !== 'RECHAZADA' && (
                <Tooltip title="Cancelar">
                    <IconButton 
                        color="error" size="small" 
                        onClick={() => handleAction('delete', reservation)}
                        aria-label="Cancelar"
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
        </Stack>
    );
};

export default ReservationActions;
