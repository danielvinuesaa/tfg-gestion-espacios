import { Alert, Box, AlertTitle, List, ListItem, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ReservationConflict } from '../../../hooks/useConflictChecker';

/**
 * Propiedades del componente StickyAlerts.
 */
interface StickyAlertsProps {
    error: string | null;
    isFromSearch: boolean;
    conflicts?: ReservationConflict[];
    isBlock?: boolean;
}

/**
 * Componente especializado en la presentación de notificaciones modales y alertas persistentes.
 * 
 * Se encarga de capturar y mostrar de forma flotante (sticky) los posibles errores de red, 
 * avisos del motor de pre-llenado inteligente, o colisiones temporales detectadas por el 
 * `useConflictChecker`. Está diseñado para mantener la visibilidad en la cabecera de los 
 * formularios largos sin interferir con el contenido desplazable (scroll).
 * 
 * @param props - Propiedades para gestionar el contenido de las alertas.
 * @param props.error - Cadena de texto indicando un error genérico o de validación a mostrar (opcional).
 * @param props.isFromSearch - Flag booleano que activa la notificación informativa de datos auto-completados.
 * @param props.conflicts - Colección estructurada de conflictos detectados por el motor de disponibilidad.
 * @param props.isBlock - Flag booleano para adaptar semánticamente los mensajes en caso de que la operación actual sea un bloqueo administrativo.
 * @returns Elemento React conteniendo un contenedor flotante de alertas o nulo si no hay avisos.
 */
const StickyAlerts = ({ error, isFromSearch, conflicts = [], isBlock = false }: StickyAlertsProps) => {
    const hasConflicts = conflicts.length > 0;
    const hasAny = !!(error || isFromSearch || hasConflicts);
    
    if (!hasAny) return null;

    return (
        <Box sx={{ 
            position: 'sticky', 
            top: -20, // Compensa el padding superior del DialogContent
            zIndex: 10,
            bgcolor: 'background.paper', // Fondo sólido para no transparentar contenido
            mx: -3, // Se expande hasta los bordes del diálogo
            px: 3, 
            pb: 2,
            pt: 2,
            mb: 1,
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1,
            boxShadow: '0 4px 12px -5px rgba(0,0,0,0.1)', // Sombra sutil para indicar elevación
            borderBottom: '1px solid',
            borderColor: 'divider'
        }}>
            {/* Errores críticos de envío o validación */}
            {error && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Alertas de conflicto (Bloqueantes en lógica, informativas en UI) */}
            {hasConflicts && (
                <Alert 
                    severity={isBlock ? "info" : "warning"}
                    sx={{ borderRadius: 2 }} 
                    icon={isBlock ? <InfoIcon /> : <WarningAmberIcon />}
                >
                    <AlertTitle sx={{ fontWeight: 700 }}>
                        {isBlock ? "Aviso de cancelación automática" : "Conflicto de disponibilidad detectado"}
                    </AlertTitle>
                    <Box sx={{ mt: 0.5 }}>
                        {isBlock 
                            ? "Al crear este bloqueo, se cancelarán automáticamente las siguientes reservas existentes:"
                            : "Los siguientes espacios ya tienen una reserva en este horario:"}
                        <List dense sx={{ py: 0, mt: 0.5 }}>
                            {conflicts.map((c, idx) => (
                                <ListItem key={`${c.spaceId}-${c.reservationId}-${idx}`} sx={{ p: 0 }}>
                                    <ListItemText 
                                        primary={`• ${c.spaceName}`} 
                                        secondary={`Reservado para: "${c.title || 'Actividad'}"`}
                                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Alert>
            )}

            {/* Notificación de precarga de datos */}
            {isFromSearch && (
                <Alert severity="info" sx={{ borderRadius: 2 }} icon={<InfoIcon />}>
                    <strong>Reserva sugerida:</strong> Se han pre-cargado los datos de su búsqueda inteligente.
                </Alert>
            )}
        </Box>
    );
};

export default StickyAlerts;
