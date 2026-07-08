import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterBar from './FilterBar';

/**
 * Suite de pruebas unitarias para la barra de filtrado (FilterBar).
 * Comprueba las interacciones del usuario sobre el buscador, transiciones
 * de estado y la propagación de eventos para la gestión de filtros activos.
 */
describe('FilterBar', () => {
    const mockSearchChange = vi.fn();

    /**
     * Verifica que el campo de texto reciba y refleje el valor
     * de búsqueda preexistente proveniente del estado global o local.
     */
    it('debe renderizar el campo de búsqueda con el valor inicial', () => {
        render(<FilterBar searchQuery="test" onSearchChange={mockSearchChange} />);
        
        const input = screen.getByPlaceholderText(/buscar/i) as HTMLInputElement;
        expect(input.value).toBe('test');
    });

    /**
     * Verifica que, ante los cambios tipográficos del usuario,
     * se envíe un evento notificando cada alteración de la cadena de búsqueda.
     */
    it('debe llamar a onSearchChange cuando el usuario escribe', () => {
        render(<FilterBar searchQuery="" onSearchChange={mockSearchChange} />);
        
        const input = screen.getByPlaceholderText(/buscar/i);
        fireEvent.change(input, { target: { value: 'nuevo' } });
        
        expect(mockSearchChange).toHaveBeenCalledWith('nuevo');
    });

    /**
     * Verifica la funcionalidad del icono auxiliar de borrado,
     * confirmando que emite un cambio para establecer el texto a vacío.
     */
    it('debe permitir limpiar la búsqueda pulsando el icono', () => {
        render(<FilterBar searchQuery="algo" onSearchChange={mockSearchChange} />);
        
        const clearButton = screen.getByLabelText(/limpiar búsqueda/i);
        fireEvent.click(clearButton);
        
        expect(mockSearchChange).toHaveBeenCalledWith('');
    });

    /**
     * Verifica la exposición condicional y la interactividad del
     * control que permite la visualización de entidades eliminadas lógicamente.
     */
    it('debe mostrar el switch de eliminados si se proporciona el callback', () => {
        const mockDeletedChange = vi.fn();
        render(
            <FilterBar 
                searchQuery="" 
                onSearchChange={mockSearchChange} 
                onShowDeletedChange={mockDeletedChange}
                showDeleted={false}
            />
        );
        
        const switchEl = screen.getByLabelText(/incluir eliminados/i);
        fireEvent.click(switchEl);
        
        expect(mockDeletedChange).toHaveBeenCalledWith(true);
    });

    /**
     * Verifica que el botón para restablecer los filtros avanzados esté visible
     * y sea funcional cuando existan criterios de filtrado adicionales activos.
     */
    it('debe mostrar el botón de limpiar filtros si hay filtros activos', () => {
        const mockClearFilters = vi.fn();
        render(
            <FilterBar 
                searchQuery="" 
                onSearchChange={mockSearchChange} 
                hasActiveFilters={true}
                onClearFilters={mockClearFilters}
            />
        );
        
        const clearBtn = screen.getByRole('button', { name: /limpiar/i });
        fireEvent.click(clearBtn);
        
        expect(mockClearFilters).toHaveBeenCalled();
    });

    /**
     * Verifica la capacidad del componente para alojar controles adicionales
     * insertados mediante props como children y extraContent.
     */
    it('debe renderizar children y extraContent', () => {
        render(
            <FilterBar searchQuery="" onSearchChange={mockSearchChange} extraContent={<div data-testid="extra">Extra</div>}>
                <div data-testid="child">Filtro Custom</div>
            </FilterBar>
        );
        
        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByTestId('extra')).toBeInTheDocument();
    });
});
