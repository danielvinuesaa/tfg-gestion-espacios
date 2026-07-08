import type { CalendarEvent } from '../hooks/useCalendarEvents';
import { Box, Typography } from '@mui/material';
import { getStatusColor, getTypeColor } from '../../../theme/reservationTheme';

/**
 * Interfaz que define las propiedades requeridas por el componente AgendaEvent.
 */
interface AgendaEventProps {
    /** El evento del calendario que se va a representar. */
    event: CalendarEvent;
    /** El título del evento. */
    title: string;
}

/**
 * Componente que representa un evento en la vista de Agenda del calendario.
 * Se encarga de renderizar de manera estructurada la información principal
 * de la reserva, aplicando estilos y etiquetas de color acordes a su tipo
 * y estado, con el fin de facilitar la rápida identificación visual.
 *
 * @param props - Propiedades del componente, incluyendo el evento y su título.
 * @returns Elemento JSX que conforma el bloque representativo del evento en la agenda.
 */
const AgendaEvent = ({ event, title }: AgendaEventProps) => {
    const type = event.resource.type || 'OTRO';
    const isBlock = event.resource.status === 'BLOQUEO';

    const tagColor = isBlock ? getStatusColor('BLOQUEO') : getTypeColor(type);
    
    // Generar fondo suave basado en el color principal (sincronizado con el nuevo tema)
    const getLightBackground = (hex: string) => {
        if (hex === '#1565c0') return '#e3f2fd'; // Azul Pendiente
        if (hex === '#2e7d32') return '#e8f5e9'; // Verde Aprobada
        if (hex === '#7b1fa2') return '#f3e5f5'; // Púrpura Clase
        if (hex === '#ffa000') return '#fff8e1'; // Ámbar Examen
        if (hex === '#455a64') return '#f0f4f8'; // Gris Bloqueo (Nuevo)
        if (hex === '#c62828') return '#ffebee'; // Rojo Rechazada
        return '#f1f3f4';
    };

    return (
        <Box className="agenda-event-container" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box 
                className="agenda-event-tag"
                sx={{ 
                    px: 1,
                    py: 0.25,
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    minWidth: '70px',
                    textAlign: 'center',
                    backgroundColor: getLightBackground(tagColor),
                    color: tagColor,
                    border: `1px solid ${isBlock ? '#dadce0' : 'transparent'}`
                }}
            >
                {isBlock ? 'BLOQUEO' : type}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#3c4043' }}>
                {title}
            </Typography>
        </Box>
    );
};

export default AgendaEvent;
