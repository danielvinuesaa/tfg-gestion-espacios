import React from 'react';
import ExportDataDialog, { type ExportColumn } from '../../../shared/components/ExportDataDialog';

/**
 * Propiedades requeridas para configurar el diálogo de exportación de espacios.
 */
interface ExportSpacesDialogProps {
    /** Indica si el diálogo se encuentra abierto. */
    open: boolean;
    /** Función invocada al solicitar el cierre del diálogo. */
    onClose: () => void;
    /** Función invocada para ejecutar la exportación, recibe las columnas a incluir. */
    onExport: (columns: string[]) => void;
}

const SPACE_COLUMNS: ExportColumn[] = [
    { id: 'name', label: 'Nombre' },
    { id: 'type', label: 'Tipo de Espacio' },
    { id: 'totalCapacity', label: 'Capacidad Total' },
    { id: 'computerCount', label: 'Ordenadores' },
    { id: 'status', label: 'Estado' },
    { id: 'gisId', label: 'GIS ID' }
];

/**
 * Componente que presenta un cuadro de diálogo interactivo para configurar la exportación
 * de la lista de espacios. Permite al usuario seleccionar qué campos (columnas) desea exportar.
 *
 * @param props - Propiedades que controlan la visibilidad y las acciones del diálogo.
 * @returns Un elemento JSX con el diálogo de exportación configurado.
 */
const ExportSpacesDialog = (props: ExportSpacesDialogProps) => (
    <ExportDataDialog
        {...props}
        title="Configurar Exportación de Espacios"
        columns={SPACE_COLUMNS}
        infoMessage="Se exportará la lista de espacios aplicando los filtros actuales de la tabla."
    />
);

export default ExportSpacesDialog;
