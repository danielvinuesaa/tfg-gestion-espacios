import { TextField, FormControl, InputLabel, Select, MenuItem, Tooltip } from '@mui/material';
import FilterBar from '../../../../shared/components/FilterBar';

/**
 * Propiedades para el componente SpaceFilters.
 */
interface SpaceFiltersProps {
    /** Término de búsqueda actual para filtrar por nombre. */
    searchName: string;
    /** Función para actualizar el término de búsqueda. */
    setSearchName: (val: string) => void;
    /** Objeto que contiene los valores de los filtros aplicados (tipo, estado, capacidades). */
    filters: any;
    /** Indica si se deben incluir en los resultados los espacios eliminados. */
    includeDeleted: boolean;
    /** Función para alternar la visualización de los espacios eliminados. */
    setIncludeDeleted: (val: boolean) => void;
    /** 
     * Función que maneja el cambio de un filtro específico.
     * @param field - El campo a filtrar.
     * @param val - El nuevo valor para dicho campo.
     */
    handleFilterChange: (field: string, val: any) => void;
    /** Función para restablecer todos los filtros a sus valores predeterminados. */
    clearFilters: () => void;
    /** Función para establecer la página actual de resultados. */
    setPage: (page: number) => void;
}

/**
 * Componente de panel de filtrado para la gestión de espacios.
 * Integra un FilterBar base e incorpora campos personalizados como tipo de espacio,
 * estado operativo, capacidad máxima y número mínimo de ordenadores.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que conforma la barra de filtrado completa.
 */
const SpaceFilters = ({ 
    searchName, setSearchName, 
    filters, 
    includeDeleted, setIncludeDeleted,
    handleFilterChange, clearFilters, setPage 
}: SpaceFiltersProps) => {
    
    // Filtros activos (excluyendo includeDeleted que es preferencia de vista)
    const hasActiveFilters = !!(searchName || filters.type || filters.status || filters.minCapacity || filters.minComputers);

    return (
        <FilterBar
            searchQuery={searchName}
            onSearchChange={setSearchName}
            searchPlaceholder="Buscar por nombre..."
            showDeleted={includeDeleted}
            onShowDeletedChange={(val) => { setIncludeDeleted(val); setPage(0); }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => { clearFilters(); setPage(0); }}
        >
            {/* Filtros Personalizados: Tipo */}
            <FormControl size="small" sx={{ bgcolor: 'white', flex: '1 1 120px' }}>
                <InputLabel id="space-type-filter-label">Tipo</InputLabel>
                <Select
                    labelId="space-type-filter-label"
                    id="space-type-filter"
                    value={filters.type || ''}
                    label="Tipo"
                    onChange={(e) => { handleFilterChange('type', e.target.value); setPage(0); }}
                >
                    <MenuItem value=""><em>Todos</em></MenuItem>
                    <MenuItem value="AULA">Aula</MenuItem>
                    <MenuItem value="LABORATORIO">Laboratorio</MenuItem>
                    <MenuItem value="SALA_ESTUDIO">Sala de Estudio</MenuItem>
                    <MenuItem value="DESPACHO">Despacho</MenuItem>
                    <MenuItem value="SALON_ACTOS">Salón de Actos</MenuItem>
                </Select>
            </FormControl>

            {/* Filtros Personalizados: Estado */}
            <FormControl size="small" sx={{ bgcolor: 'white', flex: '1 1 120px' }}>
                <InputLabel id="space-status-filter-label">Estado</InputLabel>
                <Select
                    labelId="space-status-filter-label"
                    id="space-status-filter"
                    value={filters.status || ''}
                    label="Estado"
                    onChange={(e) => { handleFilterChange('status', e.target.value); setPage(0); }}
                >
                    <MenuItem value=""><em>Todos los operativos</em></MenuItem>
                    <MenuItem value="DISPONIBLE">Solo Disponibles</MenuItem>
                    <MenuItem value="BLOQUEADO">Solo Bloqueados</MenuItem>
                </Select>
            </FormControl>

            {/* Filtros Personalizados: Capacidad Mínima */}
            <Tooltip title="Capacidad mínima" arrow placement="top">
                <TextField
                    size="small" 
                    label="Cap. Mín." 
                    type="number"
                    value={filters.minCapacity || ''} 
                    onChange={(e) => { 
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val < 0) return;
                        handleFilterChange('minCapacity', e.target.value); 
                        setPage(0); 
                    }} 
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ bgcolor: 'white', flex: '0.5 1 80px' }}
                />
            </Tooltip>

            {/* Filtros Personalizados: Ordenadores Mínimos */}
            <Tooltip title="Mínimo de ordenadores" arrow placement="top">
                <TextField
                    size="small" 
                    label="Ord. Mín." 
                    type="number"
                    value={filters.minComputers || ''} 
                    onChange={(e) => { 
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val < 0) return;
                        handleFilterChange('minComputers', e.target.value); 
                        setPage(0); 
                    }} 
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ bgcolor: 'white', flex: '0.5 1 80px' }}
                />
            </Tooltip>

        </FilterBar>
    );
};

export default SpaceFilters;
