import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import CalendarDialogs from './CalendarDialogs';

// Mock de todos los diálogos hijos para simplificar
vi.mock('../../reservations/components/reservation-form/ReservationForm', () => ({
    default: ({ open, onSuccess }: any) => open ? <div data-testid="reservation-form"><button onClick={() => onSuccess('success msg')}>Submit</button></div> : null
}));
vi.mock('../../reservations/components/DeleteReservationDialog', () => ({
    default: ({ open }: any) => open ? <div data-testid="delete-dialog">Delete</div> : null
}));
vi.mock('../../reservations/components/RejectReservationDialog', () => ({
    default: ({ open }: any) => open ? <div data-testid="reject-dialog">Reject</div> : null
}));
vi.mock('../../reservations/components/CalendarDetailsDialog', () => ({
    default: ({ open, onEdit, onDelete, onReject }: any) => open ? (
        <div data-testid="details-dialog">
            Details
            <button onClick={() => onEdit(1)}>Edit</button>
            <button onClick={() => onDelete(1)}>Delete</button>
            <button onClick={() => onReject(1)}>Reject</button>
        </div>
    ) : null
}));
vi.mock('../../reservations/components/ConfirmCalendarActionDialog', () => ({
    default: ({ open }: any) => open ? <div data-testid="confirm-action-dialog">Confirm Action</div> : null
}));

/**
 * Suite de pruebas para el componente CalendarDialogs.
 * Verifica la correcta renderización e interacción de los diferentes diálogos modales
 * utilizados en el calendario (creación, detalles, edición, confirmación).
 */
describe('CalendarDialogs', () => {
    const mockModals = {
        isOpen: vi.fn(),
        close: vi.fn(),
        open: vi.fn(),
        getData: vi.fn()
    };

    const defaultProps = {
        modals: mockModals as any,
        selectedEvent: null,
        canManage: true,
        canApproveReject: true,
        onFetchReservations: vi.fn(),
        onShowSnackbar: vi.fn(),
        onApprove: vi.fn(),
        onConfirmAction: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Verifica que el diálogo de detalles de reserva se renderice
     * correctamente cuando su estado de apertura es verdadero.
     */
    it('debe renderizar el diálogo de detalles si está abierto', () => {
        mockModals.isOpen.mockImplementation((key) => key === 'details');
        render(<CalendarDialogs {...defaultProps} />);
        
        expect(screen.getByTestId('details-dialog')).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en el botón de edición desde el diálogo de detalles,
     * se cierre dicho diálogo y se abra el de edición con los datos correspondientes.
     */
    it('debe abrir el diálogo de edición desde detalles', () => {
        mockModals.isOpen.mockImplementation((key) => key === 'details');
        render(<CalendarDialogs {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Edit'));
        
        expect(mockModals.close).toHaveBeenCalledWith('details');
        expect(mockModals.open).toHaveBeenCalledWith('edit', 1);
    });

    /**
     * Verifica que tras enviar con éxito el formulario de creación de reserva,
     * el diálogo se cierre y se muestre un mensaje de confirmación al usuario.
     */
    it('debe manejar el éxito de una creación correctamente', () => {
        mockModals.isOpen.mockImplementation((key) => key === 'create');
        render(<CalendarDialogs {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Submit'));
        
        expect(mockModals.close).toHaveBeenCalledWith('create');
        expect(defaultProps.onShowSnackbar).toHaveBeenCalledWith('success msg', 'success');
    });

    /**
     * Verifica que el diálogo de confirmación de acción se renderice
     * correctamente cuando su estado de apertura es verdadero.
     */
    it('debe renderizar confirmAction dialog si está abierto', () => {
        mockModals.isOpen.mockImplementation((key) => key === 'confirmAction');
        render(<CalendarDialogs {...defaultProps} />);
        
        expect(screen.getByTestId('confirm-action-dialog')).toBeInTheDocument();
    });
});
