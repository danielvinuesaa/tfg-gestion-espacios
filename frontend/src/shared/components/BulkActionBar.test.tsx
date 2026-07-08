import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BulkActionBar from './BulkActionBar';

/**
 * Suite de pruebas unitarias para el componente de acciones en bloque (BulkActionBar).
 * Evalúa las representaciones visuales del conteo y la invocación de
 * las acciones colectivas y limpiezas de selecciones sobre las entidades.
 */
describe('BulkActionBar', () => {
    const mockClear = vi.fn();
    const mockDelete = vi.fn();

    /**
     * Verifica que el texto que indica la cantidad de elementos seleccionados
     * respete la concordancia nominal para entidades masculinas.
     */
    it('debe renderizar la cantidad seleccionada en masculino', () => {
        render(
            <BulkActionBar 
                selectedCount={5}
                resourceNamePlural="usuarios"
                resourceNameSingular="usuario"
                onClearSelection={mockClear}
                onDelete={mockDelete}
            />
        );

        expect(screen.getByText(/5 usuarios seleccionados/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el texto que indica la cantidad de elementos seleccionados
     * respete la concordancia nominal para entidades de género femenino.
     */
    it('debe renderizar la cantidad seleccionada en femenino', () => {
        render(
            <BulkActionBar 
                selectedCount={1}
                resourceNamePlural="reservas"
                resourceNameSingular="reserva"
                isFeminine={true}
                onClearSelection={mockClear}
                onDelete={mockDelete}
            />
        );

        expect(screen.getByText(/1 reserva seleccionada/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el panel para seleccionar todos los resultados en el servidor
     * se muestre correctamente si la página de resultados está llena.
     */
    it('debe mostrar banner global si se cumplen las condiciones', () => {
        render(
            <BulkActionBar 
                selectedCount={10}
                resourceNamePlural="espacios"
                resourceNameSingular="espacio"
                isPageFull={true}
                totalElements={100}
                onSelectAllGlobal={vi.fn()}
                onClearSelection={mockClear}
                onDelete={mockDelete}
            />
        );

        expect(screen.getByText(/seleccionar los 100 espacios/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al hacer clic en el botón de borrar lotes, el componente
     * notifique de manera ascendente mediante el evento onDelete.
     */
    it('debe llamar a onDelete al pulsar eliminar', () => {
        render(
            <BulkActionBar 
                selectedCount={2}
                resourceNamePlural="items"
                resourceNameSingular="item"
                onClearSelection={mockClear}
                onDelete={mockDelete}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /eliminar lote/i }));
        expect(mockDelete).toHaveBeenCalled();
    });
});
