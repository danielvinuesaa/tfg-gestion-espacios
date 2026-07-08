import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../../../test/test-utils';
import DateRangeFilters from './DateRangeFilters';
import SpaceFilter from './SpaceFilter';
import SubjectFilter from './SubjectFilter';
import UserFilter from './UserFilter';
import StatusTypeFilters from './StatusTypeFilters';

/**
 * Suite de pruebas unitarias para los sub-filtros de reservas.
 * Verifica el correcto renderizado y comportamiento de los filtros
 * de fechas, espacios, asignaturas, usuarios y estados.
 */
describe('Reservation Sub-Filters', () => {
    /**
     * Pruebas para el componente de filtro de rangos de fecha.
     */
    describe('DateRangeFilters', () => {
        /**
         * Verifica que se rendericen los selectores de fecha de inicio y fin.
         */
        it('debe renderizar los pickers de fecha', () => {
            render(
                <DateRangeFilters 
                    startDate={null} endDate={null} onChange={vi.fn()} 
                    minuteStep={15} startHour={8} endHour={20} isError={false} 
                />
            );
            expect(screen.getAllByText(/desde/i).length).toBeGreaterThan(0);
            expect(screen.getAllByText(/hasta/i).length).toBeGreaterThan(0);
        });
    });

    /**
     * Pruebas para el componente de filtro de espacios.
     */
    describe('SpaceFilter', () => {
        /**
         * Verifica que el selector de espacios se renderice y permita
         * seleccionar una opción, llamando al callback onChange.
         */
        it('debe renderizar el selector de espacios y llamar a onChange', async () => {
            const spaces = [{ id: 1, name: 'Aula 101', type: 'AULA' }];
            const mockChange = vi.fn();
            render(<SpaceFilter allSpaces={spaces as any} selectedSpaceIds={[]} onChange={mockChange} />);
            
            const autocomplete = screen.getByPlaceholderText(/añadir espacio/i);
            fireEvent.mouseDown(autocomplete);
            
            const option = await screen.findByText('Aula 101');
            fireEvent.click(option);

            expect(mockChange).toHaveBeenCalledWith(['1']);
        });
    });

    /**
     * Pruebas para el componente de filtro de asignaturas.
     */
    describe('SubjectFilter', () => {
        /**
         * Verifica que el selector de asignaturas actualice los filtros
         * seleccionados y llame a la función onChange.
         */
        it('debe llamar a onChange al seleccionar asignatura', async () => {
            const subjects = [{ id: 101, name: 'Redes', code: 'RED', course: '1' }];
            const mockChange = vi.fn();
            render(<SubjectFilter allSubjects={subjects as any} selectedSubjectIds={[]} onChange={mockChange} />);
            
            const autocomplete = screen.getByPlaceholderText(/añadir asignatura/i);
            fireEvent.mouseDown(autocomplete);
            
            const option = await screen.findByText(/Redes/i);
            fireEvent.click(option);
            
            expect(mockChange).toHaveBeenCalledWith(['101']);
        });
    });

    /**
     * Pruebas para el componente de filtro de usuarios.
     */
    describe('UserFilter', () => {
        /**
         * Verifica que el selector de usuarios notifique correctamente
         * al seleccionar un usuario del autocompletado.
         */
        it('debe llamar a onChange al seleccionar usuario', async () => {
            const users = [{ id: 2, name: 'Profesor', email: 'p@es.com' }];
            const mockChange = vi.fn();
            render(<UserFilter allUsers={users as any} selectedUserIds={[]} onChange={mockChange} />);
            
            const autocomplete = screen.getByPlaceholderText(/añadir usuario/i);
            fireEvent.mouseDown(autocomplete);
            
            const option = await screen.findByText(/Profesor/i);
            fireEvent.click(option);
            
            expect(mockChange).toHaveBeenCalledWith(['2']);
        });
    });

    /**
     * Pruebas para el componente de filtros de estado y tipo de reserva.
     */
    describe('StatusTypeFilters', () => {
        /**
         * Verifica que los selectores de estado y tipo emitan los eventos
         * de cambio correspondientes al seleccionar una nueva opción.
         */
        it('debe llamar a onChange al cambiar estado o tipo', async () => {
            const mockStatusChange = vi.fn();
            const mockTypeChange = vi.fn();
            render(
                <StatusTypeFilters 
                    status="" type="" 
                    onStatusChange={mockStatusChange} 
                    onTypeChange={mockTypeChange}
                    includeTerminalStates={true}
                />
            );
            
            // Usar getByLabelText con el ID asignado
            const statusSelect = screen.getByLabelText('Estado');
            fireEvent.mouseDown(statusSelect);
            const statusOption = await screen.findByText(/pendientes/i);
            fireEvent.click(statusOption);
            expect(mockStatusChange).toHaveBeenCalledWith('SOLICITADA');

            const typeSelect = screen.getByLabelText('Tipo');
            fireEvent.mouseDown(typeSelect);
            const typeOption = await screen.findByText(/docencia/i);
            fireEvent.click(typeOption);
            expect(mockTypeChange).toHaveBeenCalledWith('CLASE');
        });
    });
});
