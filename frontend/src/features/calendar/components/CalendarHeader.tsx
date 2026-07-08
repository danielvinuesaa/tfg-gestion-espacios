import { useState } from 'react';
import { 
    Box, 
    Typography, 
    Button, 
    IconButton, 
    Menu, 
    MenuItem, 
    Stack,
    Tooltip,
    Popover
} from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { endOfWeek, startOfWeek, isSameWeek } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuIcon from '@mui/icons-material/Menu';
import { formatDisplayDate } from '../../../shared/utils/dateUtils';

/**
 * Propiedades para el componente CalendarHeader.
 */
interface CalendarHeaderProps {
    /** Fecha actualmente enfocada en el calendario. */
    date: Date;
    /** Etiqueta descriptiva por defecto del periodo actual. */
    label: string;
    /** Función para navegar en el tiempo dentro del calendario. */
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE', newDate?: Date) => void;
    /** Función para cambiar el tipo de vista del calendario (mes, semana, día, agenda). */
    onView: (view: string) => void;
    /** Vista actualmente seleccionada. */
    view: string;
    /** Función para alternar la visibilidad de la barra lateral. */
    onToggleSidebar: () => void;
}

/**
 * Componente que representa la cabecera (toolbar) personalizada del calendario.
 * Incluye controles de navegación temporal (hoy, anterior, siguiente), selector rápido
 * de fecha mediante un Popover, alternador de vistas y botón para abrir el panel lateral.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React correspondiente a la cabecera superior del calendario.
 */
const CalendarHeader = ({ 
    date,
    label, 
    onNavigate, 
    onView, 
    view, 
    onToggleSidebar
}: CalendarHeaderProps) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [datePickerAnchor, setDatePickerAnchor] = useState<null | HTMLElement>(null);
    
    const open = Boolean(anchorEl);
    const openDatePicker = Boolean(datePickerAnchor);

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (newView?: string) => {
        setAnchorEl(null);
        if (newView) onView(newView);
    };

    const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
        setDatePickerAnchor(event.currentTarget);
    };

    const handleDateSelect = (newDate: Date | null) => {
        if (newDate) {
            onNavigate('DATE', newDate);
            setDatePickerAnchor(null);
        }
    };

    const viewLabels: { [key: string]: string } = {
        month: 'Mes',
        week: 'Semana',
        day: 'Día',
        agenda: 'Agenda'
    };

    // Formateo personalizado para el label según la vista
    const getFormattedLabel = () => {
        const today = new Date();
        
        if (view === 'agenda') {
            // Si la semana que vemos es la actual, desde hoy hasta el final.
            // Si es una semana distinta, la semana completa.
            const start = isSameWeek(date, today, { weekStartsOn: 1 }) ? date : startOfWeek(date, { weekStartsOn: 1 });
            const end = endOfWeek(date, { weekStartsOn: 1 });
            
            return `${formatDisplayDate(start, "MMMM dd")} - ${formatDisplayDate(end, "MMMM dd")}`;
        }
        
        if (view === 'week') {
            // En Semana: siempre la semana natural completa (Lunes-Domingo)
            const start = startOfWeek(date, { weekStartsOn: 1 });
            const end = endOfWeek(date, { weekStartsOn: 1 });
            
            return `${formatDisplayDate(start, "MMMM dd")} - ${formatDisplayDate(end, "MMMM dd")}`;
        }
        
        return label;
    };

    const todayLabel = formatDisplayDate(new Date(), "EEEE, d 'de' MMMM");
    const capitalizedTodayLabel = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3, 
                px: 1,
                gap: 2,
                flexWrap: 'wrap'
            }}
        >
            {/* Bloque Izquierdo: Menú, Hoy, Navegación y Título */}
            <Stack direction="row" alignItems="center" spacing={1}>
                <Tooltip title="Panel de filtros">
                    <IconButton onClick={onToggleSidebar} sx={{ mr: 1 }}>
                        <MenuIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title={capitalizedTodayLabel}>
                    <Button 
                        variant="outlined" 
                        onClick={() => onNavigate('TODAY')}
                        sx={{ 
                            borderRadius: 20, 
                            textTransform: 'none', 
                            px: 3,
                            borderColor: '#dadce0',
                            color: '#3c4043',
                            fontWeight: 500,
                            '&:hover': { bgcolor: '#f1f3f4', borderColor: '#dadce0' }
                        }}
                    >
                        Hoy
                    </Button>
                </Tooltip>
                
                <Box sx={{ display: 'flex' }}>
                    <Tooltip title="Anterior">
                        <IconButton size="small" onClick={() => onNavigate('PREV')}>
                            <ChevronLeftIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Siguiente">
                        <IconButton size="small" onClick={() => onNavigate('NEXT')}>
                            <ChevronRightIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Stack 
                    direction="row" 
                    alignItems="center" 
                    onClick={handleDateClick}
                    sx={{ 
                        cursor: 'pointer', 
                        ml: 1, 
                        px: 1, 
                        py: 0.5, 
                        borderRadius: 1,
                        '&:hover': { bgcolor: '#f1f3f4' } 
                    }}
                >
                    <Typography variant="h5" sx={{ color: '#3c4043', fontWeight: 400 }}>
                        {getFormattedLabel()}
                    </Typography>
                    <ArrowDropDownIcon sx={{ color: '#5f6368' }} />
                </Stack>

                <Popover
                    open={openDatePicker}
                    anchorEl={datePickerAnchor}
                    onClose={() => setDatePickerAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                    PaperProps={{ sx: { p: 1, mt: 1, borderRadius: '24px', boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)', border: 'none' } }}
                >
                    <DateCalendar 
                        value={date} 
                        onChange={handleDateSelect}
                        sx={{ width: 280, height: 'auto' }}
                    />
                </Popover>
            </Stack>

            {/* Bloque Derecho: Selector de Vista */}
            <Stack direction="row" alignItems="center" spacing={2}>
                <Box>
                    <Button
                        variant="outlined"
                        onClick={handleMenuOpen}
                        endIcon={<ArrowDropDownIcon />}
                        sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            color: '#3c4043', 
                            borderColor: '#dadce0',
                            px: 2,
                            fontWeight: 500
                        }}
                    >
                        {viewLabels[view] || view}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => handleMenuClose()}
                        PaperProps={{ elevation: 3, sx: { minWidth: 120, mt: 1 } }}
                    >
                        <MenuItem onClick={() => handleMenuClose('month')} selected={view === 'month'}>Mes</MenuItem>
                        <MenuItem onClick={() => handleMenuClose('week')} selected={view === 'week'}>Semana</MenuItem>
                        <MenuItem onClick={() => handleMenuClose('day')} selected={view === 'day'}>Día</MenuItem>
                        <MenuItem onClick={() => handleMenuClose('agenda')} selected={view === 'agenda'}>Agenda</MenuItem>
                    </Menu>
                </Box>
            </Stack>
        </Box>
    );
};

export default CalendarHeader;
