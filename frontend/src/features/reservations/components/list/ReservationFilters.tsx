import React from 'react';
import { Grid, Button, Collapse, Box } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import FilterBar from '../../../../shared/components/FilterBar';
import type { ReservationFilters as FilterType } from '../../hooks/useReservations';
import type { Space, User } from '../../../../shared/types';
import type { Subject } from '../../../../shared/types';
import { adjustTimeToStartHour } from '../../../../shared/utils/timeUtils';
import { formatApiDate } from '../../../../shared/utils/dateUtils';
import { useSettings } from '../../../../context/SettingsContext';

// Subcomponentes refactorizados
import SubjectFilter from './filters/SubjectFilter';
import SpaceFilter from './filters/SpaceFilter';
import StatusTypeFilters from './filters/StatusTypeFilters';
import UserFilter from './filters/UserFilter';
import DateRangeFilters from './filters/DateRangeFilters';

/**
 * Propiedades del componente ReservationFilters.
 */
interface ReservationFiltersProps {
    filters: FilterType;
    onFilterChange: (newFilters: Partial<FilterType>) => void;
    onClearFilters: () => void;
    allSpaces: Space[];
    allUsers: User[];
    allSubjects: Subject[];
    isManagerMode: boolean;
    advancedOpen: boolean;
    setAdvancedOpen: (open: boolean) => void;
    minuteStep: number;
    startHour: number;
    setPage: (page: number) => void;
}

/**
 * Componente principal de panel de filtros para el listado y búsqueda de reservas.
 * 
 * Actúa como orquestador reuniendo múltiples selectores y controles (texto, rangos de fecha,
 * usuarios, asignaturas, estados) dentro de una barra de herramientas expansible (`FilterBar`).
 * Centraliza la lógica de actualización del estado de búsqueda e incorpora heurísticas
 * para limpiar filtros dependientes al cambiar otros.
 * 
 * @param props - Propiedades para el control y estado de los filtros.
 * @param props.filters - Objeto reactivo conteniendo el estado actual de todos los filtros aplicados.
 * @param props.onFilterChange - Callback para consolidar modificaciones parciales sobre los filtros.
 * @param props.onClearFilters - Callback accionado para restaurar el estado original (vacío) de los filtros.
 * @param props.allSpaces - Colección global de espacios para nutrir el selector correspondiente.
 * @param props.allUsers - Colección global de usuarios disponibles (relevante para el rol administrador).
 * @param props.allSubjects - Colección de asignaturas para el filtrado académico.
 * @param props.isManagerMode - Flag que habilita filtros avanzados exclusivos de roles gestores o administradores.
 * @param props.advancedOpen - Estado booleano que controla si el panel de filtros avanzados está desplegado.
 * @param props.setAdvancedOpen - Callback para alternar la visibilidad de los filtros avanzados.
 * @param props.minuteStep - Incremento de minutos para los selectores de rangos horarios.
 * @param props.startHour - Hora de apertura operativa configurada en el sistema.
 * @param props.setPage - Callback utilizado para resetear la paginación a 0 tras la aplicación de un nuevo filtro.
 * @returns Elemento React envolviendo los diversos subcomponentes de filtrado.
 */
const ReservationFilters = ({
    filters, onFilterChange, onClearFilters,
    allSpaces, allUsers, allSubjects, isManagerMode,
    advancedOpen, setAdvancedOpen,
    minuteStep, startHour, setPage
}: ReservationFiltersProps) => {
    const { timeSettings } = useSettings();
    const { endHour } = timeSettings;
    
    // Preparación de datos para subcomponentes
    const startDateObj = filters.startDate ? new Date(filters.startDate) : null;
    const endDateObj = filters.endDate ? new Date(filters.endDate) : null;
    const isDateError = Boolean(startDateObj && endDateObj && endDateObj < startDateObj);
    
    const hasActiveFilters = !!(
        filters.status || filters.type || 
        (filters.spaceId && filters.spaceId.length > 0) || 
        (filters.userId && filters.userId.length > 0) || 
        (filters.subjectId && filters.subjectId.length > 0) || 
        filters.startDate || filters.endDate || filters.search
    );

    const handleUpdate = (update: Partial<FilterType>) => {
        // Lógica profesional: Si desactivamos 'includeCancelled' y el estado actual es terminal, reseteamos estado
        if (update.includeCancelled === false && (filters.status === 'CANCELADA' || filters.status === 'RECHAZADA')) {
            update.status = '';
        }
        onFilterChange(update);
        setPage(0);
    };

    const handleDateChange = (field: 'startDate' | 'endDate', val: Date | null) => {
        if (!val) {
            handleUpdate({ [field]: null });
            return;
        }
        const adjusted = adjustTimeToStartHour(val, startHour);
        handleUpdate({ [field]: adjusted ? formatApiDate(adjusted) : null });
    };

    return (
        <FilterBar
            searchQuery={filters.search}
            onSearchChange={(val) => handleUpdate({ search: val })}
            searchPlaceholder="Buscar por título o responsable..."
            showDeleted={filters.includeCancelled}
            onShowDeletedChange={(val) => handleUpdate({ includeCancelled: val })}
            showDeletedLabel="Incluir canceladas"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            extraContent={
                <Collapse in={advancedOpen}>
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={4}>
                                <SubjectFilter 
                                    allSubjects={allSubjects} 
                                    selectedSubjectIds={filters.subjectId || []} 
                                    onChange={(ids) => handleUpdate({ subjectId: ids })} 
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={4}>
                                <SpaceFilter 
                                    allSpaces={allSpaces} 
                                    selectedSpaceIds={filters.spaceId || []} 
                                    onChange={(ids) => handleUpdate({ spaceId: ids })} 
                                />
                            </Grid>

                            <StatusTypeFilters 
                                status={filters.status || ''} 
                                type={filters.type || ''} 
                                includeTerminalStates={filters.includeCancelled}
                                onStatusChange={(val) => handleUpdate({ status: val as any })}
                                onTypeChange={(val) => handleUpdate({ type: val as any })}
                            />

                            {isManagerMode && (
                                <Grid item xs={12}>
                                    <UserFilter 
                                        allUsers={allUsers} 
                                        selectedUserIds={filters.userId || []} 
                                        onChange={(ids) => handleUpdate({ userId: ids })} 
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Collapse>
            }
        >
            <DateRangeFilters 
                startDate={startDateObj} 
                endDate={endDateObj} 
                onChange={handleDateChange}
                minuteStep={minuteStep}
                startHour={startHour}
                endHour={endHour}
                isError={isDateError}
            />

            <Button
                variant="outlined"
                size="small"
                color={advancedOpen ? "primary" : "inherit"}
                startIcon={<TuneIcon />}
                onClick={() => setAdvancedOpen(!advancedOpen)}
                sx={{ 
                    bgcolor: advancedOpen ? '#e3f2fd' : 'white',
                    borderColor: advancedOpen ? 'primary.main' : '#ccc',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    height: '40px',
                    whiteSpace: 'nowrap',
                    px: 2
                }}
            >
                {advancedOpen ? "Ocultar filtros" : "Más filtros"}
            </Button>
        </FilterBar>
    );
};

export default ReservationFilters;
