import type { Space, Subject } from '../../../../shared/types';

/**
 * Identificadores únicos para los tipos de informe disponibles.
 */
export type ReportType = 'SIGNATURES' | 'OCCUPANCY' | 'SUBJECT_USAGE';

/**
 * Representa la estructura de parámetros requerida por el motor de generación
 * de informes en el backend para la obtención de datos filtrados.
 */
export interface ReportParams {
    startDate?: string;
    endDate?: string;
    spaceIds?: number[];
    subjectIds?: number[];
    reservationTypes?: string[];
    [key: string]: any;
}

/**
 * Define el comportamiento y la configuración asociada a cada tipo de informe.
 * Utiliza el patrón de diseño Estrategia para desacoplar la interfaz de usuario
 * de la lógica de negocio subyacente.
 */
export interface ReportDefinition {
    id: ReportType;
    label: string;
    endpoints: {
        pdf: string;
        csv: string;
    };
    /** 
     * Transforma el estado local de los filtros de la interfaz al esquema de parámetros que espera la API. 
     * @param state - El estado actual de los filtros del informe.
     * @returns Los parámetros formateados.
     */
    mapStateToParams: (state: any) => ReportParams;
    /** 
     * Realiza una validación previa de los parámetros para evitar peticiones no válidas.
     * @param params - Los parámetros a evaluar.
     * @returns Un mensaje de error si la validación falla, o nulo en caso de éxito.
     */
    validate?: (params: ReportParams) => string | null;
}

/**
 * Registro central estático que contiene la definición de cada tipo de informe soportado.
 * Añadir una nueva entrada aquí expone el informe a lo largo de la aplicación.
 */
export const REPORT_DEFINITIONS: Record<ReportType, ReportDefinition> = {
    SIGNATURES: {
        id: 'SIGNATURES',
        label: 'Parte de Firmas',
        endpoints: {
            pdf: '/api/reports/signature-logs',
            csv: '/api/reports/signature-logs/csv'
        },
        mapStateToParams: (state) => ({
            startDate: state.startDate,
            endDate: state.endDate,
            spaceIds: state.spaceIds
        }),
        validate: (p) => (!p.spaceIds || p.spaceIds.length === 0) ? "Seleccione al menos un espacio" : null
    },
    SUBJECT_USAGE: {
        id: 'SUBJECT_USAGE',
        label: 'Uso por Asignatura',
        endpoints: {
            pdf: '/api/reports/subject-usage/pdf',
            csv: '/api/reports/subject-usage/csv'
        },
        mapStateToParams: (state) => ({
            startDate: state.startDate,
            endDate: state.endDate,
            subjectIds: state.subjectIds,
            reservationTypes: state.reservationTypes
        }),
        validate: (p) => (!p.subjectIds || p.subjectIds.length === 0) ? "Seleccione al menos una asignatura" : null
    },
    OCCUPANCY: {
        id: 'OCCUPANCY',
        label: 'Estadísticas de Ocupación',
        endpoints: {
            pdf: '/api/reports/occupancy/pdf',
            csv: '/api/reports/occupancy/csv'
        },
        mapStateToParams: (state) => ({
            startDate: state.startDate,
            endDate: state.endDate,
            spaceIds: state.spaceIds
        })
    }
};
