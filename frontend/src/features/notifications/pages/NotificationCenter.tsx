import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    List,
    ListItem,
    Avatar,
    Button,
    Divider,
    Stack,
    Chip,
    IconButton,
    Tooltip,
    TablePagination,
    CircularProgress,
    alpha,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tabs,
    Tab
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EmptyState from '../../../shared/components/EmptyState';
import { useNotifications } from '../../../context/NotificationContext';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useAuth } from '../../../context/AuthContext';
import { useApi } from '../../../shared/utils/api';
import { useNotificationActions } from '../hooks/useNotificationActions';
import type { Notification } from '../../../shared/types';
import NotificationPreferences from '../components/NotificationPreferences';
import CalendarDetailsDialog from '../../reservations/components/CalendarDetailsDialog';
import { formatDisplayDate, parseApiDate } from '../../../shared/utils/dateUtils';
import { useQuery } from '@tanstack/react-query';

/**
 * Componente principal que representa el Centro de Notificaciones de la aplicación.
 * Muestra el historial completo de notificaciones paginadas del usuario, proporciona accesos directos
 * a las reservas vinculadas y gestiona la visualización de la pestaña de preferencias.
 *
 * @returns Elemento de React que engloba la interfaz del centro de notificaciones.
 */
const NotificationCenter = () => {
    const { 
        markAllAsRead, 
        deleteNotification,
        clearAllNotifications,
        unreadCount
    } = useNotifications();

    const { handleNotificationClick: performNotificationClick } = useNotificationActions();
    
    const { token } = useAuth();
    const { request } = useApi();
    const { showSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openConfirmClear, setOpenConfirmClear] = useState(false);
    const [tabIndex, setTabIndex] = useState(0);

    // Estado para el diálogo de detalles de reserva (rechazadas)
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const notificationsQuery = useQuery({
        queryKey: ['/api/notifications', { page, size: rowsPerPage }],
        queryFn: () => request(`/api/notifications?page=${page}&size=${rowsPerPage}&sort=createdAt,desc`),
        enabled: tabIndex === 0 && !!token,
        refetchInterval: 30000,
        staleTime: 5000,
    });

    const displayNotifications = notificationsQuery.data?.content || [];
    const displayTotal = notificationsQuery.data?.totalElements || 0;
    const isFetching = notificationsQuery.isLoading || notificationsQuery.isFetching;

    // Lógica para abrir automáticamente si viene de un parámetro URL
    useEffect(() => {
        const openId = searchParams.get('openReservationId');
        if (openId && token) {
            fetchReservationDetails(parseInt(openId));
            // Limpiar el parámetro para que no se reabra al recargar
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('openReservationId');
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, token]);

    const handleChangePage = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleMarkAll = async () => {
        await markAllAsRead();
        showSnackbar('Todas las notificaciones marcadas como leídas');
    };

    const handleClearAll = async () => {
        await clearAllNotifications();
        setOpenConfirmClear(false);
        showSnackbar('Historial de notificaciones vaciado correctamente');
    };

    const handleTabChange = (_: any, newValue: number) => {
        setTabIndex(newValue);
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        await deleteNotification(id);
        showSnackbar('Notificación eliminada');
    };

    const handleItemClick = async (notification: Notification) => {
        await performNotificationClick(
            notification, 
            (data) => {
                setSelectedReservation(data);
                setDetailsOpen(true);
            },
            setLoadingDetails
        );
    };

    const fetchReservationDetails = async (id: number) => {
        setLoadingDetails(true);
        try {
            const data = await request(`/api/reservations/${id}`);
            setSelectedReservation(data);
            setDetailsOpen(true);
        } catch (err) {
            // Error gestionado por useApi
        } finally {
            setLoadingDetails(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'RESERVA_CREADA': return { icon: <AddCircleIcon />, color: '#1a73e8', bg: '#e8f0fe' };
            case 'RESERVA_APROBADA': return { icon: <CheckCircleIcon />, color: '#1e8e3e', bg: '#e6f4ea' };
            case 'RESERVA_RECHAZADA': return { icon: <CancelIcon />, color: '#d93025', bg: '#fce8e6' };
            case 'RESERVA_CANCELADA': return { icon: <CancelIcon />, color: '#70757a', bg: '#f1f3f4' };
            case 'RESERVA_ACTUALIZADA': return { icon: <UpdateIcon />, color: '#f9ab00', bg: '#fef7e0' };
            default: return { icon: <InfoIcon />, color: '#1a73e8', bg: '#e8f0fe' };
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #eee' }}>
                {/* Cabecera y Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8f9fa' }}>
                    <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="h5" fontWeight="800">Notificaciones</Typography>
                            {unreadCount > 0 && tabIndex === 0 && (
                                <Chip 
                                    label={`${unreadCount} nuevas`} 
                                    size="small" 
                                    color="primary" 
                                    sx={{ fontWeight: 'bold', borderRadius: 1.5 }} 
                                />
                            )}
                        </Stack>
                        
                        {tabIndex === 0 && (
                            <Stack direction="row" spacing={2}>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<DoneAllIcon />}
                                    onClick={handleMarkAll}
                                    disabled={unreadCount === 0}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    Marcar leídas
                                </Button>
                                <Button 
                                    variant="contained" 
                                    size="small" 
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => setOpenConfirmClear(true)}
                                    disabled={displayTotal === 0}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    Vaciar historial
                                </Button>
                            </Stack>
                        )}
                    </Box>
                    <Tabs 
                        value={tabIndex} 
                        onChange={handleTabChange} 
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{ px: 3 }}
                    >
                        <Tab 
                            icon={<ListAltIcon fontSize="small" />} 
                            iconPosition="start" 
                            label="Historial" 
                            sx={{ textTransform: 'none', fontWeight: 'bold', minHeight: 48 }} 
                        />
                        <Tab 
                            icon={<SettingsIcon fontSize="small" />} 
                            iconPosition="start" 
                            label="Preferencias" 
                            sx={{ textTransform: 'none', fontWeight: 'bold', minHeight: 48 }} 
                        />
                    </Tabs>
                </Box>

                {/* Contenido Dinámico */}
                <Box>
                    {tabIndex === 0 ? (
                        /* Lista de Notificaciones */
                        <Box sx={{ position: 'relative' }}>
                            {isFetching && displayNotifications.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                    <CircularProgress size={40} />
                                </Box>
                            ) : displayNotifications.length === 0 ? (
                                <EmptyState 
                                    icon={<NotificationsNoneIcon />}
                                    title="No tienes notificaciones"
                                    description="Te avisaremos cuando haya novedades sobre tus reservas o cambios en el sistema."
                                    sx={{ border: 'none', bgcolor: 'transparent', p: 10 }}
                                />
                            ) : (
                                <>
                                    <List sx={{ p: 0 }}>
                                        {displayNotifications.map((n: Notification, index: number) => {
                                            const iconData = getNotificationIcon(n.type);
                                            return (
                                                <Box key={n.id}>
                                                    <ListItem 
                                                        onClick={() => handleItemClick(n)}
                                                        sx={{ 
                                                            p: 3,
                                                            cursor: 'pointer',
                                                            bgcolor: n.read ? 'transparent' : alpha('#1a73e8', 0.03),
                                                            transition: 'all 0.2s',
                                                            '&:hover': { 
                                                                bgcolor: alpha('#1a73e8', 0.07),
                                                                transform: 'translateX(4px)',
                                                                '& .delete-btn': { opacity: 1 }
                                                            },
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 3,
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <Avatar sx={{ 
                                                            width: 48, 
                                                            height: 48, 
                                                            bgcolor: iconData.bg, 
                                                            color: iconData.color,
                                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                                                        }}>
                                                            {iconData.icon}
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1, pr: 4 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                <Typography 
                                                                    variant="subtitle1" 
                                                                    sx={{ 
                                                                        fontWeight: n.read ? 600 : 800,
                                                                        color: n.read ? 'text.secondary' : 'text.primary',
                                                                        lineHeight: 1.4
                                                                    }}
                                                                >
                                                                    {n.content}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, ml: 2, whiteSpace: 'nowrap' }}>
                                                                    {formatDisplayDate(parseApiDate(n.createdAt), "d 'de' MMMM, HH:mm")}
                                                                </Typography>
                                                            </Box>
                                                            <Stack direction="row" spacing={1} alignItems="center">
                                                                <Chip 
                                                                    label={n.type.replace('_', ' ')} 
                                                                    size="small" 
                                                                    variant="outlined"
                                                                    sx={{ 
                                                                        fontSize: '0.65rem', 
                                                                        height: 20, 
                                                                        fontWeight: 'bold',
                                                                        color: iconData.color,
                                                                        borderColor: alpha(iconData.color, 0.3)
                                                                    }} 
                                                                />
                                                                {!n.read && (
                                                                    <Chip 
                                                                        label="Nueva" 
                                                                        size="small" 
                                                                        sx={{ 
                                                                            fontSize: '0.65rem', 
                                                                            height: 20, 
                                                                            fontWeight: 'bold',
                                                                            bgcolor: '#1a73e8',
                                                                            color: 'white'
                                                                        }} 
                                                                    />
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                        
                                                        {/* Botón de Borrado Individual */}
                                                        <Tooltip title="Eliminar">
                                                            <IconButton 
                                                                className="delete-btn"
                                                                onClick={(e) => handleDelete(e, n.id)}
                                                                size="small"
                                                                sx={{ 
                                                                    position: 'absolute', 
                                                                    right: 16, 
                                                                    top: '50%', 
                                                                    transform: 'translateY(-50%)',
                                                                    opacity: 0,
                                                                    transition: 'opacity 0.2s',
                                                                    color: 'text.disabled',
                                                                    '&:hover': { color: 'error.main', bgcolor: alpha('#d32f2f', 0.05) }
                                                                }}
                                                            >
                                                                <DeleteIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </ListItem>
                                                    {index < displayNotifications.length - 1 && <Divider />}
                                                </Box>
                                            );
                                        })}
                                    </List>
                                    <TablePagination
                                        rowsPerPageOptions={[5, 10, 25]}
                                        component="div"
                                        count={displayTotal}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                        labelRowsPerPage="Filas por página:"
                                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                                        sx={{ borderTop: '1px solid #eee' }}
                                    />
                                </>
                            )}
                        </Box>
                    ) : (
                        /* Pestaña de Preferencias */
                        <NotificationPreferences />
                    )}
                </Box>
            </Paper>

            {/* Diálogo de Confirmación de Borrado Masivo con Estilo App */}
            <Dialog 
                open={openConfirmClear} 
                onClose={() => setOpenConfirmClear(false)} 
                maxWidth="xs" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    bgcolor: '#fff5f5', 
                    color: '#d32f2f', 
                    fontWeight: 'bold' 
                }}>
                    <WarningAmberIcon /> ¿Vaciar historial?
                </DialogTitle>
                <Divider />
                <DialogContent sx={{ mt: 2 }}>
                    <Typography variant="body1">
                        Esta acción eliminará <strong>permanentemente</strong> todas tus notificaciones. No se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #eee' }}>
                    <Button onClick={() => setOpenConfirmClear(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleClearAll} 
                        variant="contained" 
                        color="error"
                        startIcon={<DeleteForeverIcon />}
                        sx={{ fontWeight: 'bold', borderRadius: 2 }}
                    >
                        Confirmar y vaciar todo
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de detalles de reserva (para rechazadas o canceladas) */}
            {selectedReservation && (
                <CalendarDetailsDialog
                    open={detailsOpen}
                    onClose={() => setDetailsOpen(false)}
                    reservation={selectedReservation}
                    canEdit={false}
                    canDelete={false}
                    canApproveReject={false}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onApprove={() => {}}
                    onReject={() => {}}
                />
            )}

            {/* Overlay de carga para detalles */}
            {loadingDetails && (
                <Box sx={{ 
                    position: 'fixed', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    bgcolor: 'rgba(255,255,255,0.5)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 2000 
                }}>
                    <CircularProgress />
                </Box>
            )}
        </Container>
    );
};

export default NotificationCenter;
