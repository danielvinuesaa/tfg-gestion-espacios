import { useMemo } from 'react';
import type { Reservation } from '../../../../shared/types';
import { useReservationForm, type ReservationSlot } from '../../hooks/useReservationForm';
import { Box } from '@mui/material';
import { useSettings } from '../../../../context/SettingsContext';
import { useAuth } from '../../../../context/AuthContext';
import EventIcon from '@mui/icons-material/Event';

// Subcomponentes Especializados
import StickyAlerts from './components/StickyAlerts';
import ActivityDetails from './components/ActivityDetails';
import LocationSchedule from './components/LocationSchedule';
import ResponsibilityNotes from './components/ResponsibilityNotes';
import FormDialogWrapper from '../../../../shared/components/FormDialogWrapper';

/**
 * Propiedades del componente {@link ReservationForm}.
 */
interface ReservationFormProps {
    /** Indica si el diálogo está abierto y visible. */
    open: boolean;
    /** Función para manejar el cierre del formulario. */
    handleClose: () => void;
    /** Función que se ejecuta tras completarse la operación con éxito. */
    onSuccess: (message: string) => void;
    /** Datos iniciales de la reserva, en caso de estar en modo edición. */
    initialData?: Reservation | null;
    /** Hueco temporal inicial seleccionado desde el calendario, si lo hubiera. */
    initialSlot?: ReservationSlot | null;
}

/**
 * Orquestador Profesional de Solicitud y Edición de Reservas.
 * Refactorizado para usar FormDialogWrapper.
 * Gestiona todo el proceso de validación, delegación y confirmación de espacios.
 * 
 * @param props - Propiedades necesarias para renderizar el componente.
 * @returns Componente JSX que representa el formulario de reserva.
 */
const ReservationForm = ({ open, handleClose, onSuccess, initialData, initialSlot }: ReservationFormProps) => {
    const { hasPermission } = useAuth();
    const { timeSettings } = useSettings();

    // -- Lógica Centralizada --
    const {
        formData, loading, error, isDirty, isFromSearch,
        spaces, users, subjects,
        showResponsible, setShowResponsible,
        saveReservation, getFieldError,
        touched, handleBlur, setFields,
        conflictEngine
    } = useReservationForm(initialData, initialSlot, open, handleClose, onSuccess);

    // Permisos para habilitar la delegación de responsable (Administración/Gestión)
    const canDelegate = hasPermission('APROBAR_RESERVA') || 
                        hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') || 
                        hasPermission('CANCELAR_RESERVA');

    // Lógica de obligatoriedad: Clases y Exámenes requieren asignatura vinculada
    const isSubjectRequired = formData.type === 'CLASE' || formData.type === 'EXAMEN';

    // Mapeo de espacios seleccionados para cálculos de capacidad
    const selectedSpaces = useMemo(() => 
        spaces.filter(s => formData.spaceIds.includes(s.id)),
    [spaces, formData.spaceIds]);
    
    const totalCapacity = selectedSpaces.reduce((acc, s) => acc + s.totalCapacity, 0);

    /**
     * Validación de integridad del formulario antes de permitir el envío.
     */
    const isFormValid = useMemo(() => {
        const hasTitle = formData.title?.trim().length > 0;
        const hasType = formData.type !== '' && formData.type !== undefined;
        const hasSpaces = formData.spaceIds.length > 0;
        const hasDates = formData.startTime && formData.endTime;
        const hasSubjectIfRequired = !isSubjectRequired || (isSubjectRequired && formData.subjectId !== null);
        
        // Si es un bloqueo, permitimos guardar aunque haya conflictos (se cancelarán las otras)
        // Si es una reserva normal, los conflictos bloquean el guardado
        const noConflicts = formData.isBlock || !conflictEngine.hasConflicts;

        return hasTitle && hasType && hasSpaces && hasDates && hasSubjectIfRequired && noConflicts;
    }, [formData, isSubjectRequired, conflictEngine.hasConflicts]);

    const isEdit = initialData && typeof initialData === 'object' && 'id' in initialData;
return (
    <FormDialogWrapper
        open={open}
        onClose={handleClose}
        title={isEdit ? "Modificar Reserva" : "Nueva Reserva"}
        icon={<EventIcon color="primary" />}
        loading={loading}
        isDirty={isDirty}
        isValid={isFormValid}
        onSubmit={saveReservation}
        submitText={isEdit ? "Guardar Cambios" : "Solicitar Reserva"}
        confirmExitDescription="Hay cambios sin guardar en la reserva. Si sale ahora, se perderán de forma permanente."
    >
            {/* Zona de Mensajes Críticos (Sticky) */}
            <StickyAlerts 
                error={error} 
                isFromSearch={isFromSearch} 
                conflicts={conflictEngine.conflicts}
                isBlock={formData.isBlock}
            />

            <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* 1. Metadatos de la Actividad */}
                <ActivityDetails 
                    formData={formData} 
                    setFormData={setFields}
                    subjects={subjects}
                    isSubjectRequired={isSubjectRequired}
                    isDirty={isDirty}
                    getFieldError={getFieldError}
                    handleBlur={handleBlur}
                    touched={touched}
                />

                {/* 2. Configuración de Ubicación y Tiempos */}
                <LocationSchedule 
                    formData={formData}
                    setFormData={setFields}
                    spaces={spaces}
                    selectedSpaces={selectedSpaces}
                    totalCapacity={totalCapacity}
                    timeSettings={timeSettings}
                    getFieldError={getFieldError}
                    handleBlur={handleBlur}
                    touched={touched}
                    isCheckingConflicts={conflictEngine.isChecking}
                />

                {/* 3. Delegación y Documentación */}
                <ResponsibilityNotes 
                    canDelegate={canDelegate}
                    showResponsible={showResponsible}
                    setShowResponsible={setShowResponsible}
                    users={users}
                    formData={formData}
                    setFormData={setFields}
                    getFieldError={getFieldError}
                    handleBlur={handleBlur}
                    touched={touched}
                />
            </Box>
        </FormDialogWrapper>
    );
};

export default ReservationForm;
