import { useMemo, useState } from 'react';
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
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    CircularProgress
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import RoomIcon from '@mui/icons-material/Room';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BlockIcon from '@mui/icons-material/Block';
import { parseApiDate, formatDisplayDate } from '../../../../shared/utils/dateUtils';
import type { User } from '../../../../shared/types';
import type { ConflictDetail, EntityConflictResponse as ConflictSummary } from '../../../../features/spaces/types/conflicts';
import { useApi } from '../../../../shared/utils/api';
import { useQuery } from '@tanstack/react-query';
import ReservationStatusChip from '../../../../shared/components/Chips/ReservationStatusChip';

/**
 * Propiedades del componente BlockUserDialog.
 */
interface BlockUserDialogProps {
    open: boolean;
    user: User | null;
    handleClose: () => void;
    onConfirm: (user: User, force: boolean) => Promise<void>;
}

/**
 * Diálogo interactivo para bloquear usuarios con validación de conflictos.
 * Muestra las reservas activas que se verán afectadas y permite su cancelación automática.
 *
 * @param props - Propiedades del componente.
 * @param props.open - Indica si el diálogo se encuentra abierto.
 * @param props.user - Objeto de usuario que se desea bloquear.
 * @param props.handleClose - Función delegada para cerrar el diálogo.
 * @param props.onConfirm - Función asíncrona delegada que procesa la acción de bloqueo.
 * @returns Elemento de React que representa el diálogo de confirmación de bloqueo.
 */
const BlockUserDialog = ({ open, user, handleClose, onConfirm }: BlockUserDialogProps) => {
    const { request } = useApi();
    const [loading, setLoading] = useState(false);

    // Consultamos conflictos (reservas activas)
    const { data: conflicts, isLoading: checkingConflicts } = useQuery<ConflictSummary>({
        queryKey: ['/api/users/conflicts', user?.id],
        queryFn: () => request(`/api/users/${user?.id}/conflicts`),
        enabled: open && !!user?.id,
        staleTime: 0
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

    const handleConfirmAction = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await onConfirm(user, hasConflicts);
            handleClose();
        } catch (error) {
            // Error gestionado por el llamador
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#fff3e0', color: '#e65100', fontWeight: 'bold' }}>
                <BlockIcon /> ¿Bloquear Acceso al Usuario?
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body1" gutterBottom>
                    Vas a suspender el acceso de <strong>{user.name}</strong> ({user.email}).
                </Typography>
                
                {checkingConflicts ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                        <CircularProgress size={20} />
                        <Typography variant="body2" color="textSecondary">Comprobando reservas activas...</Typography>
                    </Box>
                ) : hasConflicts ? (
                    <>
                        <Alert severity="warning" icon={<WarningAmberIcon fontSize="small" />} sx={{ mb: 2, mt: 1, borderRadius: 2 }}>
                            <Typography variant="body2" fontWeight="bold">
                                {conflicts?.conflictCount === 1 
                                    ? 'Este usuario tiene 1 reserva activa vinculada.' 
                                    : `Este usuario tiene ${conflicts?.conflictCount} reservas activas vinculadas.`}
                            </Typography>
                        </Alert>

                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1, ml: 0.5 }}>
                            Reservas que serán canceladas automáticamente:
                        </Typography>

                        <Paper variant="outlined" sx={{ mb: 3, maxHeight: 250, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 2 }}>
                            {Object.entries(conflictsBySpace).map(([spaceName, details]) => (
                                <Accordion key={spaceName} variant="outlined" sx={{ border: 'none', borderBottom: '1px solid rgba(0,0,0,0.1)', borderRadius: 0 }}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                                            <RoomIcon color="action" sx={{ fontSize: 18 }} />
                                            <Typography sx={{ fontWeight: 'bold', fontSize: '0.85rem', flexGrow: 1 }}>{spaceName}</Typography>
                                            <Chip label={details.length} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }} />
                                        </Stack>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ p: 0, bgcolor: 'white' }}>
                                        <List dense disablePadding>
                                            {details.map((d, idx) => {
                                                const start = parseApiDate(d.startTime);
                                                const end = parseApiDate(d.endTime);
                                                return (
                                                    <ListItem key={d.reservationId} divider={idx < details.length - 1} sx={{ py: 1, px: 2 }}>
                                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                                            <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                        </ListItemIcon>
                                                        <ListItemText 
                                                            primaryTypographyProps={{ component: 'div' }}
                                                            primary={
                                                                <Stack direction="row" spacing={1} alignItems="center">
                                                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                                        {formatDisplayDate(start, 'EEE dd MMM')}
                                                                    </Typography>
                                                                    <ReservationStatusChip status={d.status} sx={{ height: 16, fontSize: '0.6rem' }} />
                                                                </Stack>
                                                            }
                                                            secondary={`${formatDisplayDate(start, 'HH:mm')} — ${formatDisplayDate(end, 'HH:mm')}`}
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Paper>
                        <Typography variant="caption" color="error" sx={{ fontWeight: 'bold', display: 'block', mb: 2 }}>
                            Nota: Al bloquear al usuario, todas estas reservas se cancelarán automáticamente para liberar los espacios.
                        </Typography>
                    </>
                ) : (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                        El usuario no tiene reservas activas. Su acceso será suspendido inmediatamente.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
                <Button onClick={handleClose} color="inherit" disabled={loading}>Cancelar</Button>
                <Button 
                    onClick={handleConfirmAction} 
                    variant="contained" 
                    color="warning"
                    disabled={loading || checkingConflicts}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <BlockIcon />}
                >
                    {loading ? 'Bloqueando...' : hasConflicts ? 'Bloquear y Cancelar Reservas' : 'Confirmar Bloqueo'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BlockUserDialog;
