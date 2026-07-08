import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import SpaceForm from './SpaceForm';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * @file SpaceForm.test.tsx
 * @description Suite de pruebas para el formulario de espacios (creación y edición).
 * Verifica que los campos sean válidos y que los errores tanto del lado del cliente como del servidor se manejen adecuadamente.
 */
describe('SpaceForm', () => {
    const defaultProps = {
        open: true,
        handleClose: vi.fn(),
        onSuccess: vi.fn(),
    };

    /**
     * Verifica que el formulario presente los campos requeridos vacíos 
     * en la modalidad de creación de nuevo espacio.
     */
    it('debe renderizar los campos obligatorios en modo creación', () => {
        render(<SpaceForm {...defaultProps} />);
        
        expect(screen.getByText(/nuevo espacio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/nombre del espacio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/tipo de espacio/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/capacidad total/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /crear espacio/i })).toBeInTheDocument();
    });

    /**
     * Verifica que si se intenta dejar vacío un campo obligatorio y se pierde el foco,
     * el formulario notifique al usuario de un error de validación en dicho campo.
     */
    it('debe mostrar errores de validación al perder el foco en campos vacíos', async () => {
        render(<SpaceForm {...defaultProps} />);
        
        const nameInput = screen.getByLabelText(/nombre del espacio/i);
        fireEvent.blur(nameInput);

        expect(await screen.findByText(/el nombre es obligatorio/i)).toBeInTheDocument();
    });

    /**
     * Verifica que si todos los datos introducidos son correctos,
     * se habilite el botón para enviar el formulario y notifique el éxito de la creación.
     */
    it('debe permitir crear un espacio con datos válidos', async () => {
        render(<SpaceForm {...defaultProps} />);
        
        fireEvent.change(screen.getByLabelText(/nombre del espacio/i), { target: { value: 'Nueva Aula' } });
        
        fireEvent.mouseDown(screen.getByLabelText(/tipo de espacio/i));
        const aulaOption = await screen.findByRole('option', { name: /AULA/ });
        fireEvent.click(aulaOption);

        fireEvent.change(screen.getByLabelText(/capacidad total/i), { target: { value: '40' } });

        const submitButton = screen.getByRole('button', { name: /crear espacio/i });
        expect(submitButton).not.toBeDisabled();
        
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(defaultProps.onSuccess).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que en modo de edición, el formulario se precargue
     * con los datos actuales del espacio.
     */
    it('debe cargar datos iniciales en modo edición', () => {
        const initialData = {
            id: 1,
            name: 'Aula 101',
            type: 'AULA' as const,
            totalCapacity: 50,
            status: 'DISPONIBLE' as const,
            computerCount: 20
        };

        render(<SpaceForm {...defaultProps} initialData={initialData} />);
        
        expect(screen.getByText(/editar espacio/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Aula 101')).toBeInTheDocument();
        expect(screen.getByDisplayValue('50')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
    });

    /**
     * Verifica que si la API rechaza la solicitud de creación (ej. nombre duplicado),
     * se muestre un mensaje de error claro al usuario devuelto por el servidor.
     */
    it('debe mostrar errores del servidor si la creación falla', async () => {
        server.use(
            http.post('/api/spaces', () => {
                return HttpResponse.json(
                    { message: 'El nombre del espacio ya está en uso' }, 
                    { status: 400 }
                );
            })
        );

        render(<SpaceForm {...defaultProps} />);
        
        fireEvent.change(screen.getByLabelText(/nombre del espacio/i), { target: { value: 'Aula Duplicada' } });
        
        fireEvent.mouseDown(screen.getByLabelText(/tipo de espacio/i));
        const aulaOption = await screen.findByRole('option', { name: /AULA/ });
        fireEvent.click(aulaOption);

        fireEvent.change(screen.getByLabelText(/capacidad total/i), { target: { value: '40' } });
        
        fireEvent.click(screen.getByRole('button', { name: /crear espacio/i }));

        expect(await screen.findByText(/el nombre del espacio ya está en uso/i)).toBeInTheDocument();
    });
});
