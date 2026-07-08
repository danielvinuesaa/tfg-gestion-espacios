import React from 'react';
import BulkDeleteConflictDialog from './BulkDeleteConflictDialog';
import type { BulkConflictSummary } from '../types/bulk';

/**
 * Interfaz de configuración que define los aspectos visuales y semánticos
 * para el diálogo de eliminación o acción en lote.
 */
export interface BulkDeleteConfig {
    /** El título principal que encabezará el cuadro de diálogo (por ejemplo: "¿Eliminar Lote de Usuarios?"). */
    title: string;
    /** El nombre de la entidad en formato singular (por ejemplo: "usuario"). */
    resourceNameSingular: string;
    /** El nombre de la entidad en formato plural (por ejemplo: "usuarios"). */
    resourceNamePlural: string;
    /** Texto que clasifica el tipo de impacto o entidades asociadas (por ejemplo: "reservas activas", "usuarios vinculados"). */
    impactTypeLabel: string;
    /** Texto alternativo para el botón de confirmación en caso de detectarse dependencias o conflictos. */
    confirmTextWithConflicts?: string;
    /** Indicador para adecuar la concordancia gramatical; determina si el recurso es de género femenino. */
    isFeminine?: boolean;
    /** El verbo en infinitivo que describe la acción primaria (por ejemplo: "eliminar", "cancelar"). El valor predeterminado es "eliminar". */
    actionVerb?: string;
    /** Sustantivo derivado de la acción a ejecutar (por ejemplo: "Eliminación", "Cancelación"). El valor predeterminado es "Eliminación". */
    actionNoun?: string;
}

/**
 * Interfaz que determina las propiedades del componente del cuadro de diálogo para operaciones masivas.
 */
interface BulkDeleteResourceDialogProps {
    /** Propiedad booleana que dicta la visibilidad del diálogo en la pantalla. */
    open: boolean;
    /** Función callback requerida para invocar el cierre y ocultamiento del diálogo. */
    onClose: () => void;
    /** 
     * Función callback requerida al confirmar la acción destructiva o de alteración.
     * Puede admitir la transferencia de un conjunto de datos adicional (payload).
     * 
     * @param payload - Información adicional relevante para la operación, como identificadores de reasignación.
     */
    onConfirm: (payload?: any) => void;
    /** Indicador que notifica la ejecución en curso de la operación de backend. */
    loading: boolean;
    /** Un objeto estructural que enumera y cuantifica las colisiones, referencias cruzadas o conflictos detectados. */
    summary: BulkConflictSummary | null;
    /** La configuración de léxico aplicada sobre los textos de la interfaz. */
    config: BulkDeleteConfig;
    /** Elementos u opciones interactivas adicionales inyectadas junto al cuerpo principal del diálogo. */
    extraActions?: React.ReactNode;
}

/**
 * Componente modular diseñado para la gestión y confirmación de operaciones de eliminación y procesamiento por lotes.
 * Abstrae y estandariza la representación visual, delegando de forma subyacente la resolución de 
 * elementos condicionales al componente `BulkDeleteConflictDialog`.
 * 
 * @param props - Propiedades requeridas y opcionales para la funcionalidad y estado del diálogo.
 * @returns Un componente reactivo funcional que instancia un cuadro de diálogo condicional.
 */
const BulkDeleteResourceDialog: React.FC<BulkDeleteResourceDialogProps> = ({
    open,
    onClose,
    onConfirm,
    loading,
    summary,
    config,
    extraActions
}) => {
    return (
        <BulkDeleteConflictDialog
            open={open}
            onClose={onClose}
            onConfirm={onConfirm}
            loading={loading}
            summary={summary}
            title={config.title}
            resourceNameSingular={config.resourceNameSingular}
            resourceNamePlural={config.resourceNamePlural}
            impactTypeLabel={config.impactTypeLabel}
            isFeminine={config.isFeminine}
            confirmTextWithConflicts={config.confirmTextWithConflicts}
            extraActions={extraActions}
            actionVerb={config.actionVerb}
            actionNoun={config.actionNoun}
        />
    );
};

export default BulkDeleteResourceDialog;
