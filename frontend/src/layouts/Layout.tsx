import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Button, 
    Box, 
    Stack, 
    IconButton, 
    Badge, 
    Menu, 
    MenuItem, 
    Divider, 
    List, 
    ListItemText,
    ListItemIcon,
    Avatar,
    alpha
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import UpdateIcon from '@mui/icons-material/Update';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EventIcon from '@mui/icons-material/Event';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { useNotifications } from '../context/NotificationContext';
import { useNotificationActions } from '../features/notifications/hooks/useNotificationActions';
import type { Notification } from '../features/notifications/types/notification';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { formatDisplayDate, parseApiDate } from '../shared/utils/dateUtils';
import SmartNavGroup, { type NavItem } from './components/SmartNavGroup';
import ChangePasswordDialog from '../features/identity/users/components/ChangePasswordDialog';

/**
 * Componente principal de diseño (Layout) que envuelve las páginas de la aplicación.
 * 
 * Proporciona la estructura base de la interfaz de usuario, incluyendo:
 * - Barra de navegación superior (AppBar) con enlaces dinámicos según los roles y permisos del usuario.
 * - Sistema integrado de notificaciones en tiempo real, accesible desde la barra superior.
 * - Menú de perfil de usuario con opciones de configuración y cierre de sesión.
 * - Contenedor principal donde se renderiza el contenido específico de cada ruta (children).
 *
 * @param props - Propiedades del componente.
 * @param props.children - Elementos JSX que se renderizarán dentro del área principal de contenido del Layout.
 * @returns Elemento JSX que constituye el envoltorio estructural de la aplicación.
 */
