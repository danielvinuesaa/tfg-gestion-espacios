import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from './EmptyState';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

/**
 * Suite de pruebas unitarias para el componente de estado vacío (EmptyState).
 * Verifica la visualización de mensajes cuando no hay datos disponibles y
 * la personalización flexible de títulos, descripciones e iconos.
 */
describe('EmptyState', () => {
    /**
     * Verifica que al no proveer propiedades de personalización,
     * se apliquen textos neutros generales por defecto.
     */
    it('debe renderizar el título por defecto', () => {
        render(<EmptyState />);
        expect(screen.getByText('No se han encontrado registros')).toBeInTheDocument();
    });

    /**
     * Verifica que los valores ingresados tanto en título como en descripción
     * sobrescriban a los valores predeterminados exitosamente en la interfaz.
     */
    it('debe renderizar título y descripción personalizados', () => {
        render(<EmptyState title="Vacío" description="Intenta buscar otra cosa" />);
        expect(screen.getByText('Vacío')).toBeInTheDocument();
        expect(screen.getByText('Intenta buscar otra cosa')).toBeInTheDocument();
    });

    /**
     * Verifica la capacidad del componente para alojar e insertar
     * elementos iconográficos personalizados en su jerarquía visual.
     */
    it('debe renderizar el icono si se proporciona', () => {
        const { container } = render(<EmptyState icon={<AccountCircleIcon data-testid="icon" />} />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
});
