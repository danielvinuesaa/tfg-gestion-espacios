import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageHeader from './PageHeader';

/**
 * Suite de pruebas unitarias para la cabecera de página (PageHeader).
 * Asegura la correcta presentación de títulos, subtítulos y
 * la gestión del estado y visibilidad de sus botones de acción.
 */
describe('PageHeader', () => {
    /**
     * Verifica que el título y el subtítulo suministrados
     * se plasmen adecuadamente en el documento.
     */
    it('debe renderizar título y subtítulo', () => {
        render(<PageHeader title="Gestión de Espacios" subtitle="Listado de aulas y laboratorios" />);
        expect(screen.getByText('Gestión de Espacios')).toBeInTheDocument();
        expect(screen.getByText('Listado de aulas y laboratorios')).toBeInTheDocument();
    });

    /**
     * Verifica que los botones configurados se generen en la interfaz
     * y despachen correctamente las rutinas asociadas al recibir un evento de clic.
     */
    it('debe renderizar botones de acción y responder a clicks', () => {
        const mockClick = vi.fn();
        render(
            <PageHeader 
                title="Título" 
                actions={[
                    { label: 'Nuevo', onClick: mockClick, visible: true }
                ]} 
            />
        );

        const button = screen.getByText('Nuevo');
        expect(button).toBeInTheDocument();
        fireEvent.click(button);
        expect(mockClick).toHaveBeenCalled();
    });

    /**
     * Verifica que si una acción posee el flag de visibilidad en falso,
     * el botón correspondiente no sea inyectado en el DOM.
     */
    it('no debe renderizar acciones marcadas como ocultas', () => {
        render(
            <PageHeader 
                title="Título" 
                actions={[
                    { label: 'Oculto', onClick: vi.fn(), visible: false }
                ]} 
            />
        );

        expect(screen.queryByText('Oculto')).not.toBeInTheDocument();
    });

    /**
     * Verifica que los botones puedan mostrarse como inactivos
     * deshabilitando la interacción del usuario de forma nativa.
     */
    it('debe deshabilitar botones si se especifica', () => {
        render(
            <PageHeader 
                title="Título" 
                actions={[
                    { label: 'Deshabilitado', onClick: vi.fn(), disabled: true, visible: true }
                ]} 
            />
        );

        expect(screen.getByText('Deshabilitado')).toBeDisabled();
    });
});
