import { Box, Badge, Paper, Typography } from '@mui/material';
import { formatDisplayDate, parseApiDate } from '../../../../shared/utils/dateUtils';
import type { DailyResults } from '../../hooks/useAvailabilitySearch';

/**
 * Propiedades para el componente DailySelector.
 */
interface DailySelectorProps {
    /** Lista de resultados agrupados por día. */
    dailyResults: DailyResults[];
    /** Fecha actualmente seleccionada en formato ISO. */
    selectedDate: string | null;
    /** Función a ejecutar cuando el usuario selecciona un día específico. */
    onSelectDate: (date: string) => void;
}

/**
 * Componente que muestra una lista horizontal de días disponibles.
 * Renderiza el total de espacios encontrados por día e indica visualmente el día seleccionado.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el selector diario.
 */
const DailySelector = ({ dailyResults, selectedDate, onSelectDate }: DailySelectorProps) => (
    <Box sx={{ 
        mb: 4, 
        pt: 2.5, 
        pb: 1.5, 
        px: 1.5, 
        overflowX: 'auto', 
        display: 'flex', 
        gap: 2, 
        '&::-webkit-scrollbar': { height: 6 }, 
        '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 3 } 
    }}>
        {dailyResults.map((day) => {
            const dateObj = parseApiDate(day.date);
            const isSelected = selectedDate === day.date;
            const hasResults = day.totalCount > 0;

            return (
                <Badge 
                    key={day.date}
                    badgeContent={day.totalCount} 
                    color="primary" 
                    invisible={!hasResults}
                    sx={{ '& .MuiBadge-badge': { top: 4, right: 4 } }}
                >
                    <Paper
                        elevation={isSelected ? 4 : 0}
                        onClick={() => hasResults && onSelectDate(day.date)}
                        sx={{
                            p: 2, minWidth: 100, textAlign: 'center', cursor: hasResults ? 'pointer' : 'default',
                            borderRadius: 3, border: isSelected ? '2px solid #1976d2' : '1px solid #eee',
                            bgcolor: isSelected ? '#e3f2fd' : (hasResults ? 'white' : '#fafafa'),
                            opacity: hasResults ? 1 : 0.5,
                            transition: 'all 0.2s',
                            '&:hover': hasResults ? { transform: 'translateY(-2px)', borderColor: '#1976d2' } : {}
                        }}
                    >
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 'bold', color: isSelected ? 'primary.main' : 'text.secondary' }}>
                            {formatDisplayDate(dateObj, 'EEE')}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: '800', my: 0.5 }}>
                            {formatDisplayDate(dateObj, 'd')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                            {formatDisplayDate(dateObj, 'MMM')}
                        </Typography>
                    </Paper>
                </Badge>
            );
        })}
    </Box>
);

export default DailySelector;
