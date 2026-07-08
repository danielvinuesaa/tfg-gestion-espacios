import { Box, Paper, Typography, Fade, Grid, Alert } from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import PageLoader from '../../../../shared/components/PageLoader';
import EmptyState from '../../../../shared/components/EmptyState';
import DailySelector from './DailySelector';
import TimeSlotSelector from './TimeSlotSelector';
import ProposalCard from './ProposalCard';
import type { DailyResults, ReservationProposal } from '../../hooks/useAvailabilitySearch';

/**
 * Propiedades para el componente SearchResultsArea.
 */
interface SearchResultsAreaProps {
    /** Indica si ya se ha ejecutado una búsqueda. */
    searched: boolean;
    /** Indica si la búsqueda está en curso. */
    loading: boolean;
    /** Indica si se ha activado el modo de búsqueda flexible. */
    isFlexible: boolean;
    /** Resultados diarios obtenidos de la búsqueda flexible. */
    dailyResults: DailyResults[];
    /** Fecha seleccionada actualmente. */
    selectedDate: string | null;
    /** Función para actualizar la fecha seleccionada. */
    setSelectedDate: (date: string | null) => void;
    /** Datos de resultados correspondientes a la fecha seleccionada. */
    selectedDayData: DailyResults | undefined;
    /** Índice de la franja horaria seleccionada. */
    selectedSlotIdx: number | null;
    /** Función para actualizar la franja horaria seleccionada. */
    setSelectedSlotIdx: (idx: number | null) => void;
    /** Índice de la propuesta de reserva seleccionada. */
    selectedProposalIdx: number;
    /** Función para actualizar el índice de la propuesta seleccionada. */
    setSelectedProposalIdx: (idx: number) => void;
    /** Lista de propuestas de reserva activas a mostrar. */
    activeProposals: ReservationProposal[];
    /** Filtros aplicados en la búsqueda actual. */
    filters: any;
    /** Función a ejecutar cuando el usuario selecciona una propuesta. */
    onSelectProposal: (proposal: ReservationProposal) => void;
    /** Indica si los resultados mostrados están desactualizados respecto a los filtros actuales. */
    isStale?: boolean;
}

/**
 * Componente para el área de visualización de resultados de búsqueda de disponibilidad.
 * Gestiona dinámicamente los estados de la interfaz (sin búsqueda, cargando, resultados vacíos)
 * y renderiza los componentes de selección de fecha, franja horaria y las tarjetas de propuestas
 * según el modo de búsqueda (fijo o flexible).
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que muestra los resultados de la búsqueda.
 */
const SearchResultsArea = ({
    searched, loading, isFlexible, dailyResults, selectedDate, setSelectedDate,
    selectedDayData, selectedSlotIdx, setSelectedSlotIdx, 
    selectedProposalIdx, setSelectedProposalIdx,
    activeProposals,
    filters, onSelectProposal, isStale = false
}: SearchResultsAreaProps) => {

    // Estado inicial: Antes de buscar
    if (!searched) {
        return (
            <EmptyState 
                icon={<AutoAwesomeIcon />}
                title="Buscador Inteligente de Espacios"
                description="Indica tus necesidades y generaremos las mejores propuestas de disponibilidad para ti."
                sx={{ bgcolor: 'background.paper' }}
            />
        );
    }

    // Estado de carga
    if (loading) {
        return <PageLoader message="Analizando eficiencia de espacios..." minHeight="400px" />;
    }

    return (
        <Box sx={{ 
            opacity: isStale ? 0.6 : 1, 
            transition: 'opacity 0.3s ease',
            filter: isStale ? 'grayscale(0.4)' : 'none',
            pointerEvents: loading ? 'none' : 'auto'
        }}>
            {isStale && (
                <Fade in>
                    <Alert 
                        severity="info" 
                        variant="outlined"
                        icon={<AutoAwesomeIcon />}
                        sx={{ mb: 3, borderRadius: 2, bgcolor: 'background.paper', borderStyle: 'dashed' }}
                    >
                        Los filtros han cambiado. Pulsa <strong>"Actualizar Propuestas"</strong> para ver los resultados exactos.
                    </Alert>
                </Fade>
            )}

            {isFlexible && (
                <>
                    <DailySelector 
                        dailyResults={dailyResults} 
                        selectedDate={selectedDate} 
                        onSelectDate={setSelectedDate} 
                    />
                    
                    {selectedDayData && selectedDayData.timeSlots.length > 0 && (
                        <Fade in timeout={500}>
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="overline" sx={{ fontWeight: 'bold', color: 'text.secondary', ml: 1, mb: 1, display: 'block' }}>
                                    Franjas Horarias Disponibles
                                </Typography>
                                <TimeSlotSelector 
                                    timeSlots={selectedDayData.timeSlots} 
                                    selectedSlotIdx={selectedSlotIdx} 
                                    onSelectSlot={setSelectedSlotIdx} 
                                />
                            </Box>
                        </Fade>
                    )}
                </>
            )}

            {activeProposals.length === 0 ? (
                <Fade in>
                    <Box>
                        <EmptyState 
                            icon={<SearchOffIcon />}
                            title="No se han encontrado huecos disponibles"
                            description="Prueba a cambiar las fechas, reducir la duración solicitada o ser menos restrictivo con el equipamiento."
                        />
                    </Box>
                </Fade>
            ) : (
                <Box>
                    {isFlexible && selectedSlotIdx !== null && selectedDayData && (
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 3, ml: 1 }}>
                            Propuestas para el horario {selectedDayData.timeSlots[selectedSlotIdx].label}:
                        </Typography>
                    )}
                    
                    <Grid container spacing={3}>
                        {activeProposals.map((proposal, index) => (
                            <Grid item xs={12} md={6} key={`${selectedDate}-${selectedSlotIdx}-${index}`}>
                                <ProposalCard 
                                    proposal={proposal} 
                                    index={index} 
                                    filters={filters} 
                                    onSelect={onSelectProposal} 
                                    isSelected={selectedProposalIdx === index}
                                    onCardClick={() => setSelectedProposalIdx(index)}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}
        </Box>
    );
};

export default SearchResultsArea;