const Layout = ({ children }: { children: React.ReactNode }) => {
    const { logout, user, hasPermission } = useAuth();
    const { showSnackbar } = useSnackbar();
    const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotifications();
    const { handleNotificationClick: performNotificationClick } = useNotificationActions();
    const navigate = useNavigate();
    
    // Anchors for menus
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
    
    // Change password dialog state
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const handleLogout = () => {
        logout();
        showSnackbar('Sesión cerrada correctamente');
        navigate('/login');
    };

    const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications(0, 3);
    };

    const handleCloseNotifications = () => {
        setAnchorEl(null);
    };

    const handleOpenProfile = (event: React.MouseEvent<HTMLElement>) => {
        setProfileAnchorEl(event.currentTarget);
    };

    const handleCloseProfile = () => {
        setProfileAnchorEl(null);
    };

    const handleNotificationClick = async (notification: Notification) => {
        handleCloseNotifications();
        await performNotificationClick(notification);
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'RESERVA_CREADA': return { icon: <AddCircleIcon fontSize="small" />, color: '#1a73e8', bg: '#e8f0fe' };
            case 'RESERVA_APROBADA': return { icon: <CheckCircleIcon fontSize="small" />, color: '#1e8e3e', bg: '#e6f4ea' };
            case 'RESERVA_RECHAZADA': return { icon: <CancelIcon fontSize="small" />, color: '#d93025', bg: '#fce8e6' };
            case 'RESERVA_CANCELADA': return { icon: <CancelIcon fontSize="small" />, color: '#70757a', bg: '#f1f3f4' };
            case 'RESERVA_ACTUALIZADA': return { icon: <UpdateIcon fontSize="small" />, color: '#f9ab00', bg: '#fef7e0' };
            default: return { icon: <InfoIcon fontSize="small" />, color: '#1a73e8', bg: '#e8f0fe' };
        }
    };

    // --- Lógica de Navegación Inteligente (Standard UX) ---
    const isAdmin = user?.role === 'ADMIN';
    const canManageReservations = hasPermission('APROBAR_RESERVA') || hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') || hasPermission('CANCELAR_RESERVA');
    
    // Definición de grupos de navegación
    const reservationItems: NavItem[] = useMemo(() => [
        { label: "Calendario", path: "/calendar", icon: <EventIcon fontSize="small" />, visible: hasPermission('VER_TODAS_RESERVAS') },
        { label: "Buscador Inteligente", path: "/search-availability", icon: <SearchIcon fontSize="small" />, visible: hasPermission('SOLICITAR_RESERVA') },
        { 
            label: canManageReservations ? "Gestión de Reservas" : "Mis Reservas", 
            path: "/reservations", 
            icon: <AssignmentIcon fontSize="small" />, 
            visible: canManageReservations || hasPermission('SOLICITAR_RESERVA') 
        }
    ].filter(i => i.visible), [hasPermission, canManageReservations]);

    const adminItems: NavItem[] = useMemo(() => [
        { label: "Espacios", path: "/spaces", icon: <MeetingRoomIcon fontSize="small" />, visible: hasPermission('LEER_ESPACIOS') },
        { label: "Usuarios", path: "/users", icon: <PeopleIcon fontSize="small" />, visible: hasPermission('GESTIONAR_USUARIOS') },
        { label: "Roles y Permisos", path: "/roles", icon: <SecurityIcon fontSize="small" />, visible: hasPermission('GESTIONAR_ROLES') },
        { label: "Historial de Auditoría", path: "/audit-logs", icon: <HistoryIcon fontSize="small" />, visible: isAdmin, divider: true }
    ].filter(i => i.visible), [hasPermission, isAdmin]);

    const reportItems: NavItem[] = useMemo(() => [
        { label: "Informes", path: "/reports", icon: <BarChartIcon fontSize="small" />, visible: hasPermission('GENERAR_INFORMES') }
    ].filter(i => i.visible), [hasPermission]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ px: { md: 4 } }}>
                    <Typography 
                        variant="h6" 
                        component={Link} 
                        to="/"
                        sx={{ 
                            flexGrow: 1, 
                            textDecoration: 'none', 
                            color: 'inherit',
                            fontWeight: 800,
                            letterSpacing: -0.5
                        }}
                    >
                        Gestión de Espacios y Reservas
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mr: 4 }}>
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/"
                            startIcon={<DashboardIcon />}
                            sx={{ fontWeight: 'bold', textTransform: 'none', px: 2, borderRadius: 2 }}
                        >
                            DASHBOARD
                        </Button>

                        <SmartNavGroup label="Informes" items={reportItems} />
                        <SmartNavGroup label="Reservas" items={reservationItems} />
                        <SmartNavGroup label="Administración" items={adminItems} />
                    </Stack>

                    {user && (
                        <>
                            <IconButton color="inherit" onClick={handleOpenNotifications} sx={{ mr: 2 }}>
                                <Badge badgeContent={unreadCount} color="error">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleCloseNotifications}
                                PaperProps={{
                                    elevation: 4,
                                    sx: { 
                                        width: 360, 
                                        maxHeight: 500,
                                        mt: 1.5,
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box sx={{ 
                                    p: 2, 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    bgcolor: '#f8f9fa'
                                }}>
                                    <Typography variant="subtitle1" fontWeight="800">Notificaciones</Typography>
                                    {unreadCount > 0 && (
                                        <Button 
                                            size="small" 
                                            onClick={handleMarkAllRead} 
                                            sx={{ 
                                                textTransform: 'none', 
                                                fontWeight: 'bold',
                                                fontSize: '0.75rem',
                                                '&:hover': { bgcolor: alpha('#1a73e8', 0.04) }
                                            }}
                                        >
                                            Marcar leídas
                                        </Button>
                                    )}
                                </Box>
                                <Divider />
                                <List sx={{ p: 0 }}>
                                    {notifications.length === 0 ? (
                                        <Box sx={{ p: 4, textAlign: 'center' }}>
                                            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1, opacity: 0.5 }} />
                                            <Typography variant="body2" color="text.secondary">No tienes notificaciones</Typography>
                                        </Box>
                                    ) : (
                                        notifications.slice(0, 3).map((n) => {
                                            const iconData = getNotificationIcon(n.type);
                                            return (
                                                <MenuItem 
                                                    key={n.id} 
                                                    onClick={() => handleNotificationClick(n)}
                                                    sx={{ 
                                                        py: 1.5,
                                                        px: 2,
                                                        whiteSpace: 'normal',
                                                        bgcolor: n.read ? 'transparent' : alpha('#1a73e8', 0.04),
                                                        borderBottom: '1px solid',
                                                        borderColor: 'rgba(0,0,0,0.03)',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { 
                                                            bgcolor: alpha('#1a73e8', 0.08),
                                                            transform: 'translateX(4px)'
                                                        },
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 2
                                                    }}
                                                >
                                                    <Avatar sx={{ 
                                                        width: 32, 
                                                        height: 32, 
                                                        bgcolor: iconData.bg, 
                                                        color: iconData.color,
                                                        mt: 0.5
                                                    }}>
                                                        {iconData.icon}
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                fontWeight: n.read ? 500 : 700,
                                                                color: n.read ? 'text.secondary' : 'text.primary',
                                                                lineHeight: 1.3,
                                                                mb: 0.5
                                                            }}
                                                        >
                                                            {n.content}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
                                                            {formatDisplayDate(parseApiDate(n.createdAt), "d 'de' MMM, HH:mm")}
                                                        </Typography>
                                                    </Box>
                                                    {!n.read && (
                                                        <Box sx={{ 
                                                            width: 8, 
                                                            height: 8, 
                                                            borderRadius: '50%', 
                                                            bgcolor: '#1a73e8',
                                                            mt: 1
                                                        }} />
                                                    )}
                                                </MenuItem>
                                            );
                                        })
                                    )}
                                </List>
                                {notifications.length > 0 && (
                                    <>
                                        <Divider />
                                        <Box sx={{ p: 1, display: 'flex', gap: 1 }}>
                                            <Button 
                                                fullWidth 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                                                onClick={() => {
                                                    handleCloseNotifications();
                                                    navigate('/notificaciones');
                                                }}
                                            >
                                                Ver todas
                                            </Button>
                                            <Button 
                                                fullWidth 
                                                size="small" 
                                                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 'bold' }}
                                                onClick={handleCloseNotifications}
                                            >
                                                Cerrar
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Menu>

                            <Box 
                                onClick={handleOpenProfile}
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1.5, 
                                    cursor: 'pointer',
                                    p: 0.5,
                                    px: 1.5,
                                    borderRadius: 2,
                                    transition: '0.2s',
                                    '&:hover': { bgcolor: alpha('#fff', 0.1) }
                                }}
                            >
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        {user.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ display: 'block', lineHeight: 1, opacity: 0.8 }}>
                                        {user.role}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ width: 32, height: 32, bgcolor: alpha('#fff', 0.2), fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </Box>

                            <Menu
                                anchorEl={profileAnchorEl}
                                open={Boolean(profileAnchorEl)}
                                onClose={handleCloseProfile}
                                disableAutoFocusItem
                                PaperProps={{
                                    elevation: 4,
                                    sx: { width: 220, mt: 1.5, borderRadius: 2 }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem onClick={() => { handleCloseProfile(); navigate('/notificaciones'); }}>
                                    <ListItemIcon><NotificationsIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Notificaciones" />
                                </MenuItem>
                                <MenuItem onClick={() => { handleCloseProfile(); setPasswordDialogOpen(true); }}>
                                    <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText primary="Cambiar Contraseña" />
                                </MenuItem>
                                <Divider />
                                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                    <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                                    <ListItemText primary="Cerrar Sesión" />
                                </MenuItem>
                            </Menu>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Box component="main" sx={{ p: 3 }}>
                {children}
            </Box>
            
            <ChangePasswordDialog 
                open={passwordDialogOpen} 
                onClose={() => setPasswordDialogOpen(false)} 
            />
        </Box>
    );
};

export default Layout;
