import React from 'react';
import ExportDataDialog, { type ExportColumn } from '../../../../shared/components/ExportDataDialog';

/**
 * Propiedades del componente {@link ExportUsersDialog}.
 */
interface ExportUsersDialogProps {
    /** Indica si el diálogo está visible. */
    open: boolean;
    /** Función para cerrar el diálogo. */
    onClose: () => void;
    /** Función callback que se invoca con las columnas seleccionadas para la exportación. */
    onExport: (columns: string[]) => void;
}

const USER_COLUMNS: ExportColumn[] = [
    { id: 'name', label: 'Nombre Completo' },
    { id: 'email', label: 'Correo Electrónico' },
    { id: 'role', label: 'Rol / Permisos' },
    { id: 'status', label: 'Estado de Cuenta' }
];

/**
 * Diálogo para configurar y lanzar la exportación del listado de usuarios a un archivo (ej. CSV).
 * Permite seleccionar qué columnas específicas se desean incluir en el reporte.
 * 
 * @param props - Propiedades del componente.
 * @returns Componente JSX que representa el diálogo de exportación.
 */
const ExportUsersDialog = (props: ExportUsersDialogProps) => (
    <ExportDataDialog
        {...props}
        title="Configurar Exportación de Usuarios"
        columns={USER_COLUMNS}
        infoMessage="Se exportará la lista de usuarios aplicando los filtros actuales de la tabla."
    />
);

export default ExportUsersDialog;
