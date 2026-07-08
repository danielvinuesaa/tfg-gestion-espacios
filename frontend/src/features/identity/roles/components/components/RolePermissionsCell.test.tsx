import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RolePermissionsCell from './RolePermissionsCell';

/**
 * Suite de pruebas unitarias para la celda de la tabla que visualiza permisos.
 * Verifica que los chips se limiten a una cantidad visible y se maneje
 * apropiadamente el estado deshabilitado para roles eliminados.
 */
describe('RolePermissionsCell', () => {
    const permissions = [
        { name: 'P1', label: 'Perm 1' },
        { name: 'P2', label: 'Perm 2' },
        { name: 'P3', label: 'Perm 3' }
    ];

    /**
     * Verifica que únicamente se muestren los chips permitidos por límite,
     * agrupando los sobrantes en un contador (ej: "+1").
     */
    it('debe mostrar los dos primeros permisos y el contador de extras', () => {
        render(<RolePermissionsCell permissions={permissions as any} isDeleted={false} />);
        
        expect(screen.getByText('Perm 1')).toBeInTheDocument();
        expect(screen.getByText('Perm 2')).toBeInTheDocument();
        expect(screen.getByText('+1')).toBeInTheDocument();
        expect(screen.queryByText('Perm 3')).not.toBeInTheDocument();
    });

    /**
     * Verifica que la interfaz de la celda de permisos aplique estilos
     * de deshabilitado si el rol asociado ha sido marcado como borrado.
     */
    it('debe deshabilitar los chips si el rol está eliminado', () => {
        render(<RolePermissionsCell permissions={permissions.slice(0, 1) as any} isDeleted={true} />);
        
        const chip = screen.getByText('Perm 1').closest('.MuiChip-root');
        expect(chip).toHaveClass('Mui-disabled');
    });
});
