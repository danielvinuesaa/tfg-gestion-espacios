import React from 'react';
import ExportDataDialog, { type ExportColumn } from '../../../shared/components/ExportDataDialog';

/**
 * Propiedades del componente ExportReservationsDialog.
 */
interface ExportReservationsDialogProps {
    open: boolean;
    onClose: () => void;
    onExport: (columns: string[]) => void;
}

const RESERVATION_COLUMNS: ExportColumn[] = [
    { id: 'title', label: 'Título de la Reserva' },
    { id: 'subjectCode', label: 'Código de Asignatura (Docencia)' },
    { id: 'startDate', label: 'Fecha de Inicio' },
    { id: 'startTime', label: 'Hora de Inicio' },
    { id: 'endDate', label: 'Fecha de Fin' },
    { id: 'endTime', label: 'Hora de Fin' },
    { id: 'duration', label: 'Duración (Minutos)' },
    { id: 'description', label: 'Descripción' },
    { id: 'location', label: 'Espacios / Aulas' },
    { id: 'status', label: 'Estado Actual' },
    { id: 'type', label: 'Tipo de Actividad' },
    { id: 'responsible', label: 'Persona Responsable' }
];

/**
 * Componente de diálogo destinado a configurar la exportación del listado de reservas.
 * 
 * Este componente permite al usuario visualizar y confirmar la exportación de datos,
 * sirviéndose de una estructura estandarizada mediante `ExportDataDialog`. Las columnas a exportar 
 * se encuentran predefinidas en el contexto del módulo de reservas.
 * 
 * @param props - Propiedades del componente para controlar el diálogo de exportación.
 * @param props.open - Indica si el diálogo se encuentra actualmente visible.
 * @param props.onClose - Callback invocado para cerrar el diálogo sin realizar la exportación.
 * @param props.onExport - Callback invocado al confirmar la exportación, recibe la lista de identificadores de las columnas a exportar.
 * @returns Elemento React que muestra la interfaz de configuración de exportación.
 */
const ExportReservationsDialog = (props: ExportReservationsDialogProps) => (
    <ExportDataDialog
        {...props}
        title="Configurar Exportación de Reservas"
        columns={RESERVATION_COLUMNS}
        infoMessage="El Código de Asignatura solo se incluirá en reservas de tipo Clase o Examen vinculadas al planificador."
    />
);

export default ExportReservationsDialog;
