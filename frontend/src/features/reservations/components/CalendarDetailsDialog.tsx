import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Box, 
    Typography, Chip, Button, Stack, Divider, IconButton,
    Grid, Paper, Tooltip, Alert, CircularProgress
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import { formatDisplayDate, parseApiDate } from '../../../shared/utils/dateUtils';
import { getSpaceColors } from '../../../theme/reservationTheme';
import type { Reservation } from '../../../shared/types';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReservationStatusChip from '../../../shared/components/Chips/ReservationStatusChip';
import ReservationTypeChip from '../../../shared/components/Chips/ReservationTypeChip';

/**
 * Propiedades del componente CalendarDetailsDialog.
 */
interface CalendarDetailsDialogProps {
    open: boolean;
    onClose: () => void;
    /** ID de la reserva a cargar */
    reservationId?: number | null;
    /** Objeto de reserva opcional (si ya está cargado) */
    reservation?: Reservation | null;
    /** Si el usuario actual tiene permisos para editar esta reserva */
    canEdit: boolean;
    /** Si el usuario actual tiene permisos para cancelar esta reserva */
    canDelete: boolean;
    /** Si el usuario tiene permisos administrativos de aprobación */
    canApproveReject: boolean;
    onEdit: (resId: number) => void;
    onDelete: (resId: number) => void;
    onApprove: (res: Reservation) => void;
    onReject: (resId: number) => void;
    }

    /**
     * Diálogo avanzado para la visualización detallada de la información de reservas y bloqueos en el sistema.
     * 
     * Este componente muestra de manera estructurada los metadatos y estado de una reserva. 
     * Está diseñado para poder instanciarse aportando directamente la entidad o proveyendo 
     * únicamente el identificador (resolviendo asíncronamente sus datos desde la API).
     * 
     * Incorpora capacidades operativas delegadas según los permisos suministrados por contexto, 
     * permitiendo ejecutar flujos de aprobación, rechazo, edición o cancelación directamente desde la vista.
     * 
     * @param props - Propiedades y callbacks para interactuar con la reserva visualizada.
     * @param props.open - Indicador de visibilidad del diálogo modal.
     * @param props.onClose - Callback accionado para cerrar la vista actual.
     * @param props.reservationId - Identificador numérico de la reserva; utilizado para la carga bajo demanda si no se proporciona `reservation`.
     * @param props.reservation - Objeto de reserva completamente instanciado, inyectado directamente para evitar llamadas a red.
     * @param props.canEdit - Permiso otorgado para la modificación de la reserva.
     * @param props.canDelete - Permiso otorgado para la cancelación o eliminación de la reserva o bloqueo.
     * @param props.canApproveReject - Permiso administrativo que habilita las opciones de aprobación o rechazo.
     * @param props.onEdit - Callback accionado cuando el usuario decide editar la reserva.
     * @param props.onDelete - Callback accionado cuando el usuario solicita eliminar o cancelar el recurso.
     * @param props.onApprove - Callback accionado al conceder la aprobación a la reserva.
     * @param props.onReject - Callback accionado para rechazar una solicitud pendiente.
     * @returns Modal detallado mostrando la información y comandos contextuales para la entidad reserva.
     */
    const CalendarDetailsDialog = ({ 
    open, onClose, reservationId, reservation: initialRes, canEdit, canDelete, canApproveReject, 
    onEdit, onDelete, onApprove, onReject 
    }: CalendarDetailsDialogProps) => {

    const { request } = useApi();

    // Cargamos los datos de la reserva si solo tenemos el ID
    const { data: fetchedRes, isLoading } = useQuery<Reservation>({
        queryKey: ['/api/reservations', reservationId],
        queryFn: () => request(`/api/reservations/${reservationId}`),
        enabled: open && !!reservationId && !initialRes,
        staleTime: 5 * 60 * 1000
    });

    const res = initialRes || fetchedRes;

    if (!open) return null;

    if (isLoading && !res) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
                <DialogContent sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography color="text.secondary">Cargando detalles de la reserva...</Typography>
                </DialogContent>
            </Dialog>
        );
    }

    if (!res || !res.startTime || !res.endTime) return null;

    const isBlock = res.status === 'BLOQUEO';
    const statusColors: Record<string, { main: string, light: string }> = {
        'APROBADA': { main: '#2e7d32', light: '#e8f5e9' },
        'SOLICITADA': { main: '#1565c0', light: '#e3f2fd' },
        'BLOQUEO': { main: '#455a64', light: '#f0f4f8' },
        'RECHAZADA': { main: '#c62828', light: '#ffebee' },
        'CANCELADA': { main: '#9e9e9e', light: '#fafafa' }
    };

    const colors = statusColors[res.status] || { main: '#616161', light: '#f5f5f5' };
    const totalCapacity = res.spaces?.reduce((acc, s) => acc + s.totalCapacity, 0) || 0;
    const start = parseApiDate(res.startTime);
    const end = parseApiDate(res.endTime);

    return (
        <Dialog 
            open={open} onClose={onClose} maxWidth="sm" fullWidth
            data-testid="calendar-details-dialog"
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
        >
            <DialogTitle sx={{ 
                m: 0, p: 2, bgcolor: colors.light, color: colors.main,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold'
            }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {isBlock ? <InfoIcon /> : <CalendarTodayIcon />}
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {isBlock ? 'Detalles del Bloqueo' : (res.title || 'Detalles de la Reserva')}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ color: colors.main }}><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, mt: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                        <ReservationStatusChip status={res.status} />
                        <ReservationTypeChip type={res.type} />
                        <Typography variant="caption" color="text.secondary">
                            Creada el {formatDisplayDate(res.createdAt, 'dd/MM/yyyy HH:mm')}
                        </Typography>
                    </Stack>

                    <Grid container spacing={3}>
                        {!isBlock && res.subject && (
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <MenuBookIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Asignatura</Typography>
                                        <Typography variant="body1" fontWeight="medium">
                                            {res.subject.code} - {res.subject.name} ({res.subject.course})
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <ApartmentIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Espacios Vinculados</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                        {res.spaces?.map((s) => {
                                            const isSpaceEliminado = s.status === 'ELIMINADO';
                                            return (
                                                <Stack key={s.id} direction="row" spacing={0.5} alignItems="center">
                                                    <Chip 
                                                        label={isSpaceEliminado ? `${s.name} (Eliminado)` : s.name} 
                                                        size="small" 
                                                        sx={{ 
                                                            bgcolor: isSpaceEliminado ? '#f1f3f4' : getSpaceColors(s.type).bg, 
                                                            color: isSpaceEliminado ? '#70757a' : getSpaceColors(s.type).text, 
                                                            fontWeight: 'bold',
                                                            textDecoration: isSpaceEliminado ? 'line-through' : 'none',
                                                            opacity: isSpaceEliminado ? 0.8 : 1
                                                        }} 
                                                    />
                                                    {s.gisId && !isSpaceEliminado && (
                                                        <Tooltip title="Ver ubicación en GIS Uniovi">
                                                            <IconButton size="small" sx={{ color: 'secondary.main', p: 0.2 }} onClick={() => window.open(`https://gis.uniovi.es/GISUniovi/MostrarDetalle.do?tipoDetalle=dEstancia&idDetalle=${s.gisId}`, '_blank')}>
                                                                <MapIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Stack>
                                            );
                                        })}
                                    </Box>
                                    {!isBlock && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
                                            <GroupIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary">Capacidad total: {totalCapacity} personas</Typography>
                                        </Stack>
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <AccessTimeIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Horario</Typography>
                                    {formatDisplayDate(start, 'yyyy-MM-dd') === formatDisplayDate(end, 'yyyy-MM-dd') ? (
                                        <>
                                            <Typography variant="body1" fontWeight="medium">{formatDisplayDate(start, 'HH:mm')} - {formatDisplayDate(end, 'HH:mm')}</Typography>
                                            <Typography variant="body2" color="text.secondary">{formatDisplayDate(start, 'EEEE, dd MMMM yyyy')}</Typography>
                                        </>
                                    ) : (
                                        <>
                                            <Typography variant="body1" fontWeight="medium">
                                                Desde: {formatDisplayDate(start, 'dd/MM/yy HH:mm')}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                Hasta: {formatDisplayDate(end, 'dd/MM/yy HH:mm')}
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <PersonIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>{isBlock ? 'Bloqueado por' : 'Solicitado por'}</Typography>
                                    <Typography variant="body1" fontWeight="medium">{res.user.name}</Typography>
                                    {!isBlock && <Typography variant="caption" color="text.secondary">{res.responsibleName && res.responsibleName !== res.user.name ? 'Gestor de la reserva' : 'Usuario solicitante'}</Typography>}
                                </Box>
                            </Box>
                        </Grid>

                        {!isBlock && (
                            <Grid item xs={12} sm={6}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <GroupIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Responsable Actividad</Typography>
                                        <Typography variant="body1" fontWeight="medium" color="primary.main">{res.responsibleName || res.user.name}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <InfoIcon sx={{ color: 'action.active', mt: 0.5 }} />
                                <Box sx={{ width: '100%' }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        {isBlock ? 'Motivo del bloqueo' : 'Descripción de la actividad'}
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f9fafb', borderStyle: 'dashed' }}>
                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {res.description || (isBlock ? 'No se ha especificado un motivo.' : 'No se ha especificado una descripción.')}
                                        </Typography>
                                    </Paper>
                                </Box>
                            </Box>
                        </Grid>

                        {res.status === 'RECHAZADA' && res.rejectionReason && (
                            <Grid item xs={12}>
                                <Alert severity="error" icon={<CloseIcon />} sx={{ borderRadius: 2 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">Reserva Rechazada</Typography>
                                    <Typography variant="body2">{res.rejectionReason}</Typography>
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa', gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
                <Box sx={{ flexGrow: 1 }} />
                
                {canApproveReject && res.status === 'SOLICITADA' && (
                    <>
                        <Button onClick={() => onReject(res.id)} variant="outlined" color="error">Rechazar</Button>
                        <Button onClick={() => onApprove(res)} variant="contained" color="success">Aprobar</Button>
                    </>
                )}

                {canEdit && (res.status !== 'CANCELADA' && res.status !== 'RECHAZADA') && (
                    <Button onClick={() => onEdit(res.id)} variant="outlined" color="primary">
                        {isBlock ? 'Editar Bloqueo' : 'Editar Reserva'}
                    </Button>
                )}
                {canDelete && (res.status !== 'CANCELADA' && res.status !== 'RECHAZADA') && (
                    <Button 
                        onClick={() => onDelete(res.id)} 
                        color="error" 
                        variant="contained"
                    >
                        {isBlock ? 'Eliminar Bloqueo' : 'Cancelar Reserva'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CalendarDetailsDialog;
