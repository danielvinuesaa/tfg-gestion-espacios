import { useMemo } from 'react';
import {
    Typography,
    Box,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Stack,
    Paper
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import RoomIcon from '@mui/icons-material/Room';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { parseApiDate, formatDisplayDate } from '../../../../shared/utils/dateUtils';
import type { User } from '../../../../shared/types';
import type { ConflictDetail, EntityConflictResponse as ConflictSummary } from '../../../../features/spaces/types/conflicts';
import DeleteEntityDialog from '../../../../shared/components/DeleteEntityDialog';
import { useDeleteEntity } from '../../../../shared/hooks/useDeleteEntity';
import ReservationStatusChip from '../../../../shared/components/Chips/ReservationStatusChip';
import CounterChip from '../../../../shared/components/Chips/CounterChip';

/**
 * Propiedades del componente DeleteUserDialog.
 */
interface DeleteUserDialogProps {
    open: boolean;
    user: User | null;
    handleClose: () => void;
    onSuccess: (message: string) => void;
}

/**
 * Diálogo unificado para la eliminación de usuarios.
 * Hace uso del gancho useDeleteEntity para disponer de una lógica centralizada de eliminación y gestión de conflictos.
 * 
 * @param props - Propiedades del componente.
 * @param props.open - Indica si el diálogo se encuentra abierto.
 * @param props.user - Objeto de usuario que se desea eliminar.
 * @param props.handleClose - Función delegada para cerrar el diálogo.
 * @param props.onSuccess - Función delegada que se ejecuta tras una eliminación exitosa, recibiendo un mensaje de confirmación.
 * @returns Elemento de React que representa el diálogo de confirmación de eliminación.
 */
const DeleteUserDialog = ({ open, user, handleClose, onSuccess }: DeleteUserDialogProps) => {
    
    const {
        loading,
        checkingConflicts,
        conflicts,
        error,
        handleDelete
    } = useDeleteEntity({
        open,
        conflictsUrl: user ? `/api/users/${user.id}/conflicts` : null,
        deleteUrl: user ? `/api/users/${user.id}` : null,
        onSuccess: (msg) => {
            onSuccess(msg);
            handleClose();
        },
        successMessage: `El usuario "${user?.name}" ha sido eliminado correctamente.`
    });

    const conflictsBySpace = useMemo(() => {
        const grouped: Record<string, ConflictDetail[]> = {};
        if (conflicts && Array.isArray(conflicts.details)) {
            conflicts.details.forEach(d => {
                const space = d.spaceName || 'Espacio Desconocido';
                if (!grouped[space]) grouped[space] = [];
                grouped[space].push(d);
            });
        }
        return grouped;
    }, [conflicts]);

    const hasConflicts = conflicts?.hasConflicts || false;
    const isAdmin = user?.email === 'admin@uniovi.es';

    const conflictContent = isAdmin ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight="bold">
                No es posible eliminar al administrador principal del sistema por motivos de seguridad y estabilidad.
            </Typography>
        </Alert>
    ) : hasConflicts ? (
        <>
            <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                    {conflicts?.conflictCount === 1 
                        ? 'Se ha encontrado 1 reserva activa vinculada.' 
                        : `Se han encontrado ${conflicts?.conflictCount} reservas activas vinculadas.`}
                </Typography>
            </Alert>

            <Paper variant="outlined" sx={{ mb: 3, maxHeight: 300, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 2 }}>
                {Object.entries(conflictsBySpace).map(([spaceName, details]) => (
                    <Accordion key={spaceName} variant="outlined" sx={{ border: 'none', borderBottom: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                                <RoomIcon color="action" sx={{ fontSize: 18 }} />
                                <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', flexGrow: 1 }}>{spaceName}</Typography>
                                <Chip 
                                    label={details.length} 
                                    size="small" 
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.7rem', 
                                        fontWeight: 'bold',
                                        bgcolor: '#fff3e0',
                                        color: '#ef6c00',
                                        minWidth: 24
                                    }} 
                                />
                            </Stack>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                            <List dense disablePadding>
                                {details.map((d, idx) => {
                                    const start = parseApiDate(d.startTime);
                                    const end = parseApiDate(d.endTime);
                                    return (
                                        <ListItem key={d.reservationId} divider={idx < details.length - 1} sx={{ py: 1.5, px: 2 }}>
                                            <ListItemIcon sx={{ minWidth: 32 }}>
                                                <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            </ListItemIcon>
                                            <ListItemText 
                                                primaryTypographyProps={{ component: 'div' }}
                                                secondaryTypographyProps={{ component: 'div' }}
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                                                            {formatDisplayDate(start, 'EEE dd MMM')}
                                                        </Typography>
                                                        <ReservationStatusChip status={d.status} sx={{ height: 18, fontSize: '0.65rem', minWidth: 70 }} />
                                                    </Stack>
                                                }
                                                secondary={
                                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                                        <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                                        <Typography variant="caption" color="textSecondary">
                                                            {formatDisplayDate(start, 'HH:mm')} — {formatDisplayDate(end, 'HH:mm')}
                                                        </Typography>
                                                    </Stack>
                                                }
                                            />
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>

            <Box sx={{ p: 2, bgcolor: '#fffde7', borderRadius: 2, border: '1px solid #fff9c4' }}>
                <Typography variant="body2" color="#5d4037" sx={{ fontSize: '0.85rem' }}>
                    <strong>Acción Automática:</strong> Al confirmar la eliminación, todas las reservas mostradas arriba serán canceladas automáticamente para liberar los espacios.
                </Typography>
            </Box>
        </>
    ) : (
        <Typography variant="body2" color="textSecondary">
            ¿Está seguro de que desea eliminar a este usuario? Esta acción es definitiva desde el punto de vista administrativo.
        </Typography>
    );

    return (
        <DeleteEntityDialog
            open={open}
            title="¿Eliminar Usuario?"
            entityName={user?.name || ''}
            entityTypeLabel="Usuario"
            entityId={user?.email}
            hasConflicts={hasConflicts}
            checkingConflicts={checkingConflicts}
            loading={loading}
            error={error}
            onClose={handleClose}
            onConfirm={handleDelete}
            disabled={isAdmin}
            confirmText={hasConflicts ? "Confirmar y Cancelar Reservas" : "Confirmar Eliminación"}
            auditNote="El usuario no se borrará físicamente para preservar la integridad histórica de sus acciones y registros en el sistema."
        >
            {conflictContent}
        </DeleteEntityDialog>
    );
};

export default DeleteUserDialog;
