import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';

/**
 * Suite de pruebas unitarias para el componente de etiqueta de estado (StatusChip).
 * Verifica la correcta asignación de textos predeterminados, textos personalizados
 * y la normalización de capitalización.
 */
describe('StatusChip', () => {
    /**
     * Verifica que si no se proporciona una etiqueta personalizada,
     * se asigne automáticamente una etiqueta basada en el propio código de estado.
     */
    it('debe renderizar la etiqueta por defecto basada en el estado', () => {
        render(<StatusChip status="ACTIVO" />);
        expect(screen.getByText('Activo')).toBeInTheDocument();
    });

    /**
     * Verifica que el componente respete y muestre un texto personalizado
     * que sobrescriba el comportamiento por defecto cuando este es suministrado.
     */
    it('debe renderizar una etiqueta personalizada si se proporciona', () => {
        render(<StatusChip status="BLOQUEADO" label="Fuera de Servicio" />);
        expect(screen.getByText('Fuera de Servicio')).toBeInTheDocument();
    });

    /**
     * Verifica que el componente reciba de forma tolerante los códigos de estado,
     * normalizando entradas en minúsculas para visualizarlas con el formato adecuado.
     */
    it('debe manejar estados en minúsculas', () => {
        render(<StatusChip status="eliminado" />);
        expect(screen.getByText('Eliminado')).toBeInTheDocument();
    });
});
