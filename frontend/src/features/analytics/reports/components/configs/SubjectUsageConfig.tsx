import { Grid, TextField, Autocomplete, Typography, Box, Divider, Checkbox, Link, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { Subject } from '../../../../../shared/types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

const RESERVATION_TYPES = [
    { value: 'CLASE', label: 'Sesiones de Clase' },
    { value: 'EXAMEN', label: 'Exámenes y Pruebas' },
    { value: 'OTRO', label: 'Otros Eventos' }
];

/**
 * Propiedades del componente SubjectUsageConfig.
 */
interface SubjectUsageConfigProps {
    /** Fecha de inicio para el periodo de auditoría. */
    startDate: Date | null;
    /** Callback para actualizar la fecha de inicio. */
    onStartDateChange: (date: Date | null) => void;
    /** Fecha de fin para el periodo de auditoría. */
    endDate: Date | null;
    /** Callback para actualizar la fecha de fin. */
    onEndDateChange: (date: Date | null) => void;
    /** Listado de IDs de asignaturas seleccionadas. */
    selectedSubjectIds: number[];
    /** Callback para actualizar el listado de asignaturas. */
    onSubjectsChange: (ids: number[]) => void;
    /** Listado de tipos de reserva seleccionados (CLASE, EXAMEN, OTRO). */
    reservationTypes: string[];
    /** Callback para actualizar los tipos de reserva. */
    onReservationTypesChange: (types: string[]) => void;
    /** Catálogo total de asignaturas disponibles. */
    availableSubjects: Subject[];
}

/**
 * Componente de configuración para el Informe de Uso por Asignatura.
 * 
 * Facilita el análisis detallado permitiendo filtrar mediante:
 * - Un rango temporal configurable.
 * - Una o múltiples asignaturas, agrupadas por curso académico para facilitar su selección.
 * - La tipología específica de la actividad (por ejemplo: Clases, Exámenes u Otros).
 *
 * @param props - Propiedades que incluyen el estado de la configuración y los callbacks de actualización.
 * @returns Un elemento JSX que agrupa los controles de configuración del informe.
 */
const SubjectUsageConfig = ({
    startDate, onStartDateChange, endDate, onEndDateChange,
    selectedSubjectIds, onSubjectsChange, 
    reservationTypes, onReservationTypesChange,
    availableSubjects
}: SubjectUsageConfigProps) => {

    const selectedSubjects = availableSubjects.filter(s => selectedSubjectIds.includes(s.id));

    const sortedSubjects = [...availableSubjects].sort((a, b) => {
        const courseA = String(a.course || '0');
        const courseB = String(b.course || '0');
        if (courseA !== courseB) return courseA.localeCompare(courseB);
        return a.name.localeCompare(b.name);
    });

    const handleSelectAllSubjects = (isChecked: boolean) => {
        onSubjectsChange(isChecked ? availableSubjects.map(s => s.id) : []);
    };

    const handleSelectCourse = (course: string, subjectsInCourse: Subject[]) => {
        const courseIds = subjectsInCourse.map(s => s.id);
        const selectedInCourse = selectedSubjectIds.filter(id => courseIds.includes(id));
        
        if (selectedInCourse.length === subjectsInCourse.length) {
            onSubjectsChange(selectedSubjectIds.filter(id => !courseIds.includes(id)));
        } else {
            onSubjectsChange(Array.from(new Set([...selectedSubjectIds, ...courseIds])));
        }
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
                <DatePicker
                    label="Fecha Inicio"
                    value={startDate}
                    onChange={onStartDateChange}
                    maxDate={endDate || undefined}
                    slotProps={{ textField: { fullWidth: true } }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <DatePicker
                    label="Fecha Fin"
                    value={endDate}
                    onChange={onEndDateChange}
                    minDate={startDate || undefined}
                    slotProps={{ textField: { fullWidth: true } }}
                />
            </Grid>

            <Grid item xs={12} md={7}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                    Selección de Asignaturas
                </Typography>
                <Autocomplete
                    multiple
                    disableCloseOnSelect
                    limitTags={2}
                    options={sortedSubjects}
                    groupBy={(option) => `Curso ${option.course}`}
                    getOptionLabel={(option) => `[${option.code}] ${option.name}`}
                    value={selectedSubjects}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_e, val) => onSubjectsChange(val.map(s => s.id))}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            placeholder={selectedSubjectIds.length === 0 ? "Añadir asignatura..." : ""}
                        />
                    )}
                    renderGroup={(params) => {
                        const courseLabel = params.group;
                        const courseValue = courseLabel.replace('Curso ', '');
                        const subjectsInCourse = availableSubjects.filter(s => String(s.course) === courseValue);
                        const isAllSelected = subjectsInCourse.every(s => selectedSubjectIds.includes(s.id));

                        return (
                            <Box key={params.key}>
                                <Box sx={{ 
                                    px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    bgcolor: '#f0f4f8', 
                                    borderBottom: '1px solid #e0e0e0',
                                    position: 'sticky', top: 0, zIndex: 1,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <Typography variant="overline" fontWeight="800" color="primary.dark">
                                        {courseLabel.toUpperCase()}
                                    </Typography>
                                    <Link 
                                        component="button" variant="caption" 
                                        onClick={() => handleSelectCourse(courseValue, subjectsInCourse)}
                                        sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                                    >
                                        {isAllSelected ? 'DESMARCAR CURSO' : 'MARCAR CURSO'}
                                    </Link>
                                </Box>
                                <Box sx={{ py: 0.5 }}>{params.children}</Box>
                            </Box>
                        );
                    }}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props as any;
                        return (
                            <Box component="li" key={key} {...otherProps} sx={{ px: 2, py: 0.5 }}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
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
                <Box sx={{ mt: 0.5 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={selectedSubjectIds.length === availableSubjects.length && availableSubjects.length > 0}
                                indeterminate={selectedSubjectIds.length > 0 && selectedSubjectIds.length < availableSubjects.length}
                                onChange={(e) => handleSelectAllSubjects(e.target.checked)}
                            />
                        }
                        label={
                            <Typography variant="caption" color="text.secondary">
                                Seleccionar todas ({availableSubjects.length})
                            </Typography>
                        }
                    />
                </Box>
            </Grid>

            <Grid item xs={12} md={5}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                    Filtrar por Tipos de Reserva
                </Typography>
                <Autocomplete
                    multiple
                    disableCloseOnSelect
                    options={RESERVATION_TYPES}
                    getOptionLabel={(option) => option.label}
                    value={RESERVATION_TYPES.filter(t => reservationTypes.includes(t.value))}
                    onChange={(_e, val) => onReservationTypesChange(val.map(t => t.value))}
                    isOptionEqualToValue={(option, value) => option.value === value.value}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            placeholder={reservationTypes.length === 0 ? "Todos los tipos" : ""}
                        />
                    )}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props as any;
                        return (
                            <Box component="li" key={key} {...otherProps}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
                                {option.label}
                            </Box>
                        );
                    }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mt: 0.5, display: 'block' }}>
                    Si no selecciona ninguno, se incluirán todos.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default SubjectUsageConfig;
