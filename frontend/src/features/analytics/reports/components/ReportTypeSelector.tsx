import { Stack, Card, CardContent, Box, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import type { ReportType } from '../types/report.types';

const REPORT_TYPES = [
    { id: 'SIGNATURES', label: 'Parte de Firmas', icon: <AssignmentIcon />, desc: 'Control semanal de asistencia' },
    { id: 'OCCUPANCY', label: 'Estadísticas de Ocupación', icon: <DashboardIcon />, desc: 'Ratios de uso y saturación' },
    { id: 'SUBJECT_USAGE', label: 'Uso por Asignatura', icon: <MeetingRoomIcon />, desc: 'Actividad detallada por materia' }
];

/**
 * Propiedades requeridas para el componente ReportTypeSelector.
 */
interface ReportTypeSelectorProps {
    /** Identificador del tipo de informe actualmente seleccionado. */
    activeType: ReportType;
    /**
     * Función invocada cuando se selecciona un nuevo tipo de informe.
     * @param type - El identificador del tipo de informe elegido.
     */
    onTypeChange: (type: ReportType) => void;
}

/**
 * Componente interactivo que muestra una lista de opciones en forma de tarjetas,
 * permitiendo al usuario seleccionar el tipo de informe que desea generar.
 *
 * @param props - Las propiedades que determinan el estado activo y el manejador de selección.
 * @returns Un componente de pila (Stack) con las tarjetas de selección.
 */
const ReportTypeSelector = ({ activeType, onTypeChange }: ReportTypeSelectorProps) => (
    <Stack spacing={2}>
        {REPORT_TYPES.map((item) => (
            <Card 
                key={item.id}
                onClick={() => onTypeChange(item.id as ReportType)}
                sx={{ 
                    cursor: 'pointer',
                    transition: '0.2s',
                    border: activeType === item.id ? '2px solid #1a73e8' : '1px solid #eee',
                    bgcolor: activeType === item.id ? '#f8faff' : 'white',
                    '&:hover': { transform: 'translateX(4px)', borderColor: '#1a73e8' }
                }}
            >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ color: activeType === item.id ? 'primary.main' : 'text.disabled' }}>
                        {item.icon}
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold">{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                    </Box>
                </CardContent>
            </Card>
        ))}
    </Stack>
);

export default ReportTypeSelector;
