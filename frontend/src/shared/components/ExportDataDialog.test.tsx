import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportDataDialog from './ExportDataDialog';

/**
 * Suite de pruebas unitarias para el diálogo de exportación de datos (ExportDataDialog).
 * Evalúa las funciones de selección masiva de columnas, validaciones
 * y despachos de eventos requeridos para generar archivos de exportación.
 */
describe('ExportDataDialog', () => {
    const mockOnExport = vi.fn();
    const mockOnClose = vi.fn();
    const columns = [
        { id: 'name', label: 'Nombre' },
        { id: 'type', label: 'Tipo' },
        { id: 'capacity', label: 'Capacidad' }
    ];

    /**
     * Verifica la inicialización básica del modal con su título principal
     * y las etiquetas correspondientes a las columnas a exportar.
     */
    it('debe renderizar las columnas y el título', () => {
        render(
            <ExportDataDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport}
                title="Exportar Espacios"
                columns={columns}
            />
        );

        expect(screen.getByText('Exportar Espacios')).toBeInTheDocument();
        expect(screen.getByText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Tipo')).toBeInTheDocument();
        expect(screen.getByText('Capacidad')).toBeInTheDocument();
    });

    /**
     * Verifica que existan controles para marcar o desmarcar conjuntamente
     * la totalidad de los campos disponibles, facilitando selecciones masivas.
     */
    it('debe permitir seleccionar/desmarcar todo', () => {
        render(
            <ExportDataDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport}
                title="Título"
                columns={columns}
            />
        );

        const desmarcarBtn = screen.getByText(/desmarcar todo/i);
        fireEvent.click(desmarcarBtn);

        const checkboxes = screen.getAllByRole('checkbox');
        checkboxes.forEach(cb => expect(cb).not.toBeChecked());

        const seleccionarBtn = screen.getByText(/seleccionar todo/i);
        fireEvent.click(seleccionarBtn);
        checkboxes.forEach(cb => expect(cb).toBeChecked());
    });

    /**
     * Verifica que al invocar la acción principal de exportación,
     * se notifique al entorno superior con la lista exacta de campos elegidos.
     */
    it('debe llamar a onExport con las columnas seleccionadas', () => {
        render(
            <ExportDataDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport}
                title="Título"
                columns={columns}
                defaultSelected={['name']}
            />
        );

        fireEvent.click(screen.getByText(/generar csv/i));
        
        expect(mockOnExport).toHaveBeenCalledWith(['name']);
        expect(mockOnClose).toHaveBeenCalled();
    });

    /**
     * Verifica la restricción funcional por la cual el botón de generar archivo
     * queda inhabilitado si el usuario desmarca la totalidad de los campos.
     */
    it('debe deshabilitar el botón si no hay nada seleccionado', () => {
        render(
            <ExportDataDialog 
                open={true} 
                onClose={mockOnClose} 
                onExport={mockOnExport}
                title="Título"
                columns={columns}
                defaultSelected={[]}
            />
        );

        expect(screen.getByRole('button', { name: /generar csv/i })).toBeDisabled();
    });
});
