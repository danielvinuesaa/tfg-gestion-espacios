import { 
    Box, 
    Typography, 
    Checkbox, 
    Divider, 
    List, 
    IconButton,
    Collapse,
    Tooltip,
    Stack,
    FormControlLabel,
    FormGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useMemo, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import type { Space } from '../../../shared/types';
import { ALL_STATUSES } from '../hooks/useCalendarEvents';
import { getSpaceColors, getStatusColor, getTypeColor } from '../../../theme/reservationTheme';

/**
 * Interfaz que define las propiedades requeridas para el componente CalendarSidebar.
 */
interface CalendarSidebarProps {
    /** Lista completa de los espacios disponibles para el filtrado. */
    spaces: Space[];
    /** Arreglo que contiene los identificadores de los espacios actualmente seleccionados. */
    selectedSpaceIds: number[];
    /** Arreglo con los estados de reserva seleccionados para aplicar como filtro. */
    selectedStatuses: string[];
    /** Colección de todos los tipos de reserva existentes, detectados dinámicamente. */
    allTypes: readonly string[] | string[];
    /** Arreglo con los tipos de reserva seleccionados para aplicar como filtro. */
    selectedTypes: string[];
    /**
     * Función de retorno que se ejecuta al alternar la selección de un espacio individual.
     * @param id - Identificador único del espacio.
     */
    onToggleSpace: (id: number) => void;
    /**
     * Función de retorno que se ejecuta al alternar un grupo de espacios (por tipo o globalmente).
     * @param ids - Arreglo de identificadores de los espacios involucrados.
     * @param select - Valor booleano que indica si se deben seleccionar (true) o deseleccionar (false).
     */
    onToggleAll: (ids: number[], select: boolean) => void;
    /**
     * Función de retorno que se ejecuta al alternar la selección de un estado individual.
     * @param status - Cadena de texto que representa el estado.
     */
    onToggleStatus: (status: string) => void;
    /**
     * Función de retorno que se ejecuta al alternar la selección de todos los estados globalmente.
     * @param select - Valor booleano que indica si se deben seleccionar (true) o deseleccionar (false).
     */
    onToggleAllStatuses: (select: boolean) => void;
    /**
     * Función de retorno que se ejecuta al alternar la selección de un tipo de reserva individual.
     * @param type - Cadena de texto que representa el tipo de reserva.
     */
    onToggleType: (type: string) => void;
    /**
     * Función de retorno que se ejecuta al alternar la selección de todos los tipos de reserva globalmente.
     * @param select - Valor booleano que indica si se deben seleccionar (true) o deseleccionar (false).
     */
    onToggleAllTypes: (select: boolean) => void;
    /**
     * Función opcional que se ejecuta para cerrar la barra lateral, principalmente empleada en dispositivos móviles.
     */
    onClose?: () => void;
}

/**
 * Componente que representa la barra lateral del calendario para la gestión de filtros de visualización.
 * Su propósito principal es proveer al usuario de una interfaz para filtrar los eventos mostrados en
 * el calendario basándose en el Espacio (agrupados por tipología), el Estado de la reserva, y el
 * Tipo de actividad o reserva.
 *
 * @param props - Propiedades del componente descritas en {@link CalendarSidebarProps}.
 * @returns Elemento JSX que conforma la barra lateral interactiva de filtros.
 */
const CalendarSidebar = ({ 
    spaces, 
    selectedSpaceIds, 
    selectedStatuses,
    allTypes,
    selectedTypes,
    onToggleSpace, 
    onToggleAll, 
    onToggleStatus,
    onToggleAllStatuses,
    onToggleType,
    onToggleAllTypes,
    onClose 
}: CalendarSidebarProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    // Estado de control para las secciones colapsables del sidebar
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'estados': true,
        'tipos': true
    });

    /**
     * Lógica de agrupación de espacios:
     * Ordena alfabéticamente y agrupa por el campo 'type' del espacio.
     */
    const groupedSpaces = useMemo(() => {
        const sortedSpaces = [...spaces].sort((a, b) => a.name.localeCompare(b.name));
        const grouped = sortedSpaces.reduce((acc, space) => {
            const type = space.type || 'Otros';
            if (!acc[type]) acc[type] = [];
            acc[type].push(space);
            return acc;
        }, {} as Record<string, Space[]>);

        const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
        const finalGrouped: Record<string, Space[]> = {};
        sortedKeys.forEach(key => {
            finalGrouped[key] = grouped[key];
        });
        return finalGrouped;
    }, [spaces]);

    /**
     * Auto-expandir nuevas categorías de espacios cuando se cargan.
     */
    useEffect(() => {
        const types = Object.keys(groupedSpaces);
        if (types.length > 0) {
            setExpanded(prev => {
                const newExpanded = { ...prev };
                types.forEach(type => {
                    if (newExpanded[type] === undefined) newExpanded[type] = true;
                });
                return newExpanded;
            });
        }
    }, [groupedSpaces]);

    const handleToggleExpand = (sectionKey: string) => {
        setExpanded(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const handleSelectAllSpaces = () => onToggleAll(spaces.map(s => s.id), true);
    const handleDeselectAllSpaces = () => onToggleAll(spaces.map(s => s.id), false);
    
    const handleCollapseAll = () => {
        const newExpanded: Record<string, boolean> = { 'estados': false, 'tipos': false };
        Object.keys(groupedSpaces).forEach(type => newExpanded[type] = false);
        setExpanded(newExpanded);
    };

    const handleExpandAll = () => {
        const newExpanded: Record<string, boolean> = { 'estados': true, 'tipos': true };
        Object.keys(groupedSpaces).forEach(type => newExpanded[type] = true);
        setExpanded(newExpanded);
    };

    return (
        <Box sx={{ width: 320, p: 2, bgcolor: 'white', borderRight: '1px solid #dadce0', height: '100%', overflowY: 'auto' }}>
            {isMobile && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <Tooltip title="Cerrar panel">
                        <IconButton onClick={onClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#5f6368', letterSpacing: 1.2 }}>
                    MIS ESPACIOS
                </Typography>
                
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Seleccionar todos">
                        <IconButton size="small" onClick={handleSelectAllSpaces}>
                            <CheckBoxIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Deseleccionar todos">
                        <IconButton size="small" onClick={handleDeselectAllSpaces}>
                            <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: '#5f6368' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Colapsar todo">
                        <IconButton size="small" onClick={handleCollapseAll}>
                            <UnfoldLessIcon fontSize="small" sx={{ color: '#5f6368' }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Expandir todo">
                        <IconButton size="small" onClick={handleExpandAll}>
                            <UnfoldMoreIcon fontSize="small" sx={{ color: '#5f6368' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <List sx={{ width: '100%', bgcolor: 'background.paper', mb: 4 }} component="nav" disablePadding>
                {Object.entries(groupedSpaces).map(([type, items]) => {
                    const typeIds = items.map(i => i.id);
                    const selectedInType = typeIds.filter(id => selectedSpaceIds.includes(id));
                    const allSelected = selectedInType.length === typeIds.length;
                    const isIndeterminate = selectedInType.length > 0 && selectedInType.length < typeIds.length;
                    const isExpanded = expanded[type];

                    return (
                        <Box key={type} sx={{ mb: 1 }}>
                            <Box 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    py: 0.5,
                                    px: 1,
                                    borderRadius: 1,
                                    '&:hover': { bgcolor: '#f1f3f4' }
                                }}
                            >
                                <Checkbox
                                    size="small"
                                    checked={allSelected}
                                    indeterminate={isIndeterminate}
                                    onChange={(e) => onToggleAll(typeIds, e.target.checked)}
                                    sx={{ p: 0.5, color: '#5f6368' }}
                                />
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        flexGrow: 1, 
                                        fontWeight: 600, 
                                        color: '#3c4043', 
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        ml: 1
                                    }}
                                    onClick={() => handleToggleExpand(type)}
                                >
                                    {type} ({items.length})
                                </Typography>
                                <IconButton size="small" onClick={() => handleToggleExpand(type)}>
                                    {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                </IconButton>
                            </Box>
                            
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <FormGroup sx={{ ml: 2, mt: 0.5 }}>
                                    {items.map((space) => (
                                        <FormControlLabel
                                            key={space.id}
                                            control={
                                                <Checkbox 
                                                    size="small"
                                                    checked={selectedSpaceIds.includes(space.id)}
                                                    onChange={() => onToggleSpace(space.id)}
                                                    sx={{ 
                                                        p: 0.5,
                                                        color: getSpaceColors(space.type || 'OTROS').text,
                                                        '&.Mui-checked': { color: getSpaceColors(space.type || 'OTROS').text }
                                                    }}
                                                />
                                            }
                                            label={
                                                <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#3c4043' }}>
                                                    {space.name}
                                                </Typography>
                                            }
                                            sx={{ mb: 0, ml: 0, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 } }}
                                        />
                                    ))}
                                </FormGroup>
                            </Collapse>
                        </Box>
                    );
                })}
            </List>

            {/* Sección: Filtrado por Tipo de Reserva */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#5f6368', letterSpacing: 1.2 }}>
                    TIPOS DE RESERVA
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Seleccionar todos">
                        <IconButton size="small" onClick={() => onToggleAllTypes(true)}>
                            <CheckBoxIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Deseleccionar todos">
                        <IconButton size="small" onClick={() => onToggleAllTypes(false)}>
                            <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: '#5f6368' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
            <Divider sx={{ mb: 1 }} />
            
            <Box sx={{ px: 1, mb: 3 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f1f3f4', borderRadius: 1 }
                    }}
                    onClick={() => handleToggleExpand('tipos')}
                >
                    <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#3c4043', fontSize: '0.75rem' }}>
                        Filtrar por tipo
                    </Typography>
                    <IconButton size="small">
                        {expanded['tipos'] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </Box>
                
                <Collapse in={expanded['tipos']} timeout="auto" unmountOnExit>
                    <FormGroup sx={{ ml: 1, mt: 0.5 }}>
                        {allTypes.map((type) => (
                            <FormControlLabel
                                key={type}
                                control={
                                    <Checkbox 
                                        size="small"
                                        checked={selectedTypes.includes(type)}
                                        onChange={() => onToggleType(type)}
                                        sx={{ 
                                            p: 0.5,
                                            color: getTypeColor(type),
                                            '&.Mui-checked': { color: getTypeColor(type) }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#3c4043' }}>
                                        {type}
                                    </Typography>
                                }
                                sx={{ mb: 0, ml: 0, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 } }}
                            />
                        ))}
                    </FormGroup>
                </Collapse>
            </Box>

            {/* Sección: Filtrado por Estado */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="overline" sx={{ fontWeight: 'bold', color: '#5f6368', letterSpacing: 1.2 }}>
                    ESTADOS
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Seleccionar todos">
                        <IconButton size="small" onClick={() => onToggleAllStatuses(true)}>
                            <CheckBoxIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Deseleccionar todos">
                        <IconButton size="small" onClick={() => onToggleAllStatuses(false)}>
                            <CheckBoxOutlineBlankIcon fontSize="small" sx={{ color: '#5f6368' }} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Box>
            <Divider sx={{ mb: 1 }} />
            
            <Box sx={{ px: 1 }}>
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        py: 0.5,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#f1f3f4', borderRadius: 1 }
                    }}
                    onClick={() => handleToggleExpand('estados')}
                >
                    <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600, color: '#3c4043', fontSize: '0.75rem' }}>
                        Filtrar por estado
                    </Typography>
                    <IconButton size="small">
                        {expanded['estados'] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                </Box>
                
                <Collapse in={expanded['estados']} timeout="auto" unmountOnExit>
                    <FormGroup sx={{ ml: 1, mt: 0.5 }}>
                        {ALL_STATUSES.map((status) => (
                            <FormControlLabel
                                key={status}
                                control={
                                    <Checkbox 
                                        size="small"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => onToggleStatus(status)}
                                        sx={{ 
                                            p: 0.5,
                                            color: getStatusColor(status),
                                            '&.Mui-checked': { color: getStatusColor(status) }
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#3c4043' }}>
                                        {status}
                                    </Typography>
                                }
                                sx={{ mb: 0, ml: 0, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 } }}
                            />
                        ))}
                    </FormGroup>
                </Collapse>
            </Box>
        </Box>
    );
};

export default CalendarSidebar;
