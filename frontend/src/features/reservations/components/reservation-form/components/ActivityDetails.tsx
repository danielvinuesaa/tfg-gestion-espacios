import { useMemo } from 'react';
import { Grid, Divider, Typography, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Autocomplete, FormHelperText, Box, ListSubheader } from '@mui/material';
import TitleIcon from '@mui/icons-material/Title';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import type { ReservationType, Subject } from '../../../../../shared/types';
import type { ReservationFormData } from '../../../hooks/useReservationForm';

/**
 * Propiedades del componente ActivityDetails.
 */
interface ActivityDetailsProps {
    formData: ReservationFormData;
    setFormData: (data: Partial<ReservationFormData>) => void;
    subjects: Subject[];
    isSubjectRequired: boolean;
    isDirty: boolean;
    getFieldError: (field: string) => string | null;
    handleBlur: (field: string) => void;
    touched: Record<string, boolean>;
}

/**
 * Componente destinado a recabar los metadatos y categorización de la actividad en el formulario de reservas.
 * 
 * Proporciona los campos para establecer el título de la reserva, seleccionar la tipología
 * del evento (clase, examen u otro) y vincular opcionalmente (o de forma forzada según configuración)
 * el evento a una asignatura de la oferta formativa.
 * 
 * @param props - Propiedades para la inyección de datos y gestión de eventos de entrada.
 * @param props.formData - Estructura actual con los valores del formulario.
 * @param props.setFormData - Callback para propagar las modificaciones en los campos locales hacia el estado global.
 * @param props.subjects - Colección de asignaturas disponibles para la vinculación académica.
 * @param props.isSubjectRequired - Flag que dictamina si el campo asignatura debe tratarse como un requerimiento estricto.
 * @param props.isDirty - Flag indicador de que el formulario ha sufrido modificaciones respecto a su estado inicial.
 * @param props.getFieldError - Utilidad para obtener posibles errores de validación de los campos aquí renderizados.
 * @param props.handleBlur - Disparador del evento "blur" para marcaje de campos como tocados.
 * @param props.touched - Diccionario de campos que han recibido interacción previa.
 * @returns Elemento React con el sub-formulario para detalles de actividad.
 */
const ActivityDetails = ({ 
    formData, setFormData, subjects, isSubjectRequired, 
    getFieldError, handleBlur, touched 
}: ActivityDetailsProps) => {

    const titleError = getFieldError('title') || (touched.title && !formData.title?.trim() ? "El título es obligatorio" : "");
    const typeError = getFieldError('type') || (touched.type && !formData.type ? "Debe seleccionar un tipo de actividad" : "");
    const subjectError = getFieldError('subjectId') || (touched.subjectId && isSubjectRequired && !formData.subjectId ? "La asignatura es obligatoria" : "");

    // Ordenar asignaturas por curso y nombre
    const sortedSubjects = useMemo(() => {
        return [...subjects].sort((a, b) => {
            if (a.course !== b.course) return Number(a.course) - Number(b.course);
            return a.name.localeCompare(b.name);
        });
    }, [subjects]);

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Divider sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                        Detalles de la Actividad
                    </Typography>
                </Divider>
            </Grid>

            <Grid item xs={12}>
                <TextField
                    fullWidth required
                    label="Título de la Actividad"
                    placeholder="Ej: Clase Magistral de Redes, Examen Final..."
                    value={formData.title}
                    onChange={(e) => setFormData({ title: e.target.value })}
                    onBlur={() => handleBlur('title')}
                    error={!!titleError}
                    helperText={titleError}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <TitleIcon fontSize="small" color="action" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth required error={!!typeError}>
                    <InputLabel>Tipo de Actividad</InputLabel>
                    <Select
                        value={formData.type || ''}
                        label="Tipo de Actividad"
                        onChange={(e) => setFormData({ type: e.target.value as ReservationType })}
                        onBlur={() => handleBlur('type')}
                        startAdornment={
                            <InputAdornment position="start" sx={{ ml: 1 }}>
                                <CategoryIcon fontSize="small" color="action" />
                            </InputAdornment>
                        }
                    >
                        <MenuItem value="CLASE">Clase</MenuItem>
                        <MenuItem value="EXAMEN">Examen</MenuItem>
                        <MenuItem value="OTRO">Otro</MenuItem>
                    </Select>
                    {typeError && <FormHelperText>{typeError}</FormHelperText>}
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Autocomplete
                    options={sortedSubjects}
                    groupBy={(o) => `Curso ${o.course}`}
                    getOptionLabel={(o) => `[${o.code}] ${o.name}`}
                    value={subjects.find(s => s.id === formData.subjectId) || null}
                    onChange={(_, val) => setFormData({ subjectId: val ? val.id : null })}
                    onBlur={() => handleBlur('subjectId')}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label={isSubjectRequired ? "Asignatura" : "Asignatura (Opcional)"} 
                            placeholder="Buscar asignatura..."
                            required={isSubjectRequired}
                            error={!!subjectError}
                            helperText={subjectError}
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <>
                                        <InputAdornment position="start">
                                            <SchoolIcon fontSize="small" color="action" />
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
                                <Typography variant="overline" fontWeight="800" color="primary.dark">
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
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="body2" fontWeight={selected ? "bold" : "medium"}>
                                        {option.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Código: {option.code}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    }}
                />
            </Grid>
        </Grid>
    );
};

export default ActivityDetails;
