import React from 'react';
import { Box, Paper, Typography, Button, Collapse } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * Interfaz que define las propiedades para la barra de acciones masivas.
 */
interface BulkActionBarProps {
    /** Cantidad total de elementos que se encuentran actualmente seleccionados. */
    selectedCount: number;
    /** Nombre de la entidad o recurso en formato plural (ejemplo: "usuarios", "roles"). */
    resourceNamePlural: string;
    /** Nombre de la entidad o recurso en formato singular. */
    resourceNameSingular: string;
    /** Indicador de género gramatical femenino para ajustar la concordancia de los textos (ejemplo: "reserva"). */
    isFeminine?: boolean;
    /** Función callback ejecutada para limpiar la selección actual en su totalidad. */
    onClearSelection: () => void;
    /** Función callback ejecutada para iniciar el proceso de eliminación por lotes. */
    onDelete: () => void;
    /** Etiqueta de texto personalizada para el botón de borrado masivo. */
    deleteLabel?: string;
    /** Indicador que señala si la selección actual abarca a todos los elementos globalmente, más allá de la página actual. */
    isGlobalSelection?: boolean;
    /** Indicador que señala si todos los elementos de la página actual han sido seleccionados. */
    isPageFull?: boolean;
    /** Número total de elementos existentes en el conjunto global, útil para notificar al usuario. */
    totalElements?: number;
    /** Función callback ejecutada para activar la selección global de todos los elementos disponibles. */
    onSelectAllGlobal?: () => void;
    /** Indicador de autorización que permite o restringe la acción de eliminación para el usuario actual. */
    canDelete?: boolean;
}

/**
 * Componente modularizado de barra de acciones para la gestión masiva de registros.
 * Ofrece retroalimentación visual sobre la selección, provee accesos rápidos para deseleccionar 
 * y facilita el inicio de operaciones en lote como la eliminación global.
 * 
 * @param props - Propiedades de configuración y estado para la barra de acciones.
 * @returns Componente React que despliega una barra contextual superior.
 */
const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    resourceNamePlural,
    resourceNameSingular,
    isFeminine = false,
    onClearSelection,
    onDelete,
    deleteLabel = "Eliminar Lote",
    isGlobalSelection = false,
    isPageFull = false,
    totalElements = 0,
    onSelectAllGlobal,
    canDelete = true
}) => {
    const hasSelection = selectedCount > 0;
    const showGlobalBanner = !isGlobalSelection && isPageFull && onSelectAllGlobal && totalElements > selectedCount;

    // Sufijos de concordancia de género
    const genderSuffix = isFeminine ? 'a' : 'o';
    const pluralSuffix = selectedCount === 1 ? '' : 's';
    const selectionText = `${genderSuffix}${pluralSuffix}`;

    return (
        <Collapse in={hasSelection}>
            <Box sx={{ mb: 2 }}>
                <Paper 
                    elevation={4} 
                    sx={{ 
                        p: 2, display: 'flex', alignItems: 'center', 
                        justifyContent: 'space-between', bgcolor: 'primary.main', color: 'white',
                        borderRadius: showGlobalBanner ? '8px 8px 0 0' : 2,
                        transition: 'border-radius 0.2s'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            {isGlobalSelection 
                                ? `${isFeminine ? 'Todas las' : 'Todos los'} ${totalElements} ${resourceNamePlural} están seleccionad${isFeminine ? 'as' : 'os'}` 
                                : `${selectedCount} ${selectedCount === 1 ? resourceNameSingular : resourceNamePlural} seleccionad${selectionText}`}
                        </Typography>
                        <Button 
                            size="small" 
                            onClick={onClearSelection} 
                            sx={{ color: 'rgba(255,255,255,0.8)', textTransform: 'none', '&:hover': { color: 'white' } }}
                        >
                            Desmarcar todos
                        </Button>
                    </Box>
                    {canDelete && (
                        <Button 
                            variant="contained" 
                            color="error" 
                            startIcon={<DeleteIcon />}
                            onClick={onDelete}
                            sx={{ 
                                bgcolor: 'white', 
                                color: 'error.main', 
                                '&:hover': { bgcolor: '#ffebee' },
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isGlobalSelection ? 'Eliminar Todos' : deleteLabel}
                        </Button>
                    )}
                </Paper>

                {showGlobalBanner && (
                    <Paper 
                        square elevation={0} 
                        sx={{ 
                            bgcolor: 'primary.light', color: 'primary.contrastText', 
                            p: 1, textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '0 0 8px 8px'
                        }}
                    >
                        <Typography variant="body2">
                            Se han seleccionado {isFeminine ? 'las' : 'los'} {resourceNamePlural} de esta página. {' '}
                            <Button 
                                size="small" 
                                onClick={onSelectAllGlobal}
                                sx={{ color: 'white', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'none' }}
                            >
                                Seleccionar {isFeminine ? 'las' : 'los'} {totalElements} {resourceNamePlural} que coinciden con los filtros
                            </Button>
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Collapse>
    );
};

export default BulkActionBar;
