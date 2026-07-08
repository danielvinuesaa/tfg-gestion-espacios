import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RoleReassignmentSelector from './RoleReassignmentSelector';

/**
 * Suite de pruebas unitarias para el componente de reasignación de roles.
 * Comprueba el filtrado y presentación de roles elegibles en escenarios de
 * conflictos durante la eliminación o modificación de un rol.
 */
describe('RoleReassignmentSelector', () => {
    const mockRoles = [
        { id: 1, name: 'ADMIN', status: 'ACTIVO' },
        { id: 2, name: 'PROFESOR', status: 'ACTIVO' },
        { id: 3, name: 'ESTUDIANTE', status: 'ACTIVO' }
    ];

    const mockOnReassignChange = vi.fn();

    /**
     * Verifica que el selector despliegue una alerta informativa y
     * detalles de los elementos impactados si existen conflictos.
     */
    it('debe renderizar el mensaje de reasignación cuando hay conflictos', () => {
        const summary = {
            conflictCount: 1,
            totalImpactedItems: 5,
            itemsWithConflicts: []
        };

        render(
            <RoleReassignmentSelector 
                summary={summary as any}
                roles={mockRoles as any}
                selectedIds={[3]} 
                reassignToId=""
                onReassignChange={mockOnReassignChange}
            />
        );

        expect(screen.getByText(/estás a punto de reasignar/i)).toBeInTheDocument();
        // Usar getAll porque el texto puede aparecer en etiquetas y alerts
        expect(screen.getAllByText(/5/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/usuarios/i).length).toBeGreaterThan(0);
    });

    /**
     * Verifica que el rol que está siendo eliminado (y cualquier otro
     * seleccionado previamente en una acción múltiple) no aparezca
     * en el selector de roles de destino.
     */
    it('debe filtrar los roles seleccionados para el destino', async () => {
        const summary = { conflictCount: 1, totalImpactedItems: 1 };

        render(
            <RoleReassignmentSelector 
                summary={summary as any}
                roles={mockRoles as any}
                selectedIds={[1]} 
                reassignToId=""
                onReassignChange={mockOnReassignChange}
            />
        );

        const select = screen.getByLabelText(/nuevo rol para el usuario/i);
        fireEvent.mouseDown(select);

        expect(await screen.findByText('PROFESOR')).toBeInTheDocument();
        expect(screen.getByText('ESTUDIANTE')).toBeInTheDocument();
        expect(screen.queryByText('ADMIN')).not.toBeInTheDocument();
    });

    /**
     * Verifica que la función onReassignChange se ejecute comunicando
     * el ID del nuevo rol elegido como reemplazo.
     */
    it('debe llamar a onReassignChange al seleccionar un rol', async () => {
        const summary = { conflictCount: 1, totalImpactedItems: 1 };

        render(
            <RoleReassignmentSelector 
                summary={summary as any}
                roles={mockRoles as any}
                selectedIds={[1]}
                reassignToId=""
                onReassignChange={mockOnReassignChange}
            />
        );

        const select = screen.getByLabelText(/nuevo rol para el usuario/i);
        fireEvent.mouseDown(select);

        const option = await screen.findByText('PROFESOR');
        fireEvent.click(option);

        expect(mockOnReassignChange).toHaveBeenCalledWith(2);
    });

    /**
     * Verifica que si no existen conflictos activos, el componente no
     * devuelva ningún elemento en el DOM (renderice null o fragmento vacío).
     */
    it('no debe renderizar nada si no hay conflictos', () => {
        const summary = { conflictCount: 0, totalImpactedItems: 0 };

        const { container } = render(
            <RoleReassignmentSelector 
                summary={summary as any}
                roles={mockRoles as any}
                selectedIds={[1]}
                reassignToId=""
                onReassignChange={mockOnReassignChange}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
