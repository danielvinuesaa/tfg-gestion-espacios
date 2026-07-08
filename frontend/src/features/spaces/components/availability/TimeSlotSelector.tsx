import { Box, Paper, Typography, Badge, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { TimeSlotResults } from '../../hooks/useAvailabilitySearch';

/**
 * Propiedades para el componente TimeSlotSelector.
 */
interface TimeSlotSelectorProps {
    /** Lista de franjas horarias disponibles con la cantidad de resultados por franja. */
    timeSlots: TimeSlotResults[];
    /** Índice de la franja horaria actualmente seleccionada. */
    selectedSlotIdx: number | null;
    /** Función a ejecutar cuando el usuario selecciona una franja horaria. */
    onSelectSlot: (idx: number) => void;
}

/**
 * Componente que muestra una lista horizontal de franjas horarias.
 * Permite al usuario seleccionar un rango horario específico dentro de un día,
 * destacando visualmente la opción elegida.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el selector de franjas horarias.
 */
const TimeSlotSelector = ({ timeSlots, selectedSlotIdx, onSelectSlot }: TimeSlotSelectorProps) => (
    <Box sx={{ 
        mb: 4, 
        pt: 2.5, 
        pb: 1.5, 
        px: 1.5, 
        overflowX: 'auto', 
        display: 'flex', 
        gap: 1.5,
        '&::-webkit-scrollbar': { height: 6 }, 
        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } 
    }}>
        {timeSlots.map((slot, idx) => {
            const isSelected = selectedSlotIdx === idx;
            
            return (
                <Badge 
                    key={idx}
                    badgeContent={slot.count} 
                    color="secondary"
                    sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}
                >
                    <Paper
                        elevation={isSelected ? 4 : 0}
                        onClick={() => onSelectSlot(idx)}
                        sx={{
                            py: 1.5, px: 3, minWidth: 140, textAlign: 'center', cursor: 'pointer',
                            borderRadius: 2, border: isSelected ? '2px solid #9c27b0' : '1px solid #eee',
                            bgcolor: isSelected ? '#f3e5f5' : 'white',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                            '&:hover': { transform: 'translateY(-2px)', borderColor: '#9c27b0' }
                        }}
                    >
                        <AccessTimeIcon sx={{ fontSize: 18, color: isSelected ? '#9c27b0' : 'text.disabled' }} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: isSelected ? '#9c27b0' : 'text.primary' }}>
                            {slot.label}
                        </Typography>
                    </Paper>
                </Badge>
            );
        })}
    </Box>
);

export default TimeSlotSelector;
