import React from 'react';
import ExportDataDialog, { type ExportColumn } from '../../../shared/components/ExportDataDialog';

/**
 * Representa las propiedades necesarias para configurar el diálogo de exportación de auditoría.
 */
interface ExportAuditDialogProps {
    /** Indica si el diálogo se encuentra abierto y visible. */
    open: boolean;
    /** Función de retrollamada invocada para cerrar el diálogo. */
    onClose: () => void;
    /** Función de retrollamada invocada al confirmar la exportación, recibe las columnas seleccionadas. */
    onExport: (columns: string[]) => void;
}

const AUDIT_COLUMNS: ExportColumn[] = [
    { id: 'timestamp', label: 'Fecha y Hora' },
    { id: 'action', label: 'Acción Realizada' },
    { id: 'performedBy', label: 'Usuario / Actor' },
    { id: 'entity', label: 'Entidad Afectada' },
    { id: 'details', label: 'Detalles' }
];

/**
 * Componente que presenta un cuadro de diálogo para la configuración y exportación
 * del historial de registros de auditoría.
 *
 * @param props - Propiedades del componente, incluyendo el estado de visibilidad y funciones manejadoras.
 * @returns Un elemento JSX que representa el diálogo modal de exportación.
 */
const ExportAuditDialog = (props: ExportAuditDialogProps) => (
    <ExportDataDialog
        {...props}
        title="Exportar Historial de Auditoría"
        columns={AUDIT_COLUMNS}
        infoMessage="Se exportarán los registros de auditoría aplicando los filtros actuales (rango de fechas, usuario y tipo de acción)."
    />
);

export default ExportAuditDialog;
