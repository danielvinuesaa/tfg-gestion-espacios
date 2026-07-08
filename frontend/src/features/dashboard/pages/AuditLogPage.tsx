import { useState, useCallback } from 'react';
import { Container, Typography, Box, Alert, Pagination, Tooltip, PaginationItem, Button, CircularProgress } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Hooks y Componentes modularizados
import { useAuditLog } from '../hooks/useAuditLog';
import AuditFilters from '../components/AuditFilters';
import RecentActivity from '../components/RecentActivity';
import PageLoader from '../../../shared/components/PageLoader';
import EmptyState from '../../../shared/components/EmptyState';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ExportAuditDialog from '../components/ExportAuditDialog';
import { useModalStack } from '../../../shared/hooks/useModalStack';
import { useApi } from '../../../shared/utils/api';
import { useSnackbar } from '../../../context/SnackbarContext';

/**
 * Componente principal para la página del Historial de Auditoría.
 * Implementa una arquitectura modular que separa la lógica de filtros, 
 * la presentación de controles y la renderización de resultados.
 *
 * @returns Un elemento JSX que representa la vista completa del historial de auditoría.
 */
const AuditLogPage = () => {
    const { request } = useApi();
    const { showSnackbar } = useSnackbar();
    const {
        logs, loading, error, pagination, filters, setPage, setFilters,
        performedBy, setPerformedBy,
        startDate, setStartDate,
        endDate, setEndDate,
        applyDateFilters, clearFilters, hasFilters
    } = useAuditLog();

    const modals = useModalStack({
        export: false
    });

    const handleExport = useCallback(async (columns: string[]) => {
        try {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.performedBy) params.append('performedBy', filters.performedBy);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            columns.forEach(col => params.append('columns', col));

            const blob = await request(`/api/audit-logs/export?${params.toString()}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showSnackbar('Historial de auditoría exportado correctamente');
            modals.close('export');
        } catch (error: any) {
            showSnackbar(error.message || 'Error al exportar el historial', 'error');
        }
    }, [filters, request, showSnackbar, modals]);

    // PATRÓN ESTÁNDAR: Carga inicial limpia
    if (loading && logs.length === 0 && !hasFilters) {
        return <PageLoader message="Recuperando historial de auditoría..." />;
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
            {/* Cabecera de Página */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 1.5, borderRadius: 3, display: 'flex' }}>
                        <HistoryIcon fontSize="large" />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="800">Historial de Auditoría</Typography>
                        <Typography variant="body1" color="text.secondary">Explora las acciones y cambios realizados en la plataforma.</Typography>
                    </Box>
                </Box>
                
                <Button
                    variant="contained"
                    startIcon={<FileDownloadIcon />}
                    onClick={() => modals.open('export')}
                    disabled={logs.length === 0}
                    sx={{ borderRadius: 2, px: 3, py: 1, fontWeight: 600 }}
                >
                    Exportar
                </Button>
            </Box>

            {/* Panel de Control de Filtros */}
            <AuditFilters 
                performedBy={performedBy}
                onPerformedByChange={setPerformedBy}
                actionFilter={filters.action || ''}
                onActionFilterChange={(val) => setFilters({ action: val })}
                startDate={startDate}
                onStartDateChange={setStartDate}
                endDate={endDate}
                onEndDateChange={setEndDate}
                onApplyDates={applyDateFilters}
                onClear={clearFilters}
                hasFilters={hasFilters}
            />

            {error && !loading && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Listado de Resultados con Overlay de Carga */}
            <Box sx={{ position: 'relative', minHeight: 400 }}>
                {loading && (
                    <Box sx={{ 
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        bgcolor: 'rgba(255,255,255,0.7)', zIndex: 2, borderRadius: 4 
                    }}>
                        <CircularProgress size={48} />
                    </Box>
                )}

                {logs.length > 0 ? (
                    <RecentActivity activities={logs} />
                ) : !loading && (
                    <EmptyState 
                        icon={<SearchOffIcon />}
                        title="No se han encontrado registros"
                        description="Intenta ajustar los filtros de búsqueda o las fechas para encontrar lo que buscas."
                    />
                )}

                {/* Paginación Estandarizada */}
                {pagination.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination 
                            count={pagination.totalPages} 
                            page={pagination.page + 1} 
                            onChange={(_, val) => setPage(val - 1)} 
                            color="primary" 
                            size="large"
                            showFirstButton 
                            showLastButton
                            renderItem={(item) => {
                                let title = '';
                                if (item.type === 'first') title = 'Primera página';
                                else if (item.type === 'last') title = 'Última página';
                                else if (item.type === 'next') title = 'Siguiente página';
                                else if (item.type === 'previous') title = 'Página anterior';
                                
                                return title ? (
                                    <Tooltip title={title}>
                                        <PaginationItem {...item} />
                                    </Tooltip>
                                ) : (
                                    <PaginationItem {...item} />
                                );
                            }}
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    fontWeight: 600,
                                    borderRadius: 2
                                }
                            }}
                        />
                    </Box>
                )}
            </Box>

            <ExportAuditDialog 
                open={modals.isOpen('export')} 
                onClose={() => modals.close('export')} 
                onExport={handleExport} 
            />
        </Container>
    );
};

export default AuditLogPage;
