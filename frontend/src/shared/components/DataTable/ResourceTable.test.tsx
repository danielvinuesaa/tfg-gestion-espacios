import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import { ResourceTable } from './ResourceTable';
import { useResource } from '../../hooks/useResource';

vi.mock('../../hooks/useResource', () => ({
    useResource: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el componente ResourceTable.
 * Verifica la renderización de datos de recursos, el manejo del estado de carga,
 * y la interacción con la ordenación de las cabeceras.
 */
describe('ResourceTable', () => {
    const mockColumns = [
        { id: 'name', label: 'Nombre', sortable: true },
        { id: 'type', label: 'Tipo' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useResource as any).mockReturnValue({
            data: [{ id: 1, name: 'Item 1', type: 'A' }, { id: 2, name: 'Item 2', type: 'B' }],
            loading: false,
            error: null,
            pagination: { page: 0, size: 10, totalElements: 2, sortBy: 'name', direction: 'asc' },
            setPage: vi.fn(),
            setSize: vi.fn(),
            setSort: vi.fn(),
            setFilters: vi.fn(),
            refresh: vi.fn()
        });
    });

    /**
     * Verifica que el componente renderiza correctamente los datos proporcionados
     * por el hook `useResource`.
     */
    it('debe renderizar los datos obtenidos del recurso', () => {
        render(
            <ResourceTable 
                resourceUrl="/api/test"
                columns={mockColumns as any}
                uniqueKey="id"
            />
        );

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    /**
     * Verifica que se muestra un indicador de carga cuando el estado `loading`
     * del hook `useResource` es verdadero.
     */
    it('debe mostrar estado de carga', () => {
        (useResource as any).mockReturnValue({
            data: [],
            loading: true,
            pagination: { page: 0, size: 10, totalElements: 0 },
            setPage: vi.fn()
        });

        render(
            <ResourceTable 
                resourceUrl="/api/test"
                columns={mockColumns as any}
                uniqueKey="id"
            />
        );

        expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    });

    /**
     * Verifica que al hacer clic en una cabecera ordenable, se llama a la
     * función `setSort` con el identificador de la columna correspondiente.
     */
    it('debe llamar a setSort al pulsar en la cabecera sortable', () => {
        const mockSetSort = vi.fn();
        (useResource as any).mockReturnValue({
            data: [],
            loading: false,
            pagination: { page: 0, size: 10, totalElements: 0, sortBy: 'name', direction: 'asc' },
            setSort: mockSetSort
        });

        render(
            <ResourceTable 
                resourceUrl="/api/test"
                columns={mockColumns as any}
                uniqueKey="id"
            />
        );

        fireEvent.click(screen.getByText('Nombre'));
        expect(mockSetSort).toHaveBeenCalledWith('name');
    });
});
