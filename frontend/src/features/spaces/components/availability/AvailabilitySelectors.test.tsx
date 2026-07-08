import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailySelector from './DailySelector';
import TimeSlotSelector from './TimeSlotSelector';

/**
 * @file AvailabilitySelectors.test.tsx
 * @description Suite de pruebas para los selectores de disponibilidad (días y franjas horarias).
 * Comprueba que la interacción de usuario con los resultados devuelva la selección correcta.
 */
describe('Availability Selectors', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('DailySelector', () => {
        const mockResults = [
            { date: '2026-05-25', totalCount: 5, timeSlots: [] },
            { date: '2026-05-26', totalCount: 0, timeSlots: [] }
        ];
        const mockOnSelect = vi.fn();

        /**
         * Verifica que el selector de días renderice los resultados recibidos
         * y marque el día actualmente seleccionado.
         */
        it('debe renderizar los días y resaltar el seleccionado', () => {
            render(<DailySelector dailyResults={mockResults} selectedDate="2026-05-25" onSelectDate={mockOnSelect} />);
            
            expect(screen.getByText('25')).toBeInTheDocument();
            expect(screen.getByText('26')).toBeInTheDocument();
        });

        /**
         * Verifica que al pulsar un día válido, se notifique el cambio al estado del padre.
         */
        it('debe llamar a onSelectDate al pulsar un día con resultados', () => {
            render(<DailySelector dailyResults={mockResults} selectedDate={null} onSelectDate={mockOnSelect} />);
            
            fireEvent.click(screen.getByText('25'));
            expect(mockOnSelect).toHaveBeenCalledWith('2026-05-25');
        });

        /**
         * Verifica que los días sin disponibilidad no disparen eventos de selección.
         */
        it('no debe llamar a onSelectDate si el día no tiene resultados', () => {
            render(<DailySelector dailyResults={mockResults} selectedDate={null} onSelectDate={mockOnSelect} />);
            
            fireEvent.click(screen.getByText('26'));
            expect(mockOnSelect).not.toHaveBeenCalled();
        });
    });

    describe('TimeSlotSelector', () => {
        const mockSlots = [
            { label: '09:00 - 10:00', count: 2, startTime: '', endTime: '', proposals: [] },
            { label: '10:00 - 11:00', count: 1, startTime: '', endTime: '', proposals: [] }
        ];
        const mockOnSelect = vi.fn();

        /**
         * Verifica que se listen correctamente los diferentes intervalos
         * de tiempo (slots) recibidos desde la API.
         */
        it('debe renderizar los slots de tiempo', () => {
            render(<TimeSlotSelector timeSlots={mockSlots} selectedSlotIdx={0} onSelectSlot={mockOnSelect} />);
            
            expect(screen.getByText('09:00 - 10:00')).toBeInTheDocument();
            expect(screen.getByText('10:00 - 11:00')).toBeInTheDocument();
        });

        /**
         * Verifica que al pulsar en una de las franjas horarias,
         * se invoque la selección correspondiente con el índice correcto.
         */
        it('debe llamar a onSelectSlot al pulsar un slot', () => {
            render(<TimeSlotSelector timeSlots={mockSlots} selectedSlotIdx={null} onSelectSlot={mockOnSelect} />);
            
            fireEvent.click(screen.getByText('10:00 - 11:00'));
            expect(mockOnSelect).toHaveBeenCalledWith(1);
        });
    });
});
