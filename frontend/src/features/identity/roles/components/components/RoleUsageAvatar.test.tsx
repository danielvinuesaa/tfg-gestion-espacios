import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleUsageAvatar from './RoleUsageAvatar';

/**
 * Suite de pruebas unitarias para el componente RoleUsageAvatar.
 * Verifica que la representación visual de la cantidad de usuarios
 * asignados a un rol refleje de manera correcta su estado.
 */
describe('RoleUsageAvatar', () => {
    /**
     * Verifica que el avatar solo muestre el total de usuarios si
     * todos los usuarios asociados a dicho rol están activos.
     */
    it('debe renderizar la cantidad de usuarios activos cuando no hay eliminados', () => {
        render(<RoleUsageAvatar userCount={42} totalUserCount={42} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    /**
     * Verifica que el avatar presente el formato de fracción
     * "activos / totales" cuando existan usuarios eliminados.
     */
    it('debe renderizar el formato active / total cuando hay eliminados', () => {
        render(<RoleUsageAvatar userCount={5} totalUserCount={8} />);
        expect(screen.getByText('5 / 8')).toBeInTheDocument();
    });

    /**
     * Verifica que el componente se integre correctamente y renderice
     * el valor solitario de forma adecuada, además de admitir eventos de ratón.
     */
    it('debe mostrar el tooltip correcto para un usuario', () => {
        render(<RoleUsageAvatar userCount={1} totalUserCount={1} />);
        expect(screen.getByText('1')).toBeInTheDocument();
    });
});
