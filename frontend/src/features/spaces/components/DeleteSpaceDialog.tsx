import {
    Typography,
    Box,
    Alert,
    Divider,
    List,
    ListItem,
    ListItemText,
    Chip,
    Stack,
    Paper
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import LockIcon from '@mui/icons-material/Lock';
import { formatDisplayDate, parseApiDate } from '../../../shared/utils/dateUtils';
import { getSpaceColors, getPhysicalStatusColors } from '../../../theme/reservationTheme';
import type { Space } from '../../../shared/types';
import DeleteEntityDialog from '../../../shared/components/DeleteEntityDialog';
import { useDeleteEntity } from '../../../shared/hooks/useDeleteEntity';
import ReservationStatusChip from '../../../shared/components/Chips/ReservationStatusChip';
import ReservationTypeChip from '../../../shared/components/Chips/ReservationTypeChip';
import CounterChip from '../../../shared/components/Chips/CounterChip';

/**
 * Propiedades requeridas para el componente DeleteSpaceDialog.
 */
interface DeleteSpaceDialogProps {
    /** Indica si el diálogo está abierto. */
    open: boolean;
    /** Objeto que representa el espacio a eliminar, o nulo si no hay selección. */
    space: Space | null;
    /** Función de retrollamada para cerrar el diálogo. */
    handleClose: () => void;
    /** Función de retrollamada ejecutada tras una eliminación exitosa. */
    onSuccess: (message: string) => void;
}

/**
 * Cuadro de diálogo unificado para confirmar la eliminación de un espacio.
 * Verifica previamente la existencia de conflictos (reservas asociadas) y advierte al usuario
 * de las consecuencias antes de ejecutar el borrado lógico.
 *
 * @param props - Propiedades que controlan el diálogo y las acciones asociadas.
 * @returns Un componente JSX que representa el diálogo modal de advertencia y confirmación.
 */
const DeleteSpaceDialog = ({ open, space, handleClose, onSuccess }: DeleteSpaceDialogProps) => {
    
    const {
        loading,
        checkingConflicts,
        conflicts,
        error,
        handleDelete
    } = useDeleteEntity({
        open,
        conflictsUrl: space ? `/api/spaces/${space.id}/conflicts` : null,
        deleteUrl: space ? `/api/spaces/${space.id}` : null,
        onSuccess: (msg) => {
            onSuccess(msg);
            handleClose();
        },
        successMessage: `El espacio "${space?.name}" ha sido eliminado correctamente.`
    });

    const hasConflicts = conflicts?.hasConflicts || false;
    const details = conflicts?.details || [];

    const conflictContent = hasConflicts ? (
        <>
            <Alert severity="warning" icon={<EventBusyIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                    {details.length === 1 
                        ? 'Se ha encontrado 1 evento activo vinculado.' 
                        : `Se han encontrado ${details.length} eventos activos vinculados.`}
                </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ mb: 3, maxHeight: 250, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 2 }}>
                <List disablePadding>
                    {details.map((c: any, index: number) => {
                        const isBlock = c.status === 'BLOQUEO';
                        return (
                            <Box key={c.reservationId}>
                                <ListItem sx={{ py: 1.5 }}>
                                    <ListItemText 
                                        primaryTypographyProps={{ component: 'div' }}
                                        secondaryTypographyProps={{ component: 'div' }}
                                        primary={
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, maxWidth: '65%' }}>
                                                    {isBlock && <LockIcon fontSize="small" color="warning" />}
                                                    <Typography variant="body2" fontWeight="bold" sx={{ fontStyle: isBlock ? 'italic' : 'normal' }}>
                                                        {c.title || (isBlock ? "Bloqueo Administrativo" : "Sin título")}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={0.5} alignItems="center">
                                                    {isBlock ? (
                                                        <ReservationStatusChip status="BLOQUEO" sx={{ height: 20, fontSize: '0.7rem', minWidth: 70 }} />
                                                    ) : (
                                                        <ReservationTypeChip type={c.type || 'RESERVA'} sx={{ height: 20, fontSize: '0.7rem', minWidth: 70 }} />
                                                    )}
                                                    <CounterChip 
                                                        count={c.onlySpace ? "Único" : "Multi"} 
                                                        variant={c.onlySpace ? 'error' : 'default'} 
                                                        sx={{ minWidth: 50 }} 
                                                    />
                                                </Stack>
                                            </Box>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatDisplayDate(parseApiDate(c.startTime), "d 'de' MMM, HH:mm")} - {formatDisplayDate(parseApiDate(c.endTime), "HH:mm")}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                    {c.userName}
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {index < details.length - 1 && <Divider component="li" />}
                            </Box>
                        );
                    })}
                </List>
            </Paper>

            <Box sx={{ p: 2, bgcolor: '#fffde7', borderRadius: 2, border: '1px solid #fff9c4' }}>
                <Typography variant="body2" color="#5d4037" gutterBottom sx={{ fontSize: '0.8rem' }}>
                    <strong>Impacto de la eliminación:</strong>
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', color: '#5d4037' }}>
                    <li>Las reservas y bloqueos de <strong>Espacio Único</strong> serán cancelados.</li>
                    <li>En eventos <strong>Multiespacio</strong>, se retirará este espacio de la lista.</li>
                </ul>
            </Box>
        </>
    ) : (
        <Typography variant="body2" color="text.secondary">
            ¿Está seguro de que desea eliminar este espacio? Esta acción marcará el espacio como no disponible para futuras reservas.
        </Typography>
    );

    return (
        <DeleteEntityDialog
            open={open}
            title="¿Eliminar Espacio?"
            entityName={space?.name || ''}
            entityTypeLabel="Espacio"
            entityId={space?.id}
            hasConflicts={hasConflicts}
            checkingConflicts={checkingConflicts}
            loading={loading}
            error={error}
            onClose={handleClose}
            onConfirm={handleDelete}
            confirmText={hasConflicts ? "Confirmar y Procesar Reservas" : "Confirmar Eliminación"}
            auditNote="Este espacio no se borrará físicamente para cumplir con la normativa de auditoría y preservar el historial de reservas."
        >
            {conflictContent}
        </DeleteEntityDialog>
    );
};

export default DeleteSpaceDialog;
