import React from 'react';
import ReservationForm from '../../reservations/components/reservation-form/ReservationForm';
import BlockForm from '../../reservations/components/BlockForm';
import DeleteReservationDialog from '../../reservations/components/DeleteReservationDialog';
import RejectReservationDialog from '../../reservations/components/RejectReservationDialog';
import CalendarDetailsDialog from '../../reservations/components/CalendarDetailsDialog';
import ConfirmCalendarActionDialog from '../../reservations/components/ConfirmCalendarActionDialog';
import type { CalendarEvent } from '../hooks/useCalendarEvents';
import { type ReservationSlot } from '../../reservations/hooks/useReservationForm';

/**
 * Definición de la estructura de datos que gestiona el gestor de modales del calendario.
 */
export interface CalendarModalData {
    /** ID de la reserva a inspeccionar en detalle. */
    details: number | null;
    /** ID de la reserva o bloqueo a editar. */
    edit: number | null;
    /** Franja horaria para la creación de una nueva reserva. */
    create: ReservationSlot | null;
    /** ID de la reserva a eliminar o cancelar. */
    delete: number | null;
    /** ID de la reserva a rechazar. */
    reject: number | null;
    /** Datos para confirmar una acción de arrastrar o redimensionar un evento. */
    confirmAction: {
        event: CalendarEvent;
        start: Date;
        end: Date;
        type: 'MOVE' | 'RESIZE';
    } | null;
}

/**
 * Propiedades para el componente CalendarDialogs.
 */
interface CalendarDialogsProps {
    /** Gestor del estado de los distintos modales. */
    modals: {
        isOpen: (key: keyof CalendarModalData) => boolean;
        close: (key: keyof CalendarModalData) => void;
        open: (key: keyof CalendarModalData, data?: any) => void;
        getData: (key: keyof CalendarModalData) => any;
    };
    /** Evento actualmente seleccionado en el calendario. */
    selectedEvent: CalendarEvent | null;
    /** Indica si el usuario actual posee permisos de edición global. */
    canEdit: boolean;
    /** Indica si el usuario actual posee permisos de borrado global. */
    canDelete: boolean;
    /** Indica si el usuario actual posee permisos para aprobar o rechazar reservas. */
    canApproveReject: boolean;
    /** Función a ejecutar para forzar la actualización de las reservas. */
    onFetchReservations: () => void;
    /** Función para mostrar notificaciones de éxito o error. */
    onShowSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
    /** Función para aprobar una reserva pendiente. */
    onApprove: (reservationId: number) => Promise<boolean>;
    /** Función para confirmar la modificación temporal de un evento. */
    onConfirmAction: () => void;
}

/**
 * Componente contenedor que agrupa todos los diálogos y modales flotantes relacionados
 * con la vista de calendario. Facilita la gestión centralizada de los estados
 * y acciones asociadas a cada formulario de reserva o confirmación.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React que engloba la jerarquía de modales del calendario.
 */
const CalendarDialogs: React.FC<CalendarDialogsProps> = ({
    modals,
    selectedEvent,
    canEdit,
    canDelete,
    canApproveReject,
    onFetchReservations,
    onShowSnackbar,
    onApprove,
    onConfirmAction
}) => {
    
    const handleSuccess = (msg: string, modalKey: keyof CalendarModalData) => {
        modals.close(modalKey);
        onShowSnackbar(msg, 'success');
    };

    const handleInternalApprove = async (res: any) => {
        const success = await onApprove(res.id);
        if (success) {
            modals.close('details');
        }
    };

    const reservationId = typeof modals.getData('details') === 'number' ? modals.getData('details') : null;
    const reservationObject = typeof modals.getData('details') === 'object' ? modals.getData('details') : null;

    return (
        <>
            {/* Detalles de la Reserva */}
            <CalendarDetailsDialog 
                open={modals.isOpen('details')} 
                onClose={() => modals.close('details')} 
                reservationId={reservationId}
                reservation={reservationObject || selectedEvent?.resource}
                canEdit={canEdit} 
                canDelete={canDelete}
                canApproveReject={canApproveReject}
                onEdit={(id) => { modals.close('details'); modals.open('edit', id); }}
                onDelete={(id) => { modals.close('details'); modals.open('delete', id); }}
                onApprove={handleInternalApprove}
                onReject={(id) => { modals.close('details'); modals.open('reject', id); }}
            />

            {/* Confirmación de Movimiento/Redimensionamiento (Drag & Drop) */}
            <ConfirmCalendarActionDialog 
                open={modals.isOpen('confirmAction')} 
                onClose={() => modals.close('confirmAction')}
                onConfirm={onConfirmAction} 
                event={modals.getData('confirmAction')?.event || null}
                newStart={modals.getData('confirmAction')?.start || null} 
                newEnd={modals.getData('confirmAction')?.end || null}
                actionType={modals.getData('confirmAction')?.type || 'MOVE'}
            />

            {/* Formulario de Nueva Reserva */}
            <ReservationForm 
                open={modals.isOpen('create')} 
                handleClose={() => modals.close('create')} 
                onSuccess={(msg) => handleSuccess(msg, 'create')} 
                initialSlot={modals.getData('create')} 
            />

            {/* Formulario de Edición de Reserva / Bloqueo */}
            {selectedEvent?.resource?.status === 'BLOQUEO' ? (
                <BlockForm
                    open={modals.isOpen('edit')}
                    handleClose={() => modals.close('edit')}
                    onSuccess={(msg) => handleSuccess(msg, 'edit')}
                    space={null}
                    initialData={selectedEvent.resource}
                />
            ) : (
                <ReservationForm 
                    open={modals.isOpen('edit')} 
                    handleClose={() => modals.close('edit')} 
                    onSuccess={(msg) => handleSuccess(msg, 'edit')} 
                    initialData={selectedEvent?.resource} 
                />
            )}

            {/* Diálogo de Eliminación (Cancelación) */}
            <DeleteReservationDialog 
                open={modals.isOpen('delete')} 
                reservation={selectedEvent?.resource} 
                handleClose={() => modals.close('delete')} 
                onSuccess={(msg) => handleSuccess(msg, 'delete')} 
            />

            {/* Diálogo de Rechazo (Administrador) */}
            <RejectReservationDialog 
                open={modals.isOpen('reject')} 
                reservation={selectedEvent?.resource} 
                handleClose={() => modals.close('reject')} 
                onSuccess={(msg) => handleSuccess(msg, 'reject')} 
            />
        </>
    );
};

export default React.memo(CalendarDialogs);
