import { useMemo } from 'react';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { format } from 'date-fns';

import { useReports } from '../hooks/useReports';
import ReportTypeSelector from '../components/ReportTypeSelector';
import ReportValidationDialog from '../components/ReportValidationDialog';
import ReportPreview from '../components/ReportPreview';
import ReportConfigSwitcher from '../components/ReportConfigSwitcher';
import ReportActionFooter from '../components/ReportActionFooter';
import PageLoader from '../../../../shared/components/PageLoader';
import { REPORT_DEFINITIONS } from '../types/report.types';

/**
 * Componente orquestador principal del módulo de análisis e informes.
 * 
 * Implementa una arquitectura puramente declarativa donde:
 * - La lógica de negocio y estado se extrae mediante el hook `useReports`.
 * - La selección de la configuración se delega a `ReportConfigSwitcher`.
 * - Las acciones de generación se manejan en `ReportActionFooter`.
 *
 * @returns Un elemento JSX que representa la página de informes completa.
 */
const ReportsPage = () => {
    const { 
        reportType, changeReportType, loading, spaces, subjects, 
        filters, updateFilter,
        previewUrl, setPreviewUrl, 
        emptyIds, setEmptyIds,
        includedEmptyIds, setIncludedEmptyIds,
        isConfigurationIncomplete,
        handleTriggerAction,
        handleConfirmValidation,
        handleIncludeAllAndGenerate,
        cancelAction,
        downloadPreview
    } = useReports();

    const configLabel = REPORT_DEFINITIONS[reportType].label;
    const isSpaceBased = reportType === 'SIGNATURES' || reportType === 'OCCUPANCY';

    /** Construye el listado de elementos vacíos para el diálogo de validación. */
    const emptyItems = useMemo(() => {
        if (isSpaceBased) {
            return spaces.filter(s => emptyIds.includes(s.id)).map(s => ({
                id: s.id, name: s.name, description: s.type ? s.type.replace('_', ' ') : ''
            }));
        } else {
            const hasTypes = filters.reservationTypes.length > 0;
            return subjects.filter(s => emptyIds.includes(s.id)).map(s => ({
                id: s.id, 
                name: s.name, 
                description: hasTypes ? "Sin reservas de estos tipos" : "Sin actividad en el periodo"
            }));
        }
    }, [isSpaceBased, emptyIds, spaces, subjects, filters.reservationTypes]);

    if (loading && spaces.length === 0) {
        return <PageLoader message="Preparando motor de informes..." />;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="800" gutterBottom>Centro de Informes</Typography>
                <Typography variant="body1" color="text.secondary">Generación profesional de reportes y análisis de ocupación.</Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <ReportTypeSelector 
                        activeType={reportType} 
                        onTypeChange={changeReportType} 
                    />
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #eee', minHeight: 550, display: 'flex', flexDirection: 'column' }}>
                        {previewUrl ? (
                            <ReportPreview 
                                url={previewUrl} 
                                onClose={() => setPreviewUrl(null)} 
                                onDownload={() => downloadPreview(`Informe_${configLabel.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`)} 
                            />
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <ReportConfigSwitcher 
                                    reportType={reportType}
                                    label={configLabel}
                                    filters={filters}
                                    updateFilter={updateFilter}
                                    spaces={spaces}
                                    subjects={subjects}
                                />

                                <ReportActionFooter 
                                    loading={loading}
                                    disabled={isConfigurationIncomplete}
                                    onAction={handleTriggerAction}
                                />
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Diálogo de Validación Centralizado */}
            <ReportValidationDialog 
                open={emptyIds.length > 0}
                onClose={cancelAction}
                type={isSpaceBased ? 'SPACES' : 'SUBJECTS'}
                emptyItems={emptyItems}
                selectedCount={isSpaceBased ? filters.spaceIds.length : filters.subjectIds.length}
                includedEmptyIds={includedEmptyIds}
                onToggleInclusion={(id) => setIncludedEmptyIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                onConfirm={handleConfirmValidation}
                onIncludeAll={handleIncludeAllAndGenerate}
                hasFilters={reportType === 'SUBJECT_USAGE' && filters.reservationTypes.length > 0}
            />
        </Container>
    );
};

export default ReportsPage;
