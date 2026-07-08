import { Paper, Typography, Box, List, ListItem, ListItemText, ListItemAvatar, Avatar, Stack, Button } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from 'react-router-dom';
import ReservationStatusChip from '../../../shared/components/Chips/ReservationStatusChip';
import { useAuth } from '../../../context/AuthContext';

/**
 * Propiedades del componente UpcomingEvents.
 */
interface UpcomingEventsProps {
    events: Array<{
        id: number;
        title: string;
        startTime: string;
        endTime: string;
        status: string;
        spaces: Array<{ name: string }>;
        subject?: { name: string };
    }>;
}

/**
 * Componente destinado a visualizar la lista de próximos eventos y reservas en el panel principal (dashboard).
 * Proporciona un listado resumido y ordenado cronológicamente con información clave como hora, estado y espacios vinculados.
 *
 * @param props - Propiedades del componente.
 * @param props.events - Conjunto de próximos eventos a mostrar.
 * @returns Elemento de React que engloba la tarjeta de eventos.
 */
const UpcomingEvents = ({ events = [] }: UpcomingEventsProps) => {
    const { hasPermission } = useAuth();
    
    const formatDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return 'Hoy';
        if (isTomorrow(date)) return 'Mañana';
        return format(date, "d 'de' MMM", { locale: es });
    };

    return (
        <Paper sx={{ p: 3, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ display: 'flex', p: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
                        <EventIcon />
                    </Box>
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                        Próximas Reservas
                    </Typography>
                </Stack>
                {hasPermission('VER_TODAS_RESERVAS') && (
                    <Button 
                        component={Link} 
                        to="/calendar" 
                        size="small" 
                        endIcon={<ArrowForwardIcon />}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Ver todo
                    </Button>
                )}
            </Stack>

            <List disablePadding>
                {events.length > 0 ? (
                    events.map((event, index) => {
                        const start = parseISO(event.startTime);
                        
                        return (
                            <ListItem 
                                key={event.id} 
                                divider={index !== events.length - 1}
                                sx={{ px: 0, py: 1.5 }}
                            >
                                <ListItemAvatar sx={{ minWidth: 48 }}>
                                    <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 40, height: 40 }}>
                                        <EventIcon sx={{ fontSize: 20 }} />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primaryTypographyProps={{ component: 'div' }}
                                    secondaryTypographyProps={{ component: 'div' }}
                                    primary={
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body2" fontWeight="bold" color="text.primary" noWrap sx={{ maxWidth: '65%' }}>
                                                {event.title}
                                            </Typography>
                                            <ReservationStatusChip status={event.status} sx={{ height: 18, fontSize: '0.65rem' }} />
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="caption" color="text.secondary" component="div" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                    {formatDateLabel(event.startTime)}
                                                </Box>
                                                • {format(start, 'HH:mm')}
                                            </Typography>
                                            <Typography variant="caption" color="primary" component="div" sx={{ mt: 0.2 }}>
                                                {event.spaces.map(s => s.name).join(', ')}
                                                {event.subject && ` • ${event.subject.name}`}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        );
                    })
                ) : (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                        <EventIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1, opacity: 0.5 }} />
                        <Typography color="text.secondary" variant="body2" fontWeight="medium">
                            Sin reservas próximas
                        </Typography>
                    </Box>
                )}
            </List>
        </Paper>
    );
};

export default UpcomingEvents;
