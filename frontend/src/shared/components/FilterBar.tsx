import React from 'react';
import { 
    Box, 
    TextField, 
    InputAdornment, 
    IconButton, 
    FormControlLabel, 
    Switch, 
    Button, 
    Paper, 
    Stack,
    useMediaQuery,
    useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

/**
 * Interfaz que define las propiedades para el componente FilterBar.
 */
interface FilterBarProps {
    /** Valor de la búsqueda principal */
    searchQuery: string;
    /** Callback cuando cambia la búsqueda */
    onSearchChange: (value: string) => void;
    /** Placeholder para el campo de búsqueda */
    searchPlaceholder?: string;
    
    /** Estado del interruptor "Incluir eliminados" */
    showDeleted?: boolean;
    /** Callback cuando cambia el interruptor de eliminados */
    onShowDeletedChange?: (value: boolean) => void;
    /** Etiqueta para el interruptor de eliminados */
    showDeletedLabel?: string;

    /** Indica si hay filtros activos para mostrar el botón de limpiar */
    hasActiveFilters?: boolean;
    /** Callback para limpiar todos los filtros */
    onClearFilters?: () => void;

    /** Filtros adicionales (selects, inputs, etc.) que van en la barra principal */
    children?: React.ReactNode;
    
    /** Contenido adicional que aparecerá debajo de la barra (ej: paneles colapsables) */
    extraContent?: React.ReactNode;

    /** Espaciado inferior (default: 3) */
    mb?: number;
}

/**
 * Componente genérico profesional para barras de filtrado y búsqueda.
 * Unifica el diseño de los filtros en todos los módulos de gestión.
 * 
 * @param props - Propiedades del componente de filtrado.
 * @returns {JSX.Element} El componente visual de la barra de filtros.
 */
const FilterBar: React.FC<FilterBarProps> = ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    showDeleted,
    onShowDeletedChange,
    showDeletedLabel = "Incluir eliminados",
    hasActiveFilters = false,
    onClearFilters,
    children,
    extraContent,
    mb = 3
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
                p: 2, 
                mb: mb, 
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '1px solid #eee'
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Stack 
                    direction={isMobile ? "column" : "row"} 
                    spacing={2} 
                    alignItems={isMobile ? "stretch" : "center"}
                    justifyContent="space-between"
                >
                    {/* Bloque Izquierdo: Búsqueda y Filtros Rápidos */}
                    <Box sx={{ 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 2,
                        flexGrow: 1,
                        alignItems: isMobile ? 'stretch' : 'center'
                    }}>
                        <TextField
                            placeholder={searchPlaceholder}
                            value={searchQuery || ''}
                            onChange={(e) => onSearchChange(e.target.value)}
                            size="small"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                                endAdornment: (searchQuery || '') ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="limpiar búsqueda"
                                            onClick={() => onSearchChange('')}
                                            edge="end"
                                            size="small"
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                            sx={{ 
                                bgcolor: 'white', 
                                // Permitimos que crezca (1) y tenga una base mínima razonable
                                flex: isMobile ? '1 1 auto' : '1 1 300px',
                            }}
                        />
                        
                        {/* Filtros Personalizados (Children) */}
                        {children && (
                            <Box sx={{ 
                                display: 'flex', 
                                gap: 2, 
                                flexWrap: 'wrap',
                                flexGrow: 2, // Le damos más prioridad de crecimiento a los filtros personalizados
                                alignItems: 'center'
                            }}>
                                {children}
                            </Box>
                        )}
                    </Box>

                    {/* Bloque Derecho: Acciones y Switches */}
                    <Stack 
                        direction="row" 
                        spacing={1} 
                        alignItems="center" 
                        justifyContent={isMobile ? "space-between" : "flex-end"}
                        sx={{ minWidth: 'fit-content', ml: isMobile ? 0 : 2 }}
                    >
                        {onShowDeletedChange !== undefined && (
                            <FormControlLabel
                                control={
                                    <Switch 
                                        size="small"
                                        checked={showDeleted || false} 
                                        onChange={(e) => onShowDeletedChange(e.target.checked)} 
                                    />
                                }
                                label={showDeletedLabel}
                                sx={{ 
                                    mr: 1,
                                    '& .MuiTypography-root': { 
                                        fontSize: '0.85rem', 
                                        color: 'text.secondary',
                                        whiteSpace: 'nowrap'
                                    } 
                                }}
                            />
                        )}

                        {hasActiveFilters && onClearFilters && (
                            <Button 
                                variant="text" 
                                color="inherit" 
                                size="small"
                                startIcon={<FilterAltOffIcon />}
                                onClick={onClearFilters}
                                sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}
                            >
                                Limpiar
                            </Button>
                        )}
                    </Stack>
                </Stack>

                {/* Contenido Extra: Eliminamos el Stack externo y usamos Box simple para evitar márgenes fantasmas cuando está oculto */}
                {extraContent && (
                    <Box sx={{ width: '100%' }}>
                        {extraContent}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default FilterBar;
