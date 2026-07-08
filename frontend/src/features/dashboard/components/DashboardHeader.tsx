import { Stack } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parse, format, isAfter } from 'date-fns';

/**
 * Propiedades del componente DashboardHeader.
 */
interface DashboardHeaderProps {
    dateRange: { start: string; end: string };
    onDateRangeChange: (range: { start: string; end: string }) => void;
}

/**
 * Componente de cabecera para el cuadro de mando (dashboard).
 * Proporciona controles interactivos para la selección del rango de fechas que afecta a los indicadores globales.
 *
 * @param props - Propiedades del componente.
 * @param props.dateRange - Rango de fechas actual en formato 'yyyy-MM-dd'.
 * @param props.onDateRangeChange - Función delegada para notificar el cambio del rango de fechas.
 * @returns Elemento de React con la cabecera interactiva.
 */
const DashboardHeader = ({ dateRange, onDateRangeChange }: DashboardHeaderProps) => {
    // Parseamos las fechas de los inputs como fechas locales.
    // Usamos parse con una fecha de referencia base (new Date()) para los DatePickers.
    const startDate = parse(dateRange.start, 'yyyy-MM-dd', new Date());
    const endDate = parse(dateRange.end, 'yyyy-MM-dd', new Date());

    return (
        <Stack 
            direction="row" 
            justifyContent="flex-end" 
            alignItems="center" 
            mb={2} 
            spacing={2}
        >
            <Stack direction="row" spacing={2}>
                <DatePicker
                    label="Desde"
                    value={startDate}
                    onChange={(newDate) => {
                        if (newDate) {
                            const formatted = format(newDate, 'yyyy-MM-dd');
                            if (isAfter(newDate, endDate)) {
                                onDateRangeChange({ start: formatted, end: formatted });
                            } else {
                                onDateRangeChange({ ...dateRange, start: formatted });
                            }
                        }
                    }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            sx: { bgcolor: 'white', borderRadius: 1 }
                        }
                    }}
                    maxDate={endDate}
                />
                <DatePicker
                    label="Hasta"
                    value={endDate}
                    onChange={(newDate) => {
                        if (newDate) {
                            const formatted = format(newDate, 'yyyy-MM-dd');
                            onDateRangeChange({...dateRange, end: formatted});
                        }
                    }}
                    slotProps={{
                        textField: {
                            size: 'small',
                            sx: { bgcolor: 'white', borderRadius: 1 }
                        }
                    }}
                    minDate={startDate}
                />
            </Stack>
        </Stack>
    );
};

export default DashboardHeader;
