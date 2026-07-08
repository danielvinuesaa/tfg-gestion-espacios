import React, { useState } from 'react';
import { 
    Paper, Box, Typography, FormControlLabel, Switch, Stack, 
    Button, CircularProgress, Alert 
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

// Subcomponentes refactorizados
import DistributionSelector from './DistributionSelector';
import SpaceTypeSelector from './filters/SpaceTypeSelector';
import CapacityInput from './filters/CapacityInput';
import FixedModeFields from './filters/FixedModeFields';
import FlexibleModeFields from './filters/FlexibleModeFields';

/**
 * Propiedades para el componente SearchFilters.
 */
interface SearchFiltersProps {
    /** Objeto con los valores de los filtros actuales. */
    filters: any;
    /** Función para actualizar el estado de los filtros. */
    setFilters: (filters: any) => void;
    /** Indica si hay una búsqueda en proceso. */
    loading: boolean;
    /** Mensaje de error, en caso de ocurrir durante la validación o búsqueda. */
    error: string | null;
    /** Indica si el rango seleccionado incluye únicamente fines de semana. */
    isOnlyWeekendsSelected: boolean;
    /** Función a ejecutar para enviar la petición de búsqueda. */
    onSearch: (e?: React.FormEvent) => void;
    /** Función para restablecer los filtros a sus valores predeterminados. */
    onClear: () => void;
    /** Configuración y restricciones horarias de la aplicación. */
    timeSettings: any;
    /** Indica si los resultados actuales están desactualizados con respecto a los filtros. */
    isStale?: boolean;
    /** Indica si ya se ha realizado una búsqueda previa. */
    searched?: boolean;
}

/**
 * Componente que representa el panel de filtros para la búsqueda de disponibilidad de espacios.
 * Permite alternar entre modos de búsqueda (fijo o flexible) y ajustar parámetros
 * como el tipo de espacio, capacidad y ratio de distribución.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el formulario de filtros.
 */
const SearchFilters = ({ 
    filters, 
    setFilters, 
    loading, 
    error, 
    isOnlyWeekendsSelected, 
    onSearch, 
    onClear,
    timeSettings,
    isStale,
    searched
}: SearchFiltersProps) => {
    const [resetKey, setResetKey] = useState(0);

    const handleClear = () => {
        onClear();
        setResetKey(prev => prev + 1);
    };

    return (
        <Paper component="form" onSubmit={onSearch} sx={{ p: 3, borderRadius: 4, border: '1px solid #eee', position: 'sticky', top: 24 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">Filtros</Typography>
                <FormControlLabel
                    control={
                        <Switch 
                            checked={filters.flexible} 
                            onChange={(e) => setFilters({ ...filters, flexible: e.target.checked })} 
                            size="small"
                        />
                    }
                    label={<Typography variant="caption" fontWeight="bold">Flexible</Typography>}
                    labelPlacement="start"
                />
            </Box>
            
            <Stack spacing={3}>
                {!filters.flexible ? (
                    <FixedModeFields 
                        filters={filters} 
                        setFilters={setFilters} 
                        timeSettings={timeSettings} 
                    />
                ) : (
                    <FlexibleModeFields 
                        filters={filters} 
                        setFilters={setFilters} 
                        timeSettings={timeSettings} 
                    />
                )}

                <SpaceTypeSelector 
                    value={filters.types} 
                    onChange={(val) => setFilters({ ...filters, types: val })} 
                />

                <CapacityInput 
                    value={filters.minCapacity} 
                    onChange={(val) => setFilters({ ...filters, minCapacity: val })} 
                />

                <DistributionSelector
                    key={resetKey}
                    value={filters.distributionRatio}
                    onChange={(val) => setFilters({ ...filters, distributionRatio: val })}
                />

                {error && <Alert severity="error">{error}</Alert>}

                {isOnlyWeekendsSelected && (
                    <Alert severity="warning" sx={{ borderRadius: 2 }}>
                        El rango elegido solo tiene fines de semana. Activa <strong>'Incluir fines de semana'</strong> o cambia las fechas.
                    </Alert>
                )}

                <Button 
                    type="submit" 
                    variant="contained" 
                    size="large" 
                    fullWidth 
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                    disabled={loading || isOnlyWeekendsSelected}
                    color={isStale ? "warning" : "primary"}
                    sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                >
                    {loading ? "Buscando..." : (isStale ? "Actualizar Propuestas" : "Ver Propuestas")}
                </Button>

                <Button 
                    variant="outlined" 
                    color="inherit"
                    onClick={handleClear}
                    startIcon={<FilterAltOffIcon />}
                    fullWidth
                    sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                    Limpiar Filtros
                </Button>
            </Stack>
        </Paper>
    );
};

export default SearchFilters;
