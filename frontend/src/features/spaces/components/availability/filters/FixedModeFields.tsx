import React from 'react';
import { DateTimePicker } from '@mui/x-date-pickers';
import { isTimeDisabled, adjustTimeToStartHour } from '../../../../../shared/utils/timeUtils';

/**
 * Propiedades para el componente FixedModeFields.
 */
interface FixedModeFieldsProps {
    /** Objeto con los valores actuales de los filtros. */
    filters: any;
    /** Función para actualizar los valores de los filtros. */
    setFilters: (f: any) => void;
    /** Configuración y límites horarios generales del sistema. */
    timeSettings: any;
}

/**
 * Componente que renderiza los campos de filtrado específicos para el modo de búsqueda fijo.
 * Permite seleccionar una fecha y hora exacta de inicio y de fin para buscar espacios
 * disponibles estrictamente en ese lapso.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con los campos de selección de fecha y hora.
 */
const FixedModeFields = ({ filters, setFilters, timeSettings }: FixedModeFieldsProps) => {
    const { startHour, endHour, minuteStep } = timeSettings;

    return (
        <>
            <DateTimePicker
                label="Fecha y Hora Inicio"
                value={filters.startTime}
                onChange={(val) => setFilters({ ...filters, startTime: adjustTimeToStartHour(val, startHour) })}
                minutesStep={minuteStep}
                shouldDisableTime={(val) => isTimeDisabled(val, startHour, endHour)}
                maxDateTime={filters.endTime || undefined}
                disablePast
                ampm={false}
                slotProps={{ 
                    textField: { fullWidth: true, required: true },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />

            <DateTimePicker
                label="Fecha y Hora Fin"
                value={filters.endTime}
                onChange={(val) => setFilters({ ...filters, endTime: adjustTimeToStartHour(val, startHour) })}
                minutesStep={minuteStep}
                shouldDisableTime={(val) => isTimeDisabled(val, startHour, endHour)}
                minDateTime={filters.startTime || undefined}
                disablePast
                ampm={false}
                slotProps={{ 
                    textField: { fullWidth: true, required: true },
                    digitalClock: { skipDisabled: true },
                    multiSectionDigitalClock: { skipDisabled: true }
                } as any}
            />
        </>
    );
};

export default FixedModeFields;
