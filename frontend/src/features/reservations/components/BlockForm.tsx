import type { Space, Reservation } from '../../../shared/types';
import { useBlockForm } from '../hooks/useBlockForm';
import {
    TextField, Grid, Box, Typography, Divider, InputAdornment, Chip
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSettings } from '../../../context/SettingsContext';
import { isTimeDisabled, adjustTimeToStartHour } from '../../../shared/utils/timeUtils';
import LockIcon from '@mui/icons-material/Lock';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
// Subcomponentes Especializados
import StickyAlerts from './reservation-form/components/StickyAlerts';
import { CircularProgress } from '@mui/material';
import FormDialogWrapper from '../../../shared/components/FormDialogWrapper';

/**
 * Propiedades del componente BlockForm.
 */
interface BlockFormProps {
    open: boolean;
    handleClose: () => void;
    onSuccess: (message: string) => void;
    space: Space | null;
    initialData?: Reservation | null;
}

/**
 * Formulario especializado para la gestión de bloqueos temporales de espacios físicos.
 * 
 * Este componente proporciona la interfaz necesaria para inhabilitar temporalmente
 * un recurso (por mantenimiento, obras, etc.), validando la disponibilidad de horarios
 * mediante un motor de conflictos subyacente. Soporta tanto la creación de nuevos bloqueos
 * como la edición de bloqueos preexistentes.
 * 
 * @param props - Propiedades para inicializar y controlar el formulario.
 * @param props.open - Estado que dicta la visibilidad del diálogo del formulario.
 * @param props.handleClose - Callback para cerrar el formulario o cancelar la operación.
 * @param props.onSuccess - Callback para notificar que el bloqueo se ha guardado exitosamente.
 * @param props.space - Entidad del espacio físico objetivo del bloqueo.
 * @param props.initialData - Objeto de reserva (estado 'BLOQUEO') inicial en el caso de operaciones de edición.
 * @returns Elemento React envolviendo el formulario dentro de un diálogo modal transaccional.
 */
const BlockForm = ({ open, handleClose, onSuccess, space, initialData }: BlockFormProps) => {
    const { timeSettings } = useSettings();
    const { startHour, endHour, minuteStep } = timeSettings;
    
    const { 
        formData, setFormData, loading, error, isDirty, submitBlock, conflictEngine, isEdit, getFieldError 
    } = useBlockForm(space, initialData, open, handleClose, onSuccess);

    const affectedSpaces = initialData ? initialData.spaces : (space ? [space] : []);
return (
    <FormDialogWrapper
        open={open}
        onClose={handleClose}
        title={isEdit ? "Editar Bloqueo Administrativo" : "Bloquear Espacio Temporalmente"}
        icon={<LockIcon color="error" />}
        loading={loading}
        isDirty={isDirty}
        onSubmit={submitBlock}
        submitText={isEdit ? "Guardar Cambios" : "Confirmar Bloqueo"}
        confirmExitDescription="Hay cambios sin guardar en el bloqueo. Si sale ahora, se perderán de forma permanente."
    >
            {/* Zona de Mensajes Críticos (Sticky) */}
            <StickyAlerts 
                error={error} 
                isFromSearch={false} 
                conflicts={conflictEngine.conflicts}
                isBlock={true}
            />

            <Box sx={{ p: 2, mb: 3, bgcolor: '#fff9f9', borderRadius: 2, border: '1px solid #fee' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    {affectedSpaces.length > 1 ? 'RECURSOS AFECTADOS' : 'RECURSO AFECTADO'}
                </Typography>
                {affectedSpaces.length === 1 ? (
                    <>
                        <Typography variant="h6" fontWeight="bold" color="error.main">
                            {affectedSpaces[0].name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {affectedSpaces[0].type} • Capacidad: {affectedSpaces[0].totalCapacity}
                        </Typography>
                    </>
                ) : (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                        {affectedSpaces.map(s => (
                            <Chip key={s.id} label={s.name} size="small" color="error" variant="outlined" />
                        ))}
                    </Box>
                )}
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Divider sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                Rango de Inhabilitación
                            </Typography>
                            {conflictEngine.isChecking && <CircularProgress size={12} color="inherit" sx={{ opacity: 0.6 }} />}
                        </Box>
                    </Divider>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <DateTimePicker
                        label="Inicio Bloqueo" value={formData.startTime} ampm={false} minutesStep={minuteStep}
                        onChange={(val) => setFormData({...formData, startTime: adjustTimeToStartHour(val, startHour)})}
                        shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                        maxDateTime={formData.endTime || undefined}
                        disablePast
                        slotProps={{ 
                            textField: { 
                                fullWidth: true,
                                error: !!getFieldError('startTime'),
                                helperText: getFieldError('startTime'),
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
                <Grid item xs={12} sm={6}>
                    <DateTimePicker
                        label="Fin Bloqueo" value={formData.endTime} ampm={false} minutesStep={minuteStep}
                        onChange={(val) => setFormData({...formData, endTime: adjustTimeToStartHour(val, startHour)})}
                        shouldDisableTime={(t) => isTimeDisabled(t, startHour, endHour)}
                        minDateTime={formData.startTime || undefined}
                        disablePast
                        slotProps={{ 
                            textField: { 
                                fullWidth: true,
                                error: !!getFieldError('endTime'),
                                helperText: getFieldError('endTime'),
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
                <Grid item xs={12}>
                    <TextField
                        label="Motivo del bloqueo"
                        placeholder="Ej: Obras de mantenimiento, Limpieza general..."
                        multiline rows={2} fullWidth value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        error={!!getFieldError('description')}
                        helperText={getFieldError('description')}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                                    <DescriptionIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
            </Grid>
        </FormDialogWrapper>
    );
};

export default BlockForm;
