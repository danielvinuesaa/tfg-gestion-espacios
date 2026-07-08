import { TextField, MenuItem, Stack, Button, ListSubheader, FormControl, InputLabel, Select } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FilterBar from '../../../shared/components/FilterBar';
import { ACTION_CONFIG, AUDIT_CATEGORIES } from '../constants/auditConstants';
import type { AuditCategory } from '../constants/auditConstants';

/**
 * Propiedades del componente AuditFilters.
 */
interface AuditFiltersProps {
    performedBy: string;
    onPerformedByChange: (val: string) => void;
    actionFilter: string;
    onActionFilterChange: (val: string) => void;
    startDate: Date | null;
    onStartDateChange: (val: Date | null) => void;
    endDate: Date | null;
    onEndDateChange: (val: Date | null) => void;
    onApplyDates: () => void;
    onClear: () => void;
    hasFilters: boolean;
}

/**
 * Componente modular de filtrado para la vista del Historial de Auditoría.
 * Agrupa opciones de búsqueda por usuario, selector de acciones categorizadas y filtrado por rangos de fecha,
 * integrándose con el componente genérico FilterBar para mantener la consistencia visual de la aplicación.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento de React con los controles de filtrado.
 */
const AuditFilters = ({
    performedBy, onPerformedByChange,
    actionFilter, onActionFilterChange,
    startDate, onStartDateChange,
    endDate, onEndDateChange,
    onApplyDates, onClear, hasFilters
}: AuditFiltersProps) => {

    // Agrupar acciones por categoría para el selector
    const groupedActions = Object.entries(ACTION_CONFIG).reduce((acc, [value, config]) => {
        const cat = config.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push({ value, label: config.label });
        return acc;
    }, {} as Record<AuditCategory, Array<{ value: string; label: string }>>);

    return (
        <FilterBar
            searchQuery={performedBy}
            onSearchChange={onPerformedByChange}
            searchPlaceholder="Buscar por usuario (email o nombre)..."
            hasActiveFilters={hasFilters}
            onClearFilters={onClear}
            mb={4}
        >
            {/* Filtro por Acción (Agrupado) */}
            <FormControl size="small" sx={{ bgcolor: 'white', flex: 1, minWidth: 200 }}>
                <InputLabel>Acción</InputLabel>
                <Select
                    value={actionFilter}
                    label="Acción"
                    onChange={(e) => onActionFilterChange(e.target.value)}
                >
                    <MenuItem value=""><em>Todas las acciones</em></MenuItem>
                    {Object.entries(AUDIT_CATEGORIES).map(([catKey, catConfig]) => [
                        <ListSubheader key={catKey} sx={{ fontWeight: 800, color: 'primary.main', lineHeight: '32px', bgcolor: 'action.hover' }}>
                            {catConfig.label.toUpperCase()}
                        </ListSubheader>,
                        ...(groupedActions[catKey as AuditCategory] || []).map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ pl: 4 }}>
                                {opt.label}
                            </MenuItem>
                        ))
                    ])}
                </Select>
            </FormControl>

            {/* Rango de Fechas */}
            <Stack direction="row" spacing={1} sx={{ flex: 1.5, minWidth: 'fit-content' }}>
                <DatePicker 
                    label="Desde" 
                    value={startDate} 
                    onChange={onStartDateChange} 
                    maxDate={endDate || undefined}
                    slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', flex: 1 } } }} 
                />
                <DatePicker 
                    label="Hasta" 
                    value={endDate} 
                    onChange={onEndDateChange} 
                    minDate={startDate || undefined}
                    slotProps={{ textField: { size: 'small', sx: { bgcolor: 'white', flex: 1 } } }} 
                />
                <Button 
                    variant="contained" 
                    onClick={onApplyDates} 
                    sx={{ minWidth: 48, boxShadow: 1 }}
                    title="Aplicar rango de fechas"
                >
                    <CalendarMonthIcon fontSize="small" />
                </Button>
            </Stack>
        </FilterBar>
    );
};

export default AuditFilters;
