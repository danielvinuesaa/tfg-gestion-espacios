import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import ImportSpacesDialog from './ImportSpacesDialog';
import { server } from '../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * @file ImportSpacesDialog.test.tsx
 * @description Suite de pruebas para el diálogo de importación masiva de espacios vía archivo CSV.
 * Comprueba el proceso de carga de archivo, validación y gestión de conflictos con datos existentes.
 */
describe('ImportSpacesDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        localStorage.setItem('token', 'mock-token');
        vi.clearAllMocks();
    });

    /**
     * Verifica que se muestre el cuadro de diálogo y las instrucciones
     * referentes a los formatos y tipos de datos aceptados.
     */
    it('debe renderizar el título y las instrucciones', async () => {
        render(<ImportSpacesDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText('Importar Espacios')).toBeInTheDocument();
        expect(screen.getByText(/tipos válidos: AULA, LABORATORIO, DESPACHO/i)).toBeInTheDocument();
    });

    /**
     * Verifica que el usuario pueda seleccionar un archivo en su equipo,
     * enviarlo para su validación e inspeccionar los resultados simulados.
     */
    it('debe permitir seleccionar un archivo y validarlo', async () => {
        render(<ImportSpacesDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        // Simular selección de archivo
        const file = new File(['nombre;tipo;capacidad\nAula Test;AULA;50'], 'espacios.csv', { type: 'text/csv' });
        const input = screen.getByLabelText(/seleccionar archivo csv/i);
        
        fireEvent.change(input, { target: { files: [file] } });

        const validateButton = screen.getByRole('button', { name: /validar archivo/i });
        fireEvent.click(validateButton);

        // Esperar resultados de validación del mock
        // El texto "se han detectado 1 espacio" está fragmentado por el componente
        expect(await screen.findByText(/detectado 1 espacio/i)).toBeInTheDocument();
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
    });

    /**
     * Verifica que, tras una validación exitosa, se pueda completar
     * el proceso de importación y cerrar el informe resumido satisfactoriamente.
     */
    it('debe completar la importación tras la validación', async () => {
        render(<ImportSpacesDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        // 1. Validar
        const file = new File(['...'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(screen.getByLabelText(/seleccionar archivo csv/i), { target: { files: [file] } });
        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        // 2. Importar (botón aparece tras validar)
        const importButton = await screen.findByRole('button', { name: /importar y actualizar/i });
        fireEvent.click(importButton);

        // 3. Verificar que se llama a onSuccess
        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
        });

        // 4. Cerrar el resumen final
        const closeButton = screen.getByRole('button', { name: /cerrar/i });
        fireEvent.click(closeButton);

        expect(mockHandleClose).toHaveBeenCalled();
    });

    /**
     * Verifica que si el análisis del archivo revela que no hay conflictos
     * con los datos preexistentes, el botón "Importar y Actualizar" quede deshabilitado,
     * permitiendo solo importar los elementos que son completamente nuevos.
     */
    it('debe deshabilitar el botón de actualizar si no hay conflictos', async () => {
        server.use(
            http.post('/api/spaces/import/validate', () => {
                return HttpResponse.json({
                    valid: true,
                    newCount: 5,
                    conflicts: [] 
                });
            })
        );

        render(<ImportSpacesDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        const file = new File(['...'], 'test.csv', { type: 'text/csv' });
        fireEvent.change(screen.getByLabelText(/seleccionar archivo csv/i), { target: { files: [file] } });
        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        const updateButton = await screen.findByRole('button', { name: /importar y actualizar/i });
        expect(updateButton).toBeDisabled();
        
        const onlyNewButton = screen.getByRole('button', { name: /importar solo nuevos/i });
        expect(onlyNewButton).not.toBeDisabled();
    });
});
