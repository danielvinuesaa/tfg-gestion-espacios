import { Container, Typography, Box, Grid } from '@mui/material';
import { useSettings } from '../../../context/SettingsContext';
import { useAvailabilitySearch } from '../hooks/useAvailabilitySearch';

// Sub-componentes modulares
import SearchFilters from '../components/availability/SearchFilters';
import SearchResultsArea from '../components/availability/SearchResultsArea';
import ReservationForm from '../../reservations/components/reservation-form/ReservationForm';

/**
 * Página principal del Buscador Inteligente de Espacios.
 * 
 * Implementa una arquitectura modular pura:
 * - Lógica de datos, estados de búsqueda y cálculos derivados centralizados en el hook `useAvailabilitySearch`.
 * - Panel de control lateral para la configuración de la búsqueda (`SearchFilters`).
 * - Área central de visualización de propuestas, franjas y estados de carga (`SearchResultsArea`).
 *
 * @returns Elemento React correspondiente a la página completa de búsqueda.
 */
const AvailabilitySearchPage = () => {
    const { timeSettings } = useSettings();

    const {
        filters, setFilters, appliedFilters,
        loading, searched, isStale, error,
        dailyResults, selectedDate, setSelectedDate,
        selectedSlotIdx, setSelectedSlotIdx,
        selectedProposalIdx, setSelectedProposalIdx,
        activeProposals, selectedDayData,
        isOnlyWeekendsSelected,
        handleSearch, clearFilters, navigateToReservation,
        reservationFormOpen, reservationSlot, handleCloseReservationForm
    } = useAvailabilitySearch();

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
            {/* Cabecera */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" gutterBottom>
                    Buscador Inteligente de Espacios
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Encuentra la mejor opción de reserva basada en la eficiencia de uso y capacidad real.
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* Panel Izquierdo: Filtros */}
                <Grid item xs={12} lg={3} sx={{ alignSelf: { lg: 'flex-start' } }}>
                    <Box sx={{ 
                        position: { lg: 'sticky' }, 
                        top: { lg: 32 }, 
                        maxHeight: { lg: 'calc(100vh - 40px)' }, 
                        overflowY: { lg: 'auto' },
                        overflowX: 'hidden',
                        px: 1, pb: 2, pt: 1, ml: -1, // Padding and margin to prevent shadow clipping
                        '&::-webkit-scrollbar': { width: '4px' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '4px' }
                    }}>
                        <SearchFilters 
                            filters={filters} 
                            setFilters={setFilters} 
                            loading={loading} 
                            error={error} 
                            isOnlyWeekendsSelected={isOnlyWeekendsSelected} 
                            onSearch={handleSearch} 
                            onClear={clearFilters} 
                            timeSettings={timeSettings} 
                            isStale={isStale}
                            searched={searched}
                        />
                    </Box>
                </Grid>

                {/* Panel Derecho: Resultados y Estados */}
                <Grid item xs={12} lg={9}>
                    <SearchResultsArea 
                        searched={searched}
                        loading={loading}
                        isFlexible={filters.flexible}
                        dailyResults={dailyResults}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedDayData={selectedDayData}
                        selectedSlotIdx={selectedSlotIdx}
                        setSelectedSlotIdx={setSelectedSlotIdx}
                        selectedProposalIdx={selectedProposalIdx}
                        setSelectedProposalIdx={setSelectedProposalIdx}
                        activeProposals={activeProposals}
                        filters={appliedFilters}
                        onSelectProposal={navigateToReservation}
                        isStale={isStale}
                    />
                </Grid>
            </Grid>

            {/* Modal de Reserva */}
            {reservationFormOpen && (
                <ReservationForm 
                    open={reservationFormOpen} 
                    handleClose={handleCloseReservationForm} 
                    onSuccess={() => {
                        handleCloseReservationForm();
                        // Refrescar u otra acción si fuera necesaria
                    }} 
                    initialSlot={reservationSlot} 
                />
            )}
        </Container>
    );
};

export default AvailabilitySearchPage;
