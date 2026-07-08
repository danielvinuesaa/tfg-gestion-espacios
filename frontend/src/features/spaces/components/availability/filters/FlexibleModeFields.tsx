import React from 'react';
import { Divider, TextField, FormControlLabel, Switch, Typography } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { isTimeDisabled } from '../../../../../shared/utils/timeUtils';

/**
 * Propiedades para el componente FlexibleModeFields.
 */
interface FlexibleModeFieldsProps {
    /** Objeto con los valores actuales de los filtros. */
    filters: any;
    /** Función para actualizar los valores de los filtros. */
    setFilters: (f: any) => void;
    /** Configuración y límites horarios generales del sistema. */
    timeSettings: any;
}

/**
 * Componente que renderiza los campos de filtrado específicos para el modo flexible.
 * Incluye selectores de fecha de inicio y fin, rango horario diario, duración deseada
 * de la reserva y la opción de incluir fines de semana.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con los campos del modo flexible.
 */
const FlexibleModeFields = ({ filters, setFilters, timeSettings }: FlexibleModeFieldsProps) => {
    const { startHour, endHour, minuteStep } = timeSettings;

    return (
        <>
            <DatePicker
                label="Día Inicio Rango"
                value={filters.rangeStart}
                onChange={(val) => setFilters({ ...filters, rangeStart: val })}
                maxDate={filters.rangeEnd || undefined}
                disablePast
                slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <DatePicker
                label="Día Fin Rango"
                value={filters.rangeEnd}
                onChange={(val) => setFilters({ ...filters, rangeEnd: val })}
                minDate={filters.rangeStart || undefined}
                disablePast
                slotProps={{ textField: { fullWidth: true, required: true } }}
            />
            <Divider>Franja Diaria</Divider>
            <TimePicker
                label="Desde las"
                value={filters.dailyStart}
                onChange={(val) => setFilters({ ...filters, dailyStart: val })}
                minutesStep={minuteStep}
                shouldDisableTime={(val) => isTimeDisabled(val, startHour, endHour)}
                maxTime={filters.dailyEnd || undefined}
                ampm={false}
                slotProps={{ 
                    textField: { fullWidth: true, required: true },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />
            <TimePicker
                label="Hasta las"
                value={filters.dailyEnd}
                onChange={(val) => setFilters({ ...filters, dailyEnd: val })}
                minutesStep={minuteStep}
                shouldDisableTime={(val) => isTimeDisabled(val, startHour, endHour)}
                minTime={filters.dailyStart || undefined}
                ampm={false}
                slotProps={{ 
                    textField: { fullWidth: true, required: true },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />
            <TextField
                label="Duración (Horas)"
                type="number"
                inputProps={{ step: 0.5, min: 0.5 }}
                value={filters.durationHours}
                onChange={(e) => setFilters({ ...filters, durationHours: parseFloat(e.target.value) })}
                fullWidth
                required
            />
            <FormControlLabel
                control={
                    <Switch 
                        checked={filters.includeWeekends} 
                        onChange={(e) => setFilters({ ...filters, includeWeekends: e.target.checked })} 
                        size="small"
                    />
                }
                label={<Typography variant="body2" fontWeight="500">Incluir fines de semana</Typography>}
            />
        </>
    );
};

export default FlexibleModeFields;
