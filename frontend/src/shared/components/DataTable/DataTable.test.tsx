import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from './DataTable';

/**
 * Suite de pruebas unitarias para el componente complejo de tabla de datos (DataTable).
 * Examina exhaustivamente el renderizado de conjuntos de datos, el enrutamiento de eventos
 * de ordenación, selección de filas, paginación y manejo de estados visuales.
 */
describe('DataTable', () => {
    const mockData = [
        { id: 1, name: 'Item 1', val: 10 },
        { id: 2, name: 'Item 2', val: 20 }
    ];

    const mockColumns = [
        { id: 'name', label: 'Nombre', sortable: true },
        { id: 'val', label: 'Valor' }
    ];

    /**
     * Verifica el renderizado integral mínimo, requiriendo que
     * se muestren tanto las cabeceras declaradas como las filas asociadas.
     */
    it('debe renderizar cabeceras y datos', () => {
        render(
            <DataTable 
                data={mockData} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                totalElements={2}
            />
        );

        expect(screen.getByText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    /**
     * Verifica que, ante la directiva de carga activada, el componente exponga
     * el esqueleto o indicador de progreso independientemente de si hay datos.
     */
    it('debe mostrar estado de carga', () => {
        render(
            <DataTable 
                data={[]} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                loading={true}
            />
        );

        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    /**
     * Verifica que, al recibir un error, el componente reemplace su contenido
     * o incorpore la alerta necesaria describiendo el fallo que detiene su uso.
     */
    it('debe mostrar mensaje de error', () => {
        render(
            <DataTable 
                data={[]} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                error="Ha ocurrido un fallo"
            />
        );

        expect(screen.getByText('Ha ocurrido un fallo')).toBeInTheDocument();
    });

    /**
     * Verifica que al interactuar con el título de una columna habilitada para ordenación,
     * se notifique al entorno despachando la acción onSort.
     */
    it('debe llamar a onSort al pulsar cabecera sortable', () => {
        const mockSort = vi.fn();
        render(
            <DataTable 
                data={mockData} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                onSort={mockSort}
            />
        );

        fireEvent.click(screen.getByText('Nombre'));
        expect(mockSort).toHaveBeenCalledWith('name');
    });

    /**
     * Verifica que al seleccionar de manera individual el elemento de control (checkbox)
     * de una fila específica, se emita correctamente el evento onSelectOne.
     */
    it('debe llamar a onSelectOne al pulsar el checkbox de una fila', () => {
        const mockSelect = vi.fn();
        render(
            <DataTable 
                data={mockData} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                selectedIds={[]}
                onSelectOne={mockSelect}
                // Añadimos onSelectAll para que la cabecera también tenga checkbox
                onSelectAll={vi.fn()}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        // El 0 es cabecera, 1 es fila 1 (Item 1), 2 es fila 2 (Item 2)
        fireEvent.click(checkboxes[1]); 
        
        expect(mockSelect).toHaveBeenCalledWith(1);
    });

    /**
     * Verifica que al hacer uso de los controles del paginador,
     * se delegue la actualización de la página mediante el evento onPageChange.
     */
    it('debe llamar a onPageChange al pulsar flechas de paginación', () => {
        const mockPageChange = vi.fn();
        render(
            <DataTable 
                data={mockData} 
                columns={mockColumns as any} 
                uniqueKey="id" 
                page={0}
                rowsPerPage={1}
                totalElements={10}
                onPageChange={mockPageChange}
            />
        );

        const nextButton = screen.getByLabelText(/siguiente página/i);
        fireEvent.click(nextButton);
        
        expect(mockPageChange).toHaveBeenCalledWith(1);
    });
});
