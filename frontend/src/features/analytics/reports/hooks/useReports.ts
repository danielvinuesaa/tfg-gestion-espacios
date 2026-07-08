import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from '../../../../context/SnackbarContext';
import { useApi } from '../../../../shared/utils/api';
import { startOfWeek, endOfWeek, format, startOfMonth, endOfMonth } from 'date-fns';
import type { Space, Subject } from '../../../../shared/types';
import { REPORT_DEFINITIONS, type ReportType, type ReportParams } from '../types/report.types';

/**
 * Hook personalizado que centraliza y gestiona la lógica de negocio del módulo de informes.
 * Utiliza TanStack Query para optimizar la obtención de datos maestros en caché e interactúa 
 * con la API para la validación y generación final de reportes (PDF y CSV).
 *
 * @returns Un objeto que contiene el estado global de la configuración de informes, datos maestros,
 * métodos para la manipulación de filtros y manejadores del flujo de validación.
 */
export const useReports = () => {
    const { request } = useApi();
    const { showSnackbar } = useSnackbar();
    
    // -- Estados de Configuración --
    const [reportType, setReportType] = useState<ReportType>('SIGNATURES');
    const [loading, setLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    
    // -- QUERIES DE DATOS MAESTROS (Caché compartida) --
    
    const { data: spaces = [] } = useQuery<Space[]>({
        queryKey: ['/api/spaces', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/spaces?size=1000');
            return Array.isArray(data) ? data : (data.content || []);
        },
        staleTime: 5 * 60 * 1000
    });

    const { data: subjects = [] } = useQuery<Subject[]>({
        queryKey: ['/api/subjects', { size: 1000 }],
        queryFn: async () => {
            const data = await request('/api/subjects?size=1000');
            return Array.isArray(data) ? data : (data.content || []);
        },
        staleTime: 5 * 60 * 1000
    });

    // -- Estado de Filtros Unificado --
    const [filters, setFilters] = useState({
        week: startOfWeek(new Date(), { weekStartsOn: 1 }),
        startDate: startOfMonth(new Date()),
        endDate: endOfMonth(new Date()),
        spaceIds: [] as number[],
        subjectIds: [] as number[],
        reservationTypes: [] as string[]
    });

    // -- Estados del Flujo de Validación --
    const [emptyIds, setEmptyIds] = useState<number[]>([]);
    const [pendingAction, setPendingAction] = useState<'PDF' | 'CSV' | null>(null);
    const [includedEmptyIds, setIncludedEmptyIds] = useState<number[]>([]);

    /** Mapea el estado del UI al contrato de datos del Backend */
    const currentParams = useMemo(() => {
        const rawParams: any = { ...filters };
        if (reportType === 'SIGNATURES') {
            rawParams.startDate = format(startOfWeek(filters.week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            rawParams.endDate = format(endOfWeek(filters.week, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        } else {
            rawParams.startDate = filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : undefined;
            rawParams.endDate = filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : undefined;
        }
        return REPORT_DEFINITIONS[reportType].mapStateToParams(rawParams);
    }, [filters, reportType]);

    /** Determina si la configuración actual es válida para generar */
    const isConfigurationIncomplete = useMemo(() => {
        switch (reportType) {
            case 'SIGNATURES': return filters.spaceIds.length === 0;
            case 'SUBJECT_USAGE': return filters.subjectIds.length === 0;
            case 'OCCUPANCY': return filters.spaceIds.length === 0;
            default: return false;
        }
    }, [reportType, filters.spaceIds, filters.subjectIds]);

    /** Ejecuta la llamada final al motor de generación */
    const executeAction = useCallback(async (action: 'PDF' | 'CSV', params: ReportParams) => {
        const config = REPORT_DEFINITIONS[reportType];
        setLoading(true);
        try {
            if (action === 'PDF') {
                const blob = await request(config.endpoints.pdf, { method: 'POST', body: JSON.stringify(params) });
                if (previewUrl) window.URL.revokeObjectURL(previewUrl);
                setPreviewUrl(window.URL.createObjectURL(blob));
                showSnackbar("Vista previa generada", "success");
            } else {
                const text = await request(config.endpoints.csv, { method: 'POST', body: JSON.stringify(params) });
                const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_${config.label.replace(/ /g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showSnackbar("CSV exportado correctamente", "success");
            }
        } catch (err) {
            // Error capturado por useApi globalmente
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    }, [reportType, previewUrl, request, showSnackbar]);

    /** Dispara el flujo de validación de disponibilidad */
    const handleTriggerAction = useCallback(async (action: 'PDF' | 'CSV') => {
        setPendingAction(action);
        setLoading(true);
        try {
            let validationIds: number[] = [];
            if (reportType === 'SIGNATURES') {
                validationIds = await request('/api/reports/validate-availability', {
                    method: 'POST',
                    body: JSON.stringify({
                        startDate: currentParams.startDate,
                        endDate: currentParams.endDate,
                        spaceIds: currentParams.spaceIds
                    })
                });
            } else if (reportType === 'SUBJECT_USAGE') {
                validationIds = await request('/api/reports/validate-subjects-availability', {
                    method: 'POST',
                    body: JSON.stringify(currentParams)
                });
            }

            const result = Array.isArray(validationIds) ? validationIds : [];
            setEmptyIds(result);

            if (result.length === 0) {
                await executeAction(action, currentParams);
            } else {
                setIncludedEmptyIds([]); // Abre el diálogo de validación
            }
        } catch (err) {
            setLoading(false);
        }
    }, [reportType, currentParams, request, executeAction]);

    /** Procesa la decisión del usuario sobre los elementos sin datos */
    const handleConfirmValidation = useCallback(async () => {
        const currentSelectionIds = reportType === 'SIGNATURES' ? filters.spaceIds : filters.subjectIds;
        const nonEmptyIds = currentSelectionIds.filter(id => !emptyIds.includes(id));
        const finalIds = [...nonEmptyIds, ...includedEmptyIds];
        
        const key = reportType === 'SIGNATURES' ? 'spaceIds' : 'subjectIds';
        
        setEmptyIds([]);
        if (pendingAction) {
            const params = { ...currentParams, [key]: finalIds.length > 0 ? finalIds : currentSelectionIds };
            await executeAction(pendingAction, params);
        }
    }, [reportType, filters, emptyIds, includedEmptyIds, pendingAction, currentParams, executeAction]);

    const handleIncludeAllAndGenerate = useCallback(async () => {
        setEmptyIds([]);
        if (pendingAction) await executeAction(pendingAction, currentParams);
    }, [pendingAction, executeAction, currentParams]);

    const cancelAction = useCallback(() => {
        setEmptyIds([]);
        setLoading(false);
        setPendingAction(null);
    }, []);

    const updateFilter = useCallback((key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const changeReportType = useCallback((type: ReportType) => {
        setReportType(type);
        setPreviewUrl(null);
        setFilters(prev => ({ ...prev, spaceIds: [], subjectIds: [] }));
    }, []);

    const downloadPreview = (filename: string) => {
        if (!previewUrl) return;
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return {
        reportType, changeReportType,
        loading,
        spaces, subjects,
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
    };
};
