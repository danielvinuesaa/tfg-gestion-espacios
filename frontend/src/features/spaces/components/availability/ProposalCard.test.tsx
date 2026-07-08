import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProposalCard from './ProposalCard';

/**
 * @file ProposalCard.test.tsx
 * @description Suite de pruebas para la tarjeta que visualiza una propuesta de espacio.
 * Verifica la correcta visualización de datos, cálculo de eficiencia y acciones de selección.
 */
describe('ProposalCard', () => {
    const mockProposal = {
        spaces: [{ id: 1, name: 'Aula 101' }],
        totalCapacity: 60,
        effectiveCapacity: 60,
        recommendationReason: 'Perfecto para el aforo solicitado',
        suggestedStartTime: '2026-05-25T10:00:00',
        suggestedEndTime: '2026-05-25T12:00:00'
    };

    const mockFilters = {
        minCapacity: '50',
        distributionRatio: 1
    };

    const mockOnSelect = vi.fn();

    /**
     * Verifica que los detalles de la propuesta (nombres, razones de recomendación, etc.)
     * se rendericen de forma adecuada en la tarjeta.
     */
    it('debe renderizar los datos de la propuesta', () => {
        render(<ProposalCard proposal={mockProposal as any} index={0} filters={mockFilters} onSelect={mockOnSelect} />);
        
        // Aparece en el título H5 y en el Chip
        expect(screen.getAllByText('Aula 101').length).toBeGreaterThan(0);
        expect(screen.getByText(/perfecto para el aforo/i)).toBeInTheDocument();
        expect(screen.getByText(/RECOMENDADO/i)).toBeInTheDocument(); // index 0
    });

    /**
     * Verifica que el cálculo visual del porcentaje de eficiencia 
     * (capacidad ocupada sobre total) sea correcto.
     */
    it('debe calcular la eficiencia correctamente', () => {
        render(<ProposalCard proposal={mockProposal as any} index={1} filters={mockFilters} onSelect={mockOnSelect} />);
        
        // 50/60 = 83%
        expect(screen.getByText(/83%/i)).toBeInTheDocument();
        expect(screen.getByText(/10 libres/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al pulsar el botón de solicitar la propuesta,
     * el manejador sea invocado con la propuesta completa.
     */
    it('debe llamar a onSelect al pulsar el botón', () => {
        render(<ProposalCard proposal={mockProposal as any} index={1} filters={mockFilters} onSelect={mockOnSelect} />);
        
        fireEvent.click(screen.getByText(/solicitar esta opción/i));
        expect(mockOnSelect).toHaveBeenCalledWith(mockProposal);
    });
});
