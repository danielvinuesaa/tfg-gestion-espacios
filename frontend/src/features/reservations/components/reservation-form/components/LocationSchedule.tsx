import { useMemo } from 'react';
import { Grid, Divider, Typography, Autocomplete, TextField, InputAdornment, Chip, CircularProgress, Box, ListSubheader, Checkbox } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SchoolIcon from '@mui/icons-material/School';
import ComputerIcon from '@mui/icons-material/Computer';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { isTimeDisabled, adjustTimeToStartHour } from '../../../../../shared/utils/timeUtils';
import type { Space } from '../../../../../shared/types';
import type { ReservationFormData } from '../../../hooks/useReservationForm';

/**
 * Propiedades del componente LocationSchedule.
 */
interface LocationScheduleProps {
    formData: ReservationFormData;
    setFormData: (data: Partial<ReservationFormData>) => void;
    spaces: Space[];
    selectedSpaces: Space[];
    totalCapacity: number;
    timeSettings: {
        startHour: number;
        endHour: number;
        minuteStep: number;
    };
    getFieldError: (field: string) => string | null;
    handleBlur: (field: string) => void;
    touched: Record<string, boolean>;
    isCheckingConflicts?: boolean;
}

const SPACE_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
    'AULA': { label: 'Aulas', icon: SchoolIcon, color: '#1a73e8' },
    'LABORATORIO': { label: 'Laboratorios', icon: ComputerIcon, color: '#059669' },
    'SALA_ESTUDIO': { label: 'Salas de Estudio', icon: MenuBookIcon, color: '#d97706' },
    'DESPACHO': { label: 'Despachos', icon: WorkIcon, color: '#6366f1' },
    'SALON_ACTOS': { label: 'Salones de Actos', icon: TheaterComedyIcon, color: '#e11d48' },
};

/**
 * Componente fundamental encargado de la captura espacial y temporal de una solicitud de reserva.
 * 
 * Combina un selector de espacios (agrupados por tipología) con controles de calendario para 
 * fijar la fecha de inicio y fin. Este módulo es sensible a las restricciones horarias globales y 
 * proporciona feedback en vivo, calculando y mostrando la suma total del aforo conforme 
 * el usuario selecciona distintos recursos, además de indicar visualmente si se están 
 * procesando comprobaciones de disponibilidad asíncronas.
 * 
 * @param props - Propiedades y estado para operar con ubicación y tiempo.
 * @param props.formData - Estado actual de los datos recogidos en el formulario principal.
 * @param props.setFormData - Disparador para actualizar subconjuntos del estado del formulario.
 * @param props.spaces - Catálogo completo de espacios físicos disponibles en el sistema.
 * @param props.selectedSpaces - Subconjunto materializado de los espacios escogidos actualmente en el selector.
 * @param props.totalCapacity - Valor numérico calculado que refleja el aforo total garantizado.
 * @param props.timeSettings - Objeto que agrupa parámetros operativos como la hora mínima de inicio, máxima de fin y granularidad (pasos en minutos).
 * @param props.getFieldError - Función de comprobación de validaciones para un campo en particular.
 * @param props.handleBlur - Manejador de eventos blur para la actualización de errores diferidos en campos tocados.
 * @param props.touched - Diccionario de tracking para los campos con los que el usuario ha interactuado.
 * @param props.isCheckingConflicts - Flag visual opcional que activa un spinner cuando el motor de colisiones está evaluando.
 * @returns Elemento React conteniendo los componentes de selección de espacios y temporales.
 */
const LocationSchedule = ({ 
    formData, setFormData, spaces, selectedSpaces, totalCapacity, timeSettings,
    getFieldError, handleBlur, touched, isCheckingConflicts = false
}: LocationScheduleProps) => {
    const { startHour, endHour, minuteStep } = timeSettings;

    const spacesError = getFieldError('spaceIds') || (touched.spaceIds && formData.spaceIds.length === 0 ? "Debes seleccionar al menos un espacio" : "");
    const startTimeError = getFieldError('startTime') || (touched.startTime && !formData.startTime ? "La fecha de inicio es obligatoria" : "");
    const endTimeError = getFieldError('endTime') || (touched.endTime && !formData.endTime ? "La fecha de fin es obligatoria" : "");

    // Ordenar espacios por tipo para que el agrupamiento sea consistente
    const sortedSpaces = useMemo(() => {
        return [...spaces].sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.name.localeCompare(b.name);
        });
    }, [spaces]);

    return (
        <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
                <Divider sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                            Ubicación y Horario
                        </Typography>
                        {isCheckingConflicts && <CircularProgress size={12} color="inherit" sx={{ opacity: 0.6 }} />}
                    </Box>
                </Divider>
            </Grid>

            <Grid item xs={12}>
                <Autocomplete
                    multiple 
                    disableCloseOnSelect
                    options={sortedSpaces} 
                    getOptionLabel={(o) => o.name}
                    groupBy={(o) => o.type}
                    value={selectedSpaces} 
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    onChange={(_, val) => setFormData({ spaceIds: val.map(v => v.id) })}
                    onBlur={() => handleBlur('spaceIds')}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label="Espacios" 
                            placeholder="Buscar y seleccionar espacios..." 
                            required 
                            error={!!spacesError}
                            helperText={spacesError}
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <>
                                        <InputAdornment position="start">
                                            <MeetingRoomIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                        {params.InputProps.startAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                    renderGroup={(params) => (
                        <Box key={params.key}>
                            <Box sx={{ 
                                px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', 
                                alignItems: 'center', bgcolor: '#f0f4f8', position: 'sticky', top: 0, zIndex: 1,
                                borderBottom: '1px solid #e0e0e0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                    {params.group.toUpperCase()}
                                </Typography>
                            </Box>
                            <Box sx={{ py: 0.5 }}>{params.children}</Box>
                        </Box>
                    )}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...optionProps } = props;
                        return (
                            <Box component="li" key={key} {...optionProps} sx={{ px: 2, py: 0.5 }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{option.name}</Typography>
                                    <Typography variant="caption" color="text.disabled">Cap: {option.totalCapacity}</Typography>
                                </Box>
                            </Box>
                        );
                    }}
                />
                {formData.spaceIds.length > 0 && !spacesError && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', ml: 4 }}>
                        Capacidad total agregada: <strong>{totalCapacity} personas</strong>
                    </Typography>
                )}
            </Grid>
            <Grid item xs={6}>
                <DateTimePicker
                    label="Fecha Inicio" value={formData.startTime} ampm={false} minutesStep={minuteStep}
                    onChange={(val) => setFormData({startTime: val ? adjustTimeToStartHour(val, startHour) : null})}
                    onClose={() => handleBlur('startTime')}
                    shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                    maxDateTime={formData.endTime || undefined}
                    disablePast
                    slotProps={{ 
                        textField: { 
                            fullWidth: true, required: true,
                            error: !!startTimeError,
                            helperText: startTimeError,
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
            </Grid>
            <Grid item xs={6}>
                <DateTimePicker
                    label="Fecha Fin" value={formData.endTime} ampm={false} minutesStep={minuteStep}
                    onChange={(val) => setFormData({endTime: val ? adjustTimeToStartHour(val, startHour) : null})}
                    onClose={() => handleBlur('endTime')}
                    shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                    minDateTime={formData.startTime || undefined}
                    disablePast
                    slotProps={{ 
                        textField: { 
                            fullWidth: true, required: true,
                            error: !!endTimeError,
                            helperText: endTimeError,
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
            </Grid>
        </Grid>
    );
};

export default LocationSchedule;
