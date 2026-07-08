import { 
    Grid, Typography, Box, Autocomplete, TextField, 
    Checkbox, Link, FormControlLabel 
} from '@mui/material';
import type { AutocompleteRenderGroupParams } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { Space } from '../../../../../shared/types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * Propiedades del componente OccupancyConfig.
 */
interface OccupancyConfigProps {
    /** Fecha de inicio para el cálculo de ratios. */
    startDate: Date | null;
    /** Callback para actualizar la fecha de inicio. */
    onStartDateChange: (date: Date | null) => void;
    /** Fecha de fin para el cálculo de ratios. */
    endDate: Date | null;
    /** Callback para actualizar la fecha de fin. */
    onEndDateChange: (date: Date | null) => void;
    /** Listado de IDs de espacios a auditar. */
    selectedSpaceIds: number[];
    /** Callback para actualizar el listado de espacios. */
    onSpacesChange: (ids: number[]) => void;
    /** Catálogo total de espacios disponibles. */
    availableSpaces: Space[];
}

/**
 * Componente de configuración para el Informe de Estadísticas de Ocupación.
 * 
 * Facilita el análisis de la eficiencia de uso de los espacios físicos considerando:
 * - Días lectivos laborables (de Lunes a Viernes).
 * - La franja horaria configurable del centro.
 * - La selección de espacios para comparar su saturación.
 *
 * @param props - Propiedades de configuración, incluyendo fechas y selección de espacios.
 * @returns Un elemento JSX con los controles necesarios para configurar el informe de ocupación.
 */
const OccupancyConfig = ({
    startDate, onStartDateChange, endDate, onEndDateChange,
    selectedSpaceIds, onSpacesChange, availableSpaces
}: OccupancyConfigProps) => {

    const selectedSpaces = availableSpaces.filter(s => selectedSpaceIds.includes(s.id));

    const handleSelectAll = (isChecked: boolean) => {
        onSpacesChange(isChecked ? availableSpaces.map(s => s.id) : []);
    };

    const handleSelectGroup = (groupName: string, items: Space[]) => {
        const groupSpaceIds = items.map(i => i.id);
        const selectedInGroup = selectedSpaceIds.filter(id => groupSpaceIds.includes(id));
        
        if (selectedInGroup.length === items.length) {
            onSpacesChange(selectedSpaceIds.filter(id => !groupSpaceIds.includes(id)));
        } else {
            onSpacesChange(Array.from(new Set([...selectedSpaceIds, ...groupSpaceIds])));
        }
    };

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Este informe analiza el ratio de uso frente a la capacidad total lectiva.
                </Typography>
            </Grid>
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
            <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, mb: 0.5, display: 'block' }}>
                    Selección de Espacios
                </Typography>
                <Autocomplete
                    multiple
                    disableCloseOnSelect
                    limitTags={3}
                    options={[...availableSpaces].sort((a, b) => {
                        const typeA = a.type || "OTROS";
                        const typeB = b.type || "OTROS";
                        if (typeA !== typeB) return typeA.localeCompare(typeB);
                        return a.name.localeCompare(b.name);
                    })}
                    groupBy={(option) => {
                        const type = option.type || "OTROS";
                        return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
                    }}
                    getOptionLabel={(option) => option.name}
                    value={selectedSpaces}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_e, val) => onSpacesChange(val.map(s => s.id))}
                    renderGroup={(params: AutocompleteRenderGroupParams) => {
                        const groupSpaces = availableSpaces.filter(s => {
                            const type = s.type || "OTROS";
                            const groupLabel = type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
                            return groupLabel === params.group;
                        });
                        const selectedInGroup = selectedSpaceIds.filter(id => groupSpaces.some(gs => gs.id === id));
                        const isAllSelected = selectedInGroup.length === groupSpaces.length;

                        return (
                            <Box key={params.key}>
                                <Box sx={{ 
                                    px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', 
                                    alignItems: 'center', bgcolor: '#f0f4f8', position: 'sticky', top: 0, zIndex: 1,
                                    borderBottom: '1px solid #e0e0e0'
                                }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">
                                        {params.group.toUpperCase()}
                                    </Typography>
                                    <Link 
                                        component="button" variant="caption" 
                                        onClick={() => handleSelectGroup(params.group, groupSpaces)}
                                        sx={{ textDecoration: 'none', fontWeight: 'bold' }}
                                    >
                                        {isAllSelected ? 'DESMARCAR TODO' : 'SELECCIONAR TODO'}
                                    </Link>
                                </Box>
                                <ul style={{ padding: 0 }}>{params.children}</ul>
                            </Box>
                        );
                    }}
                    renderOption={(props, option, { selected }) => {
                        const { key, ...otherProps } = props as any;
                        return (
                            <li key={key} {...otherProps}>
                                <Checkbox
                                    icon={icon}
                                    checkedIcon={checkedIcon}
                                    style={{ marginRight: 8 }}
                                    checked={selected}
                                />
                                {option.name}
                            </li>
                        );
                    }}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            placeholder={(selectedSpaceIds?.length || 0) === 0 ? "Seleccione espacios para el análisis..." : "Añadir espacio..."}
                        />
                    )}
                />
                
                <Box sx={{ mt: 1 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                size="small"
                                checked={(selectedSpaceIds?.length || 0) === availableSpaces.length && availableSpaces.length > 0}
                                indeterminate={(selectedSpaceIds?.length || 0) > 0 && (selectedSpaceIds?.length || 0) < availableSpaces.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                            />
                        }
                        label={
                            <Typography variant="caption" color="text.secondary">
                                Seleccionar todos los espacios ({availableSpaces.length})
                            </Typography>
                        }
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default OccupancyConfig;
