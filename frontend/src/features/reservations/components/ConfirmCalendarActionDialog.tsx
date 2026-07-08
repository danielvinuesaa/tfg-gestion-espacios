import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions, 
    Button, 
    Typography, 
    Box,
    Stack,
    Divider,
    IconButton,
    Alert
} from '@mui/material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CalendarEvent } from '../../calendar/hooks/useCalendarEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CloseIcon from '@mui/icons-material/Close';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StraightenIcon from '@mui/icons-material/Straighten';
import InfoIcon from '@mui/icons-material/Info';
import { getSpaceColors, getStatusColor } from '../../../theme/reservationTheme';

/**
 * Propiedades del componente ConfirmCalendarActionDialog.
 */
interface ConfirmCalendarActionDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    event: CalendarEvent | null;
    newStart: Date | null;
    newEnd: Date | null;
    actionType: 'MOVE' | 'RESIZE';
}

/**
 * Componente de diálogo de confirmación para acciones interactivas realizadas en el calendario (drag & drop).
 * 
 * Permite al usuario validar los cambios de horario y/o duración de una reserva antes de ser
 * persistidos en el sistema. Presenta un resumen claro del estado anterior frente al nuevo,
 * manteniendo consistencia visual con el resto de modales de la aplicación mediante iconografía
 * y códigos de color semánticos.
 * 
 * @param props - Propiedades requeridas por el diálogo de confirmación.
 * @param props.open - Estado de visibilidad actual del diálogo.
 * @param props.onClose - Callback invocado para cancelar la acción y cerrar el modal.
 * @param props.onConfirm - Callback invocado al confirmar la modificación en el calendario.
 * @param props.event - Objeto del evento original previo a la modificación.
 * @param props.newStart - Nueva fecha y hora de inicio propuestas.
 * @param props.newEnd - Nueva fecha y hora de fin propuestas.
 * @param props.actionType - Define el tipo de acción ejecutada, determinando el estilo y texto del diálogo ('MOVE' para traslados, 'RESIZE' para cambios de duración).
 * @returns Elemento React representando el diálogo de confirmación.
 */
const ConfirmCalendarActionDialog = ({ 
    open, 
    onClose, 
    onConfirm, 
    event, 
    newStart, 
    newEnd,
    actionType
}: ConfirmCalendarActionDialogProps) => {
    if (!event || !newStart || !newEnd) return null;

    const res = event.resource;
    const isBlock = res.status === 'BLOQUEO';
    
    // Configuración visual coherente con el resto de diálogos
    const config = actionType === 'MOVE' 
        ? {
            title: 'Confirmar Traslado',
            icon: <SwapHorizIcon />,
            mainColor: '#1a73e8', // Azul informativo
            lightColor: '#e8f0fe',
            actionText: 'mover'
        }
        : {
            title: 'Ajustar Duración',
            icon: <StraightenIcon />,
            mainColor: '#1e7e34', // Verde éxito/ajuste
            lightColor: '#e6f4ea',
            actionText: 'cambiar la duración de'
        };

    const formatDateRange = () => {
        const dateStr = format(newStart, "EEEE, dd 'de' MMMM", { locale: es });
        const timeStr = `${format(newStart, "HH:mm")} - ${format(newEnd, "HH:mm")}`;
        return { dateStr, timeStr };
    };

    const { dateStr, timeStr } = formatDateRange();

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } }}
        >
            {/* Cabecera idéntica a CalendarDetailsDialog */}
            <DialogTitle sx={{ 
                m: 0, p: 2, bgcolor: config.lightColor, color: config.mainColor,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold'
            }}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                    {config.icon}
                    <Typography variant="h6" component="span" fontWeight="bold">
                        {config.title}
                    </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" sx={{ color: config.mainColor }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3, mt: 1 }}>
                    <Alert severity="info" icon={<InfoIcon />} sx={{ borderRadius: 2, mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
                        ¿Deseas confirmar este cambio en el calendario?
                    </Alert>

                    <Stack spacing={3}>
                        {/* Nombre de la Reserva */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <InfoIcon sx={{ color: 'action.active', mt: 0.5 }} />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Elemento</Typography>
                                <Typography variant="body1" fontWeight="bold" sx={{ color: config.mainColor }}>
                                    {isBlock ? `BLOQUEO: ${res.description}` : (res.title || res.user.name)}
                                </Typography>
                            </Box>
                        </Box>

                        {/* Espacios (reutilizando estilos de la app) */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <ApartmentIcon sx={{ color: 'action.active', mt: 0.5 }} />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Ubicación</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {res.spaces.map(s => (
                                        <Typography key={s.id} variant="body2" sx={{ 
                                            bgcolor: getSpaceColors(s.type).bg, 
                                            color: getSpaceColors(s.type).text,
                                            px: 1, py: 0.2, borderRadius: 1, fontWeight: 'bold', fontSize: '0.75rem'
                                        }}>
                                            {s.name}
                                        </Typography>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        {/* Nuevo Horario */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <AccessTimeIcon sx={{ color: 'action.active', mt: 0.5 }} />
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Nuevo Horario</Typography>
                                <Typography variant="body1" fontWeight="medium">{timeStr}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                    {dateStr}
                                </Typography>
                            </Box>
                        </Box>
                    </Stack>
                </Box>
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, bgcolor: '#f8f9fa', gap: 1 }}>
                <Button onClick={onClose} variant="outlined" color="inherit" sx={{ textTransform: 'none', fontWeight: 'bold' }}>
                    Cancelar
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    sx={{ 
                        bgcolor: config.mainColor,
                        '&:hover': { bgcolor: config.mainColor, filter: 'brightness(0.9)' },
                        borderRadius: 2, 
                        fontWeight: 'bold', 
                        px: 3, 
                        textTransform: 'none' 
                    }}
                >
                    Confirmar Cambio
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmCalendarActionDialog;
