import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageLoader from './PageLoader';

/**
 * Suite de pruebas unitarias para el componente de carga (PageLoader).
 * Verifica la correcta renderización del indicador de progreso circular
 * y la presentación de mensajes textuales personalizados.
 */
describe('PageLoader', () => {
    /**
     * Verifica que si no se provee un texto, el componente
     * muestre el mensaje de carga predeterminado del sistema.
     */
    it('debe renderizar el mensaje por defecto', () => {
        render(<PageLoader />);
        expect(screen.getByText('Cargando información...')).toBeInTheDocument();
    });

    /**
     * Verifica que el componente sea capaz de mostrar una cadena
     * de texto personalizada suministrada a través de sus propiedades.
     */
    it('debe renderizar un mensaje personalizado', () => {
        render(<PageLoader message="Sincronizando..." />);
        expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
    });

    /**
     * Verifica la presencia del indicador de progreso circular (CircularProgress)
     * mediante su rol implícito en el árbol de accesibilidad.
     */
    it('debe renderizar un CircularProgress', () => {
        render(<PageLoader />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
});
