import { Box, Typography, Divider } from '@mui/material';
import type { Space, Subject } from '../../../../shared/types';
import type { ReportType } from '../types/report.types';
import SignaturesConfig from './configs/SignaturesConfig';
import SubjectUsageConfig from './configs/SubjectUsageConfig';
import OccupancyConfig from './configs/OccupancyConfig';

/**
 * Propiedades para el componente ReportConfigSwitcher.
 */
interface ReportConfigSwitcherProps {
    /** Tipo de informe seleccionado actualmente. */
    reportType: ReportType;
    /** Etiqueta descriptiva del tipo de informe. */
    label: string;
    /** Objeto que contiene los filtros actuales aplicados. */
    filters: any;
    /** Función para actualizar el valor de un filtro específico. */
    updateFilter: (key: string, value: any) => void;
    /** Lista de espacios disponibles para selección. */
    spaces: Space[];
    /** Lista de asignaturas disponibles para selección. */
    subjects: Subject[];
}

/**
 * Componente orquestador que gestiona y renderiza dinámicamente el formulario de configuración
 * adecuado según el tipo de informe seleccionado.
 *
 * @param props - Propiedades que incluyen el tipo de informe, filtros actuales y catálogos de datos.
 * @returns Un elemento JSX con el formulario de configuración correspondiente.
 */
const ReportConfigSwitcher = ({ 
    reportType, label, filters, updateFilter, spaces, subjects 
}: ReportConfigSwitcherProps) => {
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>{label}</Typography>
            <Divider sx={{ mb: 4 }} />

            {reportType === 'SIGNATURES' && (
                <SignaturesConfig 
                    week={filters.week} onWeekChange={(v) => updateFilter('week', v)}
                    selectedSpaceIds={filters.spaceIds} onSpacesChange={(v) => updateFilter('spaceIds', v)}
                    availableSpaces={spaces}
                />
            )}

            {reportType === 'SUBJECT_USAGE' && (
                <SubjectUsageConfig 
                    startDate={filters.startDate} onStartDateChange={(v) => updateFilter('startDate', v)}
                    endDate={filters.endDate} onEndDateChange={(v) => updateFilter('endDate', v)}
                    selectedSubjectIds={filters.subjectIds} onSubjectsChange={(v) => updateFilter('subjectIds', v)}
                    reservationTypes={filters.reservationTypes} onReservationTypesChange={(v) => updateFilter('reservationTypes', v)}
                    availableSubjects={subjects}
                />
            )}

            {reportType === 'OCCUPANCY' && (
                <OccupancyConfig 
                    startDate={filters.startDate} onStartDateChange={(v) => updateFilter('startDate', v)}
                    endDate={filters.endDate} onEndDateChange={(v) => updateFilter('endDate', v)}
                    selectedSpaceIds={filters.spaceIds} onSpacesChange={(v) => updateFilter('spaceIds', v)}
                    availableSpaces={spaces}
                />
            )}
        </Box>
    );
};

export default ReportConfigSwitcher;
