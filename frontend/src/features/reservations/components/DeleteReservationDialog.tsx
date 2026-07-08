import { Typography } from '@mui/material';
import type { Reservation } from '../../../shared/types';
import DeleteEntityDialog from '../../../shared/components/DeleteEntityDialog';
import { useDeleteEntity } from '../../../shared/hooks/useDeleteEntity';

/**
 * Propiedades del componente DeleteReservationDialog.
 */
interface DeleteReservationDialogProps {
    open: boolean;
    reservation: Reservation | null;
    handleClose: () => void;
    onSuccess: (message: string) => void;
}

/**
 * Componente de diálogo unificado para la cancelación de reservas o la eliminación de bloqueos administrativos.
 * 
 * Implementa una interfaz de confirmación estandarizada utilizando el componente `DeleteEntityDialog` 
 * y se apoya en el hook `useDeleteEntity` para centralizar la lógica de negocio, manejo de estados de carga 
 * y gestión de errores de la API durante el proceso de eliminación.
 * 
 * @param props - Propiedades necesarias para la renderización y funcionamiento del diálogo.
 * @param props.open - Estado booleano que determina la visibilidad del diálogo.
 * @param props.reservation - Objeto que representa la reserva o bloqueo que se desea eliminar.
 * @param props.handleClose - Función de callback invocada para cerrar el diálogo.
 * @param props.onSuccess - Función de callback invocada tras una eliminación exitosa, recibe el mensaje de éxito.
 * @returns Elemento React que representa el diálogo de confirmación de eliminación.
 */
const DeleteReservationDialog = ({ open, reservation, handleClose, onSuccess }: DeleteReservationDialogProps) => {
    
    const isBlock = reservation?.status === 'BLOQUEO';

    const {
        loading,
        error,
        handleDelete
    } = useDeleteEntity({
        open,
        conflictsUrl: null, // De momento las reservas no gestionan conflictos previos
        deleteUrl: reservation ? `/api/reservations/${reservation.id}` : null,
        onSuccess: (msg) => {
            onSuccess(msg);
            handleClose();
        },
        successMessage: isBlock 
            ? 'El bloqueo ha sido eliminado correctamente.' 
            : 'La reserva ha sido cancelada correctamente.'
    });

    return (
        <DeleteEntityDialog
            open={open}
            title={isBlock ? "¿Eliminar Bloqueo?" : "¿Cancelar Reserva?"}
            entityName={reservation?.title || (isBlock ? "Bloqueo Administrativo" : "Sin título")}
            entityTypeLabel={isBlock ? "Bloqueo" : "Reserva"}
            entityId={reservation?.id}
            loading={loading}
            error={error}
            onClose={handleClose}
            onConfirm={handleDelete}
            confirmText={isBlock ? "Eliminar Bloqueo" : "Confirmar Cancelación"}
        >
            <Typography variant="body2" color="text.secondary">
                {isBlock 
                    ? "Al eliminar este bloqueo, el espacio volverá a estar disponible para reservas de otros usuarios de forma inmediata."
                    : "¿Estás seguro de que deseas cancelar esta reserva? Esta acción liberará el espacio y enviará una notificación al usuario correspondiente si es necesario."
                }
            </Typography>
        </DeleteEntityDialog>
    );
};

export default DeleteReservationDialog;
