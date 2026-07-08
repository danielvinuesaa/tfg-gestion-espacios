import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UserActions from './UserActions';

/**
 * Suite de pruebas unitarias para el componente UserActions.
 * Verifica la correcta visualización e interacción de los botones de acción
 * de usuario (editar, bloquear, eliminar, restaurar) según su estado y nivel de protección.
 */
describe('UserActions', () => {
    const mockUser = {
        id: 1,
        email: 'user@test.com',
        name: 'Test User',
        status: 'ACTIVO'
    };

    const mockHandleAction = vi.fn();

    /**
     * Verifica que se muestren correctamente los botones de editar,
     * bloquear y eliminar para una cuenta de usuario en estado activo.
     */
    it('debe mostrar botones de editar, bloquear y eliminar para usuario activo', () => {
        render(<UserActions user={mockUser as any} isProtected={false} handleAction={mockHandleAction} />);
        
        expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Bloquear Acceso' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
    });

    /**
     * Verifica que al interactuar con cualquiera de los botones de acción,
     * se invoque correctamente la función handleAction provista.
     */
    it('debe llamar a handleAction con la acción correcta', () => {
        render(<UserActions user={mockUser as any} isProtected={false} handleAction={mockHandleAction} />);
        
        const editBtn = screen.getByRole('button', { name: 'Editar' });
        fireEvent.click(editBtn);
        
        expect(mockHandleAction).toHaveBeenCalledWith('edit', mockUser);
    });

    /**
     * Verifica que si el usuario se encuentra en estado eliminado,
     * se visualice el botón para su restauración en lugar de las acciones habituales.
     */
    it('debe mostrar botón de restaurar para usuario eliminado', () => {
        const deletedUser = { ...mockUser, status: 'ELIMINADO' };
        render(<UserActions user={deletedUser as any} isProtected={false} handleAction={mockHandleAction} />);
        
        expect(screen.getByRole('button', { name: 'Restaurar Usuario' })).toBeInTheDocument();
    });

    /**
     * Verifica que los botones de acción de borrado o bloqueo se deshabiliten
     * cuando el usuario está marcado como protegido (por su rol u otras causas).
     */
    it('debe deshabilitar botones si el usuario es protegido', () => {
        render(<UserActions user={mockUser as any} isProtected={true} handleAction={mockHandleAction} />);
        
        expect(screen.getByRole('button', { name: 'Estado de cuenta protegido' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
    });

    /**
     * Verifica la lógica que protege la cuenta específica del administrador
     * principal del sistema impidiendo que sea alterada o eliminada.
     */
    it('debe proteger la cuenta admin principal', () => {
        const adminUser = { ...mockUser, email: 'admin@uniovi.es' };
        render(<UserActions user={adminUser as any} isProtected={false} handleAction={mockHandleAction} />);
        
        expect(screen.getByRole('button', { name: 'Cuenta de sistema protegida' })).toBeDisabled();
    });
});
