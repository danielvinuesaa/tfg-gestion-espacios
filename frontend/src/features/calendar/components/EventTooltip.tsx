import React from 'react';
import { Box, Typography, Stack, Divider, Tooltip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import type { CalendarEvent } from '../hooks/useCalendarEvents';
import { formatDisplayDate } from '../../../shared/utils/dateUtils';
import { getStatusColor } from '../../../theme/reservationTheme';

/**
 * Propiedades para el componente EventTooltip.
 */
interface EventTooltipProps {
    /** Evento del calendario cuyos detalles se mostrarán en el tooltip. */
    event: CalendarEvent;
    /** Elemento React sobre el cual se anclará el tooltip (normalmente la tarjeta del evento). */
    children: React.ReactElement;
}

/**
 * Componente que muestra una ventana flotante informativa (tooltip) al pasar el cursor
 * sobre un evento en el calendario. Exhibe detalles como título, horario, responsable,
 * espacios afectados y estado actual de forma estructurada.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que encapsula al componente hijo otorgándole un tooltip personalizado.
 */
const EventTooltip = ({ event, children }: EventTooltipProps) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMs = end.getTime() - start.getTime();
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1).replace('.0', '');
    
    const res = event.resource;

    const content = (
        <Box sx={{ p: 1.5, maxWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                <InfoIcon fontSize="small" /> {event.title}
            </Typography>
            <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 1.5 }} />
            
            <Stack spacing={1.2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="body2">
                        {formatDisplayDate(start, 'HH:mm')} - {formatDisplayDate(end, 'HH:mm')} ({durationHours}h)
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <PersonIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="body2" noWrap>
                        {res.user.name}
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ApartmentIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                    <Typography variant="body2">
                        {res.spaces?.map(s => s.name).join(", ") || 'Varios'}
                    </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                    <Box sx={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        bgcolor: getStatusColor(res.status),
                        boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                    }} />
                    <Typography variant="caption" sx={{ fontWeight: 'bold', letterSpacing: 0.5 }}>
                        {res.status}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );

    return (
        <Tooltip 
            title={content} 
            arrow 
            placement="top"
            enterDelay={500}
            leaveDelay={0}
            slotProps={{
                tooltip: {
                    sx: {
                        bgcolor: 'rgba(32, 33, 36, 0.98)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        borderRadius: 2,
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                },
                arrow: {
                    sx: { color: 'rgba(32, 33, 36, 0.98)' }
                }
            }}
        >
            {children}
        </Tooltip>
    );
};

export default EventTooltip;
