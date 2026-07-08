import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import ReservationForm from './ReservationForm';

/**
 * Suite de pruebas unitarias para el formulario de creación de reservas.
 * Comprueba que la interfaz del formulario y sus distintas secciones
 * se presenten correctamente al usuario.
 */
describe('ReservationForm', () => {
    const defaultProps = {
        open: true,
        handleClose: vi.fn(),
        onSuccess: vi.fn(),
    };

    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que se visualicen el título principal y el botón
     * de solicitud de reserva cuando se abre el formulario.
     */
    it('debe renderizar el título del formulario de nueva reserva', async () => {
        render(<ReservationForm {...defaultProps} />);
        
        expect(await screen.findByText('Nueva Reserva')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /solicitar reserva/i })).toBeInTheDocument();
    });

    /**
     * Verifica que el formulario presente adecuadamente las secciones
     * o pasos necesarios para completar la información.
     */
    it('debe contener las secciones del stepper o acordeones', async () => {
        render(<ReservationForm {...defaultProps} />);
        
        expect(await screen.findByText(/detalles de la actividad/i)).toBeInTheDocument();
        expect(screen.getByText(/ubicación y horario/i)).toBeInTheDocument();
        expect(screen.getByText(/responsabilidad y notas/i)).toBeInTheDocument();
    });
});
