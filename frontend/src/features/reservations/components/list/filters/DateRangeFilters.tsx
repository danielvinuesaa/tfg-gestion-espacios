import React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { InputAdornment } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { isTimeDisabled } from '../../../../../shared/utils/timeUtils';

/**
 * Propiedades del componente DateRangeFilters.
 */
interface DateRangeFiltersProps {
    startDate: Date | null;
    endDate: Date | null;
    onChange: (field: 'startDate' | 'endDate', val: Date | null) => void;
    minuteStep: number;
    startHour: number;
    endHour: number;
    isError: boolean;
}

/**
 * Componente secundario para la acotación de reservas mediante un rango temporal.
 * 
 * Renderiza dos selectores de fecha y hora (`DateTimePicker`) vinculados entre sí 
 * para definir los límites de inicio ("Desde") y fin ("Hasta"). Incluye validaciones 
 * internas que inhabilitan la selección de rangos incongruentes o fuera del horario 
 * operativo definido en la configuración global.
 * 
 * @param props - Propiedades de configuración del componente.
 * @param props.startDate - Límite inferior del rango temporal (fecha de inicio).
 * @param props.endDate - Límite superior del rango temporal (fecha de fin).
 * @param props.onChange - Callback invocado cuando se actualiza cualquiera de las cotas temporales.
 * @param props.minuteStep - Intervalo en minutos permitido en la selección de la hora.
 * @param props.startHour - Hora mínima operativa del sistema.
 * @param props.endHour - Hora máxima operativa del sistema.
 * @param props.isError - Flag visual para indicar un estado anómalo o de error en la selección de fechas.
 * @returns Elemento React compuesto por los dos campos de selección de fecha/hora.
 */
const DateRangeFilters = ({ 
    startDate, endDate, onChange, 
    minuteStep, startHour, endHour, isError 
}: DateRangeFiltersProps) => {
    return (
        <>
            <DateTimePicker
                label="Desde" 
                value={startDate} 
                ampm={false} 
                minutesStep={minuteStep}
                shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                onChange={(val) => onChange('startDate', val)}
                maxDateTime={endDate || undefined}
                slotProps={{ 
                    textField: { 
                        size: 'small', 
                        sx: { bgcolor: 'white', flex: '1 1 180px' },
                        InputProps: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarMonthIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }
                    },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />
            <DateTimePicker
                label="Hasta" 
                value={endDate} 
                ampm={false} 
                minutesStep={minuteStep}
                shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                onChange={(val) => onChange('endDate', val)}
                minDateTime={startDate || undefined}
                slotProps={{ 
                    textField: { 
                        size: 'small', 
                        sx: { bgcolor: 'white', flex: '1 1 180px' },
                        error: isError,
                        InputProps: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarMonthIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }
                    },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />
        </>
    );
};

export default DateRangeFilters;
