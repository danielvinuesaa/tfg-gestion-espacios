import { useState, useMemo } from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Stack, Tabs, Tab, Chip, Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../../context/AuthContext';
import { ACTION_CONFIG, AUDIT_CATEGORIES } from '../constants/auditConstants';
import type { AuditCategory } from '../constants/auditConstants';

/**
 * Propiedades del componente RecentActivity.
 */
interface RecentActivityProps {
    activities: Array<{
        id: string;
        action: string;
        performedBy: string;
        timestamp: string;
        details: string;
    }>;
    isDashboard?: boolean;
}

/**
 * Componente que muestra el listado de actividades recientes registradas en el sistema.
 * Permite filtrar de forma interactiva por categorías (Reservas, Espacios, Usuarios, etc.) y muestra un formato visual 
 * claro utilizando avatares, códigos de color e iconos para cada tipo de acción.
 *
 * @param props - Propiedades del componente.
 * @param props.activities - Colección de registros de auditoría recientes.
 * @param props.isDashboard - Indica si el componente se renderiza en el Dashboard para ajustar altura y botón.
 * @returns Elemento de React que visualiza el registro de eventos.
 */
const RecentActivity = ({ activities = [], isDashboard = false }: RecentActivityProps) => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState<AuditCategory | 'ALL'>('ALL');

    const handleTabChange = (_event: React.SyntheticEvent, newValue: AuditCategory | 'ALL') => {
        setTabValue(newValue);
    };

    const filteredActivities = useMemo(() => {
        if (tabValue === 'ALL') return activities;
        return activities.filter(activity => {
            const config = ACTION_CONFIG[activity.action];
            return config && config.category === tabValue;
        });
    }, [activities, tabValue]);

    const counts = useMemo(() => {
        const c: Record<string, number> = { ALL: activities.length };
        Object.keys(AUDIT_CATEGORIES).forEach(cat => { c[cat] = 0; });
        
        activities.forEach(a => {
            const cat = ACTION_CONFIG[a.action]?.category;
            if (cat) c[cat] = (c[cat] || 0) + 1;
        });
        return c;
    }, [activities]);

    return (
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
            <Stack 
                direction={{ xs: 'column', lg: 'row' }} 
                justifyContent="space-between" 
                alignItems={{ xs: 'flex-start', lg: 'center' }} 
                mb={3} 
                spacing={2}
            >
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ display: 'flex', p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <HistoryIcon color="primary" />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Registro de Eventos
                    </Typography>
                </Stack>
                {isDashboard && user?.role === 'ADMIN' && (
                    <Button 
                        component={Link} 
                        to="/audit-logs" 
                        size="small" 
                        endIcon={<ArrowForwardIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Ver historial completo
                    </Button>
                )}
                
                <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ 
                        minHeight: 48,
                        '& .MuiTab-root': { 
                            minHeight: 48, 
                            textTransform: 'none', 
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            px: 2
                        } 
                    }}
                >
                    <Tab 
                        label={
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <span>Todos</span>
                                <Chip label={counts.ALL} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                            </Stack>
                        } 
                        value="ALL" 
                    />
                    {(Object.entries(AUDIT_CATEGORIES) as [AuditCategory, typeof AUDIT_CATEGORIES['RESERVAS']][]).map(([key, cat]) => (
                        <Tab 
                            key={key}
                            label={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>{cat.label}</span>
                                    {counts[key] > 0 && (
                                        <Chip 
                                            label={counts[key]} 
                                            size="small" 
                                            variant={tabValue === key ? "filled" : "outlined"}
                                            color={tabValue === key ? "primary" : "default"}
                                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} 
                                        />
                                    )}
                                </Stack>
                            } 
                            value={key} 
                        />
                    ))}
                </Tabs>
            </Stack>
            
            <List disablePadding sx={isDashboard ? { maxHeight: 420, overflowY: 'auto', pr: 1 } : {}}>
                {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => {
                        const config = ACTION_CONFIG[activity.action] || { 
                            label: activity.action, 
                            color: '#94a3b8', 
                            icon: HistoryIcon 
                        };
                        const Icon = config.icon;
                        const date = parseISO(activity.timestamp);

                        return (
                            <ListItem 
                                key={activity.id} 
                                divider={index !== filteredActivities.length - 1}
                                sx={{ px: 0, py: 1.5 }}
                            >
                                <ListItemAvatar sx={{ minWidth: 56 }}>
                                    <Avatar sx={{ 
                                        bgcolor: `${config.color}12`, 
                                        color: config.color, 
                                        width: 40, 
                                        height: 40,
                                        border: `1px solid ${config.color}20`
                                    }}>
                                        <Icon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primaryTypographyProps={{ component: 'div' }}
                                    primary={
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight="bold" color="text.primary">
                                                {config.label}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                                {formatDistanceToNow(date, { addSuffix: true, locale: es })}
                                            </Typography>
                                        </Stack>
                                    }
                                    secondary={
                                        <Typography 
                                            variant="caption" 
                                            component="span"
                                            sx={{ mt: 0.5, color: 'text.secondary', display: 'block', lineHeight: 1.4 }}
                                        >
                                            <Box component="span" sx={{ fontWeight: 600, color: 'primary.main', mr: 0.5 }}>
                                                {activity.performedBy}
                                            </Box>
                                            {activity.details}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        );
                    })
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <HistoryIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1, opacity: 0.5 }} />
                        <Typography color="text.secondary" variant="body2" fontWeight="medium">
                            No hay eventos para la categoría {tabValue !== 'ALL' ? AUDIT_CATEGORIES[tabValue as AuditCategory].label.toLowerCase() : ''}
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default RecentActivity;
