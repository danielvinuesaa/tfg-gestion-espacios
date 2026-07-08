import React from 'react';
import GenericImportDialog from '../../../shared/components/GenericImportDialog';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Typography, Alert, Box } from '@mui/material';
import ImportConflictChip from '../../../shared/components/Chips/ImportConflictChip';

/**
 * Propiedades del componente ImportReservationsDialog.
 */
interface ImportReservationsDialogProps {
    open: boolean;
    handleClose: () => void;
    onSuccess: (message?: string) => void;
}

/**
 * Interfaz que define la estructura de un conflicto o advertencia detectada durante el proceso de importación de reservas.
 * 
 * @property subjectCode - Código de la asignatura asociada a la reserva conflictiva.
 * @property startTime - Hora de inicio propuesta.
 * @property endTime - Hora de fin propuesta.
 * @property location - Espacio(s) solicitado(s) para la reserva.
 * @property description - Descripción del propósito de la reserva.
 * @property type - Clasificación de la reserva (ej. CLASE, EXAMEN).
 * @property message - Mensaje descriptivo detallando la naturaleza del conflicto o error.
 * @property conflictingReservations - Lista opcional de identificadores o descripciones de las reservas con las que colisiona.
 */
interface ReservationImportConflict {
    subjectCode: String;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    type: string;
    message: string;
    conflictingReservations?: string[];
}

/**
 * Componente que adapta y presenta el diálogo de importación masiva específicamente para el módulo de Reservas.
 * 
 * Emplea el componente genérico `GenericImportDialog` para facilitar la subida de archivos (CSV), y 
 * proporcionar una validación temprana de conflictos temporales y lógicos antes de consolidar la importación
 * en la base de datos.
 * 
 * @param props - Propiedades requeridas por el componente.
 * @param props.open - Estado booleano que controla la visibilidad de la ventana modal.
 * @param props.handleClose - Callback encargado de solicitar el cierre del diálogo.
 * @param props.onSuccess - Callback invocado cuando la importación masiva concluye satisfactoriamente, recibiendo un mensaje de confirmación opcional.
 * @returns Elemento React que representa el asistente de importación de reservas.
 */
const ImportReservationsDialog = ({ open, handleClose, onSuccess }: ImportReservationsDialogProps) => {
    const config = {
        title: "Importar Reservas",
        icon: <CloudUploadIcon />,
        apiEndpoints: {
            validate: '/api/reservations/import/validate',
            import: '/api/reservations/import'
        },
        // Configuración de TanStack Query integrada
        queryKey: ['/api/reservations'],
        csvFormat: "Subject; Start Date; Start Time; End Date; End Time; Description; Location; [Type]",
        instructions: [
            "Columnas obligatorias (0-6): Asignatura, Fecha Inicio, Hora Inicio, Fecha Fin, Hora Fin, Descripción, Espacios.",
            "Columna opcional (7): Tipo de Actividad (CLASE, EXAMEN, OTRO). Si no se indica nada, por defecto es 'CLASE'.",
            "Formato fecha: DD/MM/YYYY | Formato hora: HH.MM (Ej: 14.30)",
            "No se permiten reservas pasadas: La fecha de inicio debe ser posterior al momento actual.",
            "Multi-Aula: Lista varios espacios separados por comas (Ej: Aula 101, Aula 102).",
            "Errores: El sistema valida que el código de la asignatura y los espacios existan."
        ],
        renderConflictRow: (c: ReservationImportConflict) => {
            const isOverlap = c.type === 'OVERLAP';
            return {
                identity: (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">{c.subjectCode}</Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                            {c.location} | {c.startTime} - {c.endTime.split(' ')[2]}
                        </Typography>
                    </Box>
                ),
                changes: (
                    <Box>
                        <Typography variant="caption" color={isOverlap ? "error" : "warning.main"} sx={{ display: 'block' }}>
                            {c.message}
                        </Typography>
                    </Box>
                ),
                status: (
                    <ImportConflictChip 
                        type={isOverlap ? "OVERLAP" : "INVALID"} 
                    />
                )
            };
        },
        conflictAlertMessage: (count: number, result: any) => {
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
                            No se han detectado reservas válidas. Por favor, revise los errores de formato y la existencia de los recursos indicados.
                        </Typography>
                    </Alert>
                );
            }

            const severity = count === 0 ? "success" : "warning";
            return (
                <Alert severity={severity} icon={<WarningAmberIcon />}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {count === 0 
                            ? (newCount > 0 ? "¡Archivo listo para importar!" : "Archivo validado")
                            : `Se ${count === 1 ? 'ha' : 'han'} detectado ${count} reserva${count === 1 ? '' : 's'} con conflictos o datos inválidos.`}
                    </Typography>
                    {count > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                                {newCount > 0 
                                    ? <>Se ${newCount === 1 ? 'importará únicamente la' : 'importarán únicamente las'} <strong>{newCount}</strong> reserva${newCount === 1 ? ' válida' : 's válidas'}. Las filas con conflictos o errores serán omitidas por seguridad.</>
                                    : "No se han detectado reservas nuevas procesables. Las filas con conflictos o errores serán omitidas por seguridad."}
                            </Typography>
                        </Box>
                    )}
                    {count === 0 && newCount > 0 && (
                        <Typography variant="body2">
                            {errorCount === 0 
                                ? `No se han detectado conflictos temporales. Todas las reservas del archivo están listas para procesarse.`
                                : `No se han detectado conflictos temporales. Se ${newCount === 1 ? 'ha' : 'han'} detectado ${newCount} reserva${newCount === 1 ? ' válida que está lista' : 's válidas que están listas'} para procesarse.`}
                        </Typography>
                    )}
                </Alert>
            );
        },
        hideOverwrite: true,
        labels: {
            new: "Nueva",
            newPlural: "Nuevas"
        }
    };

    return (
        <GenericImportDialog<ReservationImportConflict>
            open={open}
            handleClose={handleClose}
            onSuccess={onSuccess}
            config={config}
        />
    );
};

export default ImportReservationsDialog;
