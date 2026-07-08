import React from 'react';
import GenericImportDialog from '../../../shared/components/GenericImportDialog';
import RoomIcon from '@mui/icons-material/Room';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Typography, Alert, Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../shared/utils/api';
import ImportConflictChip from '../../../shared/components/Chips/ImportConflictChip';

/**
 * Propiedades para el componente ImportSpacesDialog.
 */
interface ImportSpacesDialogProps {
    /** Indica si el diálogo de importación debe mostrarse. */
    open: boolean;
    /** Función para cerrar el diálogo. */
    handleClose: () => void;
    /** 
     * Función que se invoca tras una importación exitosa.
     * @param message - Mensaje opcional de éxito.
     */
    onSuccess: (message?: string) => void;
}

/**
 * Representa un conflicto detectado durante el proceso de importación de espacios.
 */
interface ImportConflict {
    /** Nombre del espacio. */
    name: string;
    /** Tipo de espacio propuesto. */
    type: string;
    /** Capacidad propuesta. */
    capacity: number;
    /** Estado propuesto. */
    status: string;
    /** Tipo de espacio actual en el sistema. */
    currentType: string;
    /** Capacidad actual en el sistema. */
    currentCapacity: number;
    /** Estado actual en el sistema. */
    currentStatus: string;
    /** Indica si el espacio tiene reservas asociadas. */
    hasReservations: boolean;
    /** Indica si el espacio puede ser sobreescrito sin riesgo. */
    canOverwrite: boolean;
}

/**
 * Diálogo de importación adaptado para el módulo de Espacios.
 * Recupera dinámicamente los tipos válidos del sistema desde el backend y permite validar,
 * previsualizar conflictos y llevar a cabo la importación de espacios mediante un archivo CSV.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que renderiza el diálogo de importación.
 */
const ImportSpacesDialog = ({ open, handleClose, onSuccess }: ImportSpacesDialogProps) => {
    const { request } = useApi();
    
    // Recuperamos los tipos de espacios válidos definidos en el sistema (Backend)
    const { data: types = [] } = useQuery<string[]>({
        queryKey: ['/api/spaces/types'],
        queryFn: () => request('/api/spaces/types'),
        enabled: open
    });

    const typesList = types.length > 0 
        ? types.join(', ') 
        : 'AULA, LABORATORIO, SALA_ESTUDIO, SALON_ACTOS, DESPACHO, OTROS';

    const config = {
        title: "Importar Espacios",
        icon: <RoomIcon />,
        apiEndpoints: {
            validate: '/api/spaces/import/validate',
            import: '/api/spaces/import'
        },
        queryKey: ['/api/spaces'],
        csvFormat: "Nombre; Tipo; Capacidad; Estado; ID GIS",
        instructions: [
            `Tipos válidos: ${typesList}`,
            "Capacidad: Debe ser un número entero mayor o igual a 1.",
            "Estado (opcional): Disponible, Eliminado (por defecto: Disponible)",
            "ID GIS (opcional): Identificador técnico para integración con mapas",
            "Política: Los espacios existentes se pueden actualizar si no tienen reservas."
        ],
        renderConflictRow: (c: ImportConflict) => {
            const hasTypeChange = c.type !== c.currentType;
            const hasCapacityChange = c.capacity !== c.currentCapacity;
            const hasStatusChange = c.status !== c.currentStatus;
            
            const hasAnyChange = hasTypeChange || hasCapacityChange || hasStatusChange;

            return {
                identity: (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">{c.name}</Typography>
                        <Typography variant="caption" color="textSecondary">{c.currentType}</Typography>
                    </Box>
                ),
                changes: (
                    <Box>
                        {hasTypeChange && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                <strong>Tipo:</strong> {c.currentType} → {c.type}
                            </Typography>
                        )}
                        {hasCapacityChange && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                <strong>Capacidad:</strong> {c.currentCapacity} → {c.capacity}
                            </Typography>
                        )}
                        {hasStatusChange && (
                            <Typography variant="caption" display="block" color="textSecondary">
                                <strong>Estado:</strong> {c.currentStatus} → {c.status}
                            </Typography>
                        )}
                        {!hasAnyChange && (
                            <Typography variant="caption" color="textDisabled" sx={{ fontStyle: 'italic' }}>
                                Sin cambios detectados
                            </Typography>
                        )}
                    </Box>
                ),
                status: c.canOverwrite ? (
                    <ImportConflictChip type="EXISTING" />
                ) : (
                    <ImportConflictChip type="BLOCKED" />
                )
            };
        },
        conflictAlertMessage: (count: number, result: any) => {
            const criticalConflicts = result?.conflicts?.filter((c: ImportConflict) => !c.canOverwrite).length || 0;
            const newCount = result?.newCount || 0;
            const errorCount = result?.errors?.length || 0;
            
            // Caso 1: Archivo con errores críticos y nada procesable
            if (newCount === 0 && count === 0 && errorCount > 0) {
                return (
                    <Alert severity="error" icon={<WarningAmberIcon />}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            Archivo no procesable
                        </Typography>
                        <Typography variant="body2">
                            No se han detectado registros válidos. Por favor, revise los errores de formato y vuelva a intentarlo.
                        </Typography>
                    </Alert>
                );
            }

            const severity = count === 0 ? "success" : (criticalConflicts > 0 ? "error" : "warning");
            
            return (
                <Alert severity={severity} icon={<WarningAmberIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {count === 0 
                            ? (newCount > 0 ? "¡Archivo listo para importar!" : "Archivo validado")
                            : `Se ${count === 1 ? 'ha' : 'han'} detectado ${count} espacio${count === 1 ? '' : 's'} que ya existe${count === 1 ? '' : 'n'}.`}
                    </Typography>
                    {count > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" display="block">• <strong>Importar solo nuevos:</strong> Se añadirán los registros nuevos. Los espacios existentes no se tocarán.</Typography>
                            <Typography variant="body2" display="block">• <strong>Importar y actualizar:</strong> Se actualizarán los datos de los espacios actuales.</Typography>
                            {criticalConflicts > 0 && (
                                <Typography variant="body2" display="block" sx={{ mt: 0.5, color: 'error.main', fontWeight: 'bold' }}>
                                    Nota: {criticalConflicts} espacio{criticalConflicts === 1 ? '' : 's'} con reservas vinculadas no se podrá{criticalConflicts === 1 ? 'n' : 'n'} actualizar por seguridad.
                                </Typography>
                            )}
                        </Box>
                    )}
                    {count === 0 && newCount > 0 && (
                        <Typography variant="body2">
                            {errorCount === 0 
                                ? "Todos los espacios del archivo son nuevos y se crearán correctamente en el sistema."
                                : `Se ${newCount === 1 ? 'ha' : 'han'} detectado ${newCount} espacio${newCount === 1 ? '' : 's'} nuevo${newCount === 1 ? '' : 's'} que se ${newCount === 1 ? 'creará' : 'crearán'} correctamente en el sistema.`}
                        </Typography>
                    )}
                </Alert>
            );
        }
    };

    return (
        <GenericImportDialog<ImportConflict>
            open={open}
            handleClose={handleClose}
            onSuccess={onSuccess}
            config={config}
        />
    );
};

export default ImportSpacesDialog;
