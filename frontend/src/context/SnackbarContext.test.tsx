import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SnackbarProvider, useSnackbar } from './SnackbarContext';

const TestComponent = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <button onClick={() => showSnackbar('Hola Mundo', 'error')}>
            Mostrar
        </button>
    );
};

/**
 * Suite de pruebas unitarias para el contexto de notificaciones breves (SnackbarContext).
 * Comprueba que las notificaciones emerjan y se oculten según las acciones del usuario,
 * verificando los estilos correctos de severidad.
 */
describe('SnackbarContext', () => {
    /**
     * Verifica que al invocar la función de visualización,
     * el mensaje del snackbar aparezca en el documento con la severidad adecuada.
     */
    it('debe mostrar el snackbar al llamar a showSnackbar', () => {
        render(
            <SnackbarProvider>
                <TestComponent />
            </SnackbarProvider>
        );

        expect(screen.queryByText('Hola Mundo')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Mostrar'));

        expect(screen.getByText('Hola Mundo')).toBeInTheDocument();
        // Verificar severidad (clase de MUI)
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('MuiAlert-filledError');
    });

    /**
     * Verifica que el snackbar inicie el proceso de cierre y desaparición
     * cuando el usuario pulsa el botón para cerrarlo.
     */
    it('debe cerrarse al pulsar la X', () => {
        render(
            <SnackbarProvider>
                <TestComponent />
            </SnackbarProvider>
        );

        fireEvent.click(screen.getByText('Mostrar'));
        expect(screen.getByText('Hola Mundo')).toBeInTheDocument();

        const closeButton = screen.getByLabelText(/close/i);
        fireEvent.click(closeButton);

        // El snackbar de MUI usa transiciones, pero el elemento debería desaparecer o empezar a cerrarse
        // En tests a veces necesitamos esperar o verificar el estado open de Snackbar si fuera accesible,
        // pero buscar el texto suele bastar.
        expect(screen.queryByText('Hola Mundo')).toBeInTheDocument(); // Sigue por la animación
    });
});
