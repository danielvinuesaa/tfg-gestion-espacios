import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReservationSpacesCell from './ReservationSpacesCell';
import UserRoleChip from '../../../../identity/users/components/list/components/UserRoleChip';
import SpaceStatusChip from '../../../../spaces/components/list/components/SpaceStatusChip';

/**
 * Suite de pruebas para los componentes visuales de pequeño tamaño
 * utilizados dentro de las tablas y listas de información.
 */
describe('Small Display Components', () => {
    /**
     * Sub-suite para el componente `ReservationSpacesCell`.
     */
    describe('ReservationSpacesCell', () => {
        /**
         * Verifica que se renderice el listado de espacios (aulas)
         * mostrando su nombre correctamente en la celda.
         */
        it('debe mostrar los nombres de los espacios', () => {
            const spaces = [
                { id: 1, name: 'Aula 101', type: 'AULA' },
                { id: 2, name: 'Aula 102', type: 'AULA', status: 'ELIMINADO' }
            ];
            render(<ReservationSpacesCell spaces={spaces as any} />);
            expect(screen.getByText('Aula 101')).toBeInTheDocument();
            expect(screen.getByText('Aula 102 (Eliminado)')).toBeInTheDocument();
        });

        /**
         * Verifica que cuando una reserva tenga más de 2 espacios asignados,
         * se agrupen y se muestre un indicador adicional (ej: "+1").
         */
        it('debe mostrar el contador de extras si hay más de 2', () => {
            const spaces = [
                { id: 1, name: 'S1', type: 'AULA' }, 
                { id: 2, name: 'S2', type: 'AULA' }, 
                { id: 3, name: 'S3', type: 'AULA' }
            ];
            render(<ReservationSpacesCell spaces={spaces as any} />);
            expect(screen.getByText('+1')).toBeInTheDocument();
        });
    });

    /**
     * Sub-suite para el componente `UserRoleChip`.
     */
    describe('UserRoleChip', () => {
        /**
         * Verifica que el chip renderice el texto del rol proporcionado.
         */
        it('debe renderizar el nombre del rol', () => {
            render(<UserRoleChip roleName="ADMIN" />);
            expect(screen.getByText('ADMIN')).toBeInTheDocument();
        });

        /**
         * Verifica que los roles no reconocidos no rompan el componente
         * y se muestren utilizando el estilo por defecto.
         */
        it('debe renderizar un rol desconocido con estilo por defecto', () => {
            render(<UserRoleChip roleName="INVITADO" />);
            expect(screen.getByText('INVITADO')).toBeInTheDocument();
        });
    });

    /**
     * Sub-suite para el componente `SpaceStatusChip`.
     */
    describe('SpaceStatusChip', () => {
        /**
         * Verifica el renderizado correcto del estado físico estático de un espacio.
         */
        it('debe renderizar estado físico DISPONIBLE', () => {
            render(<SpaceStatusChip status="DISPONIBLE" type="physical" />);
            expect(screen.getByText('Disponible')).toBeInTheDocument();
        });

        /**
         * Verifica el renderizado correcto del estado dinámico de ocupación
         * de un espacio en un momento dado.
         */
        it('debe renderizar estado dinámico LIBRE', () => {
            render(<SpaceStatusChip status="LIBRE" type="dynamic" />);
            expect(screen.getByText('Libre')).toBeInTheDocument();
        });

        /**
         * Verifica que el valor 'BLOQUEO' se mapee correctamente a la palabra
         * 'Bloqueado' para mantener la consistencia con el componente base StatusChip.
         */
        it('debe mapear BLOQUEO a BLOQUEADO usando StatusChip', () => {
            render(<SpaceStatusChip status="BLOQUEO" type="physical" />);
            expect(screen.getByText('Bloqueado')).toBeInTheDocument();
        });
    });
});
