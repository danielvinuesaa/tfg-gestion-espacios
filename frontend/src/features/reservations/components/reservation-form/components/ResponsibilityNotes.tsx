import { Grid, Divider, Typography, Box, FormControlLabel, Checkbox, Autocomplete, TextField, InputAdornment } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import type { User } from '../../../../../shared/types';
import type { ReservationFormData } from '../../../hooks/useReservationForm';

/**
 * Propiedades del componente ResponsibilityNotes.
 */
interface ResponsibilityNotesProps {
    canDelegate: boolean;
    showResponsible: boolean;
    setShowResponsible: (show: boolean) => void;
    users: User[];
    formData: ReservationFormData;
    setFormData: (data: Partial<ReservationFormData>) => void;
    getFieldError: (field: string) => string | null;
    handleBlur: (field: string) => void;
    touched: Record<string, boolean>;
}

/**
 * Componente que encapsula la sección de delegación de responsabilidad y metadatos textuales del formulario.
 * 
 * Provee la interfaz para que roles con privilegios puedan emitir reservas a nombre de 
 * otros usuarios o indicar un responsable externo. Además, alberga el campo para 
 * adjuntar la descripción o notas detalladas sobre el propósito del evento.
 * 
 * @param props - Propiedades requeridas para la validación y captura de datos.
 * @param props.canDelegate - Flag que habilita la UI de delegación de responsabilidad de la reserva.
 * @param props.showResponsible - Estado que indica si se ha desplegado explícitamente el selector de responsable.
 * @param props.setShowResponsible - Callback para alternar la visibilidad del selector de responsable.
 * @param props.users - Lista pre-cargada de usuarios susceptibles a ser designados responsables.
 * @param props.formData - Objeto que mantiene el estado transaccional del formulario.
 * @param props.setFormData - Función modificadora para actualizar parcialidades del estado del formulario.
 * @param props.getFieldError - Función evaluadora de errores asociados a un campo específico.
 * @param props.handleBlur - Callback invocado al perder el foco, utilizado para disparar validaciones diferidas.
 * @param props.touched - Mapa de estado que registra si un campo ha sido iterado por el usuario.
 * @returns Elemento React estructurando los campos en un Grid.
 */
const ResponsibilityNotes = ({ 
    canDelegate, showResponsible, setShowResponsible, users, formData, setFormData,
    getFieldError, handleBlur, touched
}: ResponsibilityNotesProps) => {
    
    const descriptionError = getFieldError('description');
    const responsibleError = getFieldError('responsibleName');

    return (
        <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
                <Divider sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Responsabilidad y Notas
                    </Typography>
                </Divider>
            </Grid>

            <Grid item xs={12}>
                {canDelegate && (
                    <Box sx={{ mb: 2, ml: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox 
                                    checked={showResponsible} 
                                    onChange={(e) => setShowResponsible(e.target.checked)} 
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2">Reservar en nombre de otro docente/gestor</Typography>}
                        />
                        {showResponsible && (
                            <Autocomplete
                                freeSolo 
                                options={users} 
                                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                                value={users.find(u => u.id === formData.responsibleId) || formData.responsibleName || ''}
                                onChange={(_, newValue) => {
                                    if (typeof newValue === 'string') {
                                        setFormData({ responsibleName: newValue, responsibleId: null });
                                    } else if (newValue) {
                                        setFormData({ responsibleName: newValue.name, responsibleId: newValue.id });
                                    } else {
                                        setFormData({ responsibleName: '', responsibleId: null });
                                    }
                                }}
                                onInputChange={(_, val) => {
                                    if (!users.some(u => u.name === val)) {
                                        setFormData({ responsibleName: val, responsibleId: null });
                                    }
                                }}
                                onBlur={() => handleBlur('responsibleName')}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        fullWidth 
                                        size="small"
                                        label="Nombre del Responsable" 
                                        placeholder="Buscar o escribir nombre..." 
                                        sx={{ mt: 1 }} 
                                        error={!!responsibleError}
                                        helperText={responsibleError}
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <PersonIcon fontSize="small" color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                )}
                            />
                        )}
                    </Box>
                )}
                <TextField
                    label="Descripción de la actividad" 
                    multiline rows={2} fullWidth value={formData.description}
                    onChange={(e) => setFormData({description: e.target.value})}
                    onBlur={() => handleBlur('description')}
                    error={!!descriptionError}
                    helperText={descriptionError}
                    placeholder="Detalles adicionales para la aprobación..."
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
    );
};

export default ResponsibilityNotes;
