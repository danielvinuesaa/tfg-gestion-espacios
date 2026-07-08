import React from 'react';
import {
    Box,
    Typography,
    Drawer,
    Divider,
    Grid,
    Chip,
    Tooltip,
    Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import PeopleIcon from '@mui/icons-material/People';
import type { Role } from '../../../../shared/types';

/**
 * Propiedades del componente {@link RoleDetailsDrawer}.
 */
interface RoleDetailsDrawerProps {
    /** Indica si el panel lateral está desplegado */
    open: boolean;
    /** Objeto de rol a visualizar */
    role: Role | null;
    /** Callback para cerrar el panel */
    onClose: () => void;
}

/**
 * Categorías estáticas para la organización visual de permisos en el Drawer.
 */
const PERMISSION_CATEGORIES = [
    {
        name: 'Espacios',
        permissions: ['LEER_ESPACIOS', 'CREAR_ESPACIOS', 'EDITAR_ESPACIOS', 'ELIMINAR_ESPACIOS'],
        color: '#e3f2fd',
        labelColor: '#1976d2',
        icon: <MeetingRoomIcon fontSize="small" />
    },
    {
        name: 'Reservas',
        permissions: ['VER_TODAS_RESERVAS', 'SOLICITAR_RESERVA', 'APROBAR_RESERVA', 'APROBAR_ASIGNATURAS_GESTIONADAS', 'CANCELAR_RESERVA', 'IMPORTAR_RESERVAS', 'EXPORTAR_RESERVAS'],
        color: '#e8f5e9',
        labelColor: '#2e7d32',
        icon: <EventAvailableIcon fontSize="small" />
    },
    {
        name: 'Gestión de Sistema',
        permissions: ['GESTIONAR_USUARIOS', 'GESTIONAR_ROLES', 'GENERAR_INFORMES'],
        color: '#fff3e0',
        labelColor: '#ed6c02',
        icon: <AdminPanelSettingsIcon fontSize="small" />
    }
];

/**
 * Componente de panel lateral (Drawer) para la visualización detallada de un Rol.
 * Presenta los permisos agrupados por áreas funcionales y detalla el ámbito
 * de gestión (asignaturas) asociado al rol, así como estadísticas de uso.
 * 
 * @param props - Propiedades del componente.
 * @returns Componente JSX que representa el panel de detalles del rol.
 */
const RoleDetailsDrawer: React.FC<RoleDetailsDrawerProps> = ({ open, role, onClose }) => {
    if (!role) return null;

    const permissions = role.permissions || [];
    const permissionNames = role.permissionNames || permissions.map(p => p.name);

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{ sx: { width: { xs: '100%', sm: 450 }, p: 0 } }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Cabecera Informativa */}
                <Box sx={{ p: 3, bgcolor: '#f8f9fa' }}>
                    <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {role.name}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                        {role.description || 'Este rol no tiene una descripción detallada.'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Tooltip title="Usuarios con este rol actualmente en activo" placement="top">
                            <Chip 
                                icon={<PeopleIcon fontSize="small" />} 
                                label={`${role.userCount || 0} ${(role.userCount || 0) === 1 ? 'usuario activo' : 'usuarios activos'}`}
                                size="small"
                                sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold', '& .MuiChip-icon': { color: '#1565c0' } }}
                            />
                        </Tooltip>
                        
                        {role.totalUserCount > (role.userCount || 0) && (
                            <Tooltip title={`Hay ${role.totalUserCount - (role.userCount || 0)} usuario(s) adicional(es) eliminado(s) lógicamente que conservan este rol`} placement="top">
                                <Chip 
                                    label={`+ ${role.totalUserCount - (role.userCount || 0)} eliminados`}
                                    size="small"
                                    sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 'bold', border: '1px solid #ef5350' }}
                                />
                            </Tooltip>
                        )}
                    </Box>
                </Box>
                <Divider />

                {/* Cuerpo Scrolleable */}
                <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InfoIcon fontSize="small" /> Permisos Asignados
                    </Typography>
                    
                    {PERMISSION_CATEGORIES.map(cat => {
                        const permsInCat = permissions.filter(p => cat.permissions.includes(p.name));
                        if (permsInCat.length === 0) return null;

                        return (
                            <Box key={cat.name} sx={{ mb: 4 }}>
                                <Typography variant="subtitle2" sx={{ color: cat.labelColor, fontWeight: 'bold', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {cat.icon}{cat.name}
                                </Typography>
                                <Grid container spacing={1}>
                                    {permsInCat.map(p => (
                                        <Grid item key={p.name}>
                                            <Tooltip title={p.description} arrow placement="top">
                                                <Chip 
                                                    label={p.label} 
                                                    size="small" 
                                                    sx={{ bgcolor: cat.color, color: cat.labelColor, fontWeight: 'bold', fontSize: '0.75rem' }} 
                                                />
                                            </Tooltip>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        );
                    })}

                    {/* Sección de Ámbito de Gestión - Restaurada */}
                    {(permissionNames.includes('APROBAR_ASIGNATURAS_GESTIONADAS') || permissionNames.includes('APROBAR_RESERVA')) && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="subtitle2" sx={{ color: '#673ab7', fontWeight: 'bold', textTransform: 'uppercase', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MenuBookIcon fontSize="small" /> Ámbito de Gestión
                            </Typography>
                            
                            {permissionNames.includes('APROBAR_RESERVA') ? (
                                <Tooltip title="Este rol tiene autoridad para aprobar cualquier reserva en el sistema">
                                    <Chip 
                                        label="Ámbito Global (Todas las asignaturas)" 
                                        color="primary"
                                        variant="filled"
                                        size="small"
                                        sx={{ 
                                            fontWeight: 'bold',
                                            background: 'linear-gradient(45deg, #673ab7 30%, #9c27b0 90%)',
                                            color: 'white',
                                            border: 'none',
                                            px: 1
                                        }} 
                                    />
                                </Tooltip>
                            ) : role.subjects && role.subjects.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {role.subjects.map(subject => (
                                        <Tooltip key={subject.id} title={subject.name}>
                                            <Chip 
                                                label={subject.code} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: '#f3e5f5', 
                                                    color: '#7b1fa2',
                                                    fontWeight: 'bold'
                                                }} 
                                            />
                                        </Tooltip>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', ml: 1 }}>
                                    No hay asignaturas vinculadas a este ámbito.
                                </Typography>
                            )}
                        </Box>
                    )}
                </Box>

                {/* Acciones de Cierre */}
                <Divider />
                <Box sx={{ p: 2, textAlign: 'right', bgcolor: '#f8f9fa' }}>
                    <Button onClick={onClose} variant="outlined">Cerrar</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default RoleDetailsDrawer;
