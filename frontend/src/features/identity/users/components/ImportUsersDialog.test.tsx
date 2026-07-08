import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import ImportUsersDialog from './ImportUsersDialog';
import { server } from '../../../../test/mocks/server';
import { http, HttpResponse } from 'msw';

/**
 * Suite de pruebas unitarias para el componente ImportUsersDialog.
 * Verifica la correcta visualización de las instrucciones, la validación
 * del archivo subido, el tratamiento de conflictos y el proceso final de importación.
 */
describe('ImportUsersDialog', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'mock-token');
    });

    /**
     * Verifica que el diálogo se renderice mostrando su título principal
     * y las instrucciones que incluyen los roles válidos devueltos por la API.
     */
    it('debe renderizar el título e instrucciones', async () => {
        server.use(
            http.get('/api/roles', () => {
                return HttpResponse.json([{ id: 1, name: 'ADMIN' }, { id: 2, name: 'PROFESOR' }]);
            })
        );

        render(<ImportUsersDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        
        expect(await screen.findByText('Importar Usuarios')).toBeInTheDocument();
        expect(screen.getByText(/roles válidos: ADMIN, PROFESOR/i)).toBeInTheDocument();
    });

    /**
     * Verifica que al subir y validar un archivo con usuarios que ya existen
     * en el sistema, se detecten y muestren correctamente los conflictos encontrados.
     */
    it('debe mostrar conflictos detectados tras validación', async () => {
        server.use(
            http.post('/api/users/import/validate', () => {
                return HttpResponse.json({
                    valid: true,
                    newCount: 5,
                    conflicts: [
                        {
                            email: 'existente@uniovi.es',
                            name: 'Nombre Nuevo',
                            role: 'PROFESOR',
                            currentName: 'Nombre Viejo',
                            currentRole: 'ADMIN'
                        }
                    ]
                });
            })
        );

        render(<ImportUsersDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);

        const file = new File(['...'], 'usuarios.csv', { type: 'text/csv' });
        const input = screen.getByLabelText(/seleccionar archivo csv/i);
        fireEvent.change(input, { target: { files: [file] } });

        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        expect(await screen.findByText(/se ha detectado 1 usuario que ya existe/i)).toBeInTheDocument();
        expect(screen.getByText('existente@uniovi.es')).toBeInTheDocument();
        
        // Verificación de cambios (Nombre Viejo -> Nombre Nuevo)
        // Aparece en la identidad y en la columna de cambios
        expect(screen.getAllByText(/Nombre Nuevo/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Nombre Viejo/i)).toBeInTheDocument();
    });

    /**
     * Verifica el flujo completo y exitoso de importación sin conflictos,
     * culminando con la llamada a la función onSuccess al terminar.
     */
    it('debe completar la importación exitosamente', async () => {
        server.use(
            http.post('/api/users/import/validate', () => {
                return HttpResponse.json({ valid: true, newCount: 5, conflicts: [] });
            }),
            http.post('/api/users/import', () => {
                return HttpResponse.json({ successCount: 5, failureCount: 0 });
            })
        );

        render(<ImportUsersDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);

        const file = new File(['...'], 'usuarios.csv', { type: 'text/csv' });
        fireEvent.change(screen.getByLabelText(/seleccionar archivo csv/i), { target: { files: [file] } });
        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        const importButton = await screen.findByRole('button', { name: /importar solo nuevos/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });

    /**
     * Verifica que el botón para forzar la actualización de usuarios existentes
     * permanezca deshabilitado en caso de que la validación no encuentre conflictos.
     */
    it('debe deshabilitar el botón de actualizar si no hay conflictos', async () => {
        server.use(
            http.post('/api/users/import/validate', () => {
                return HttpResponse.json({ valid: true, newCount: 5, conflicts: [] });
            })
        );

        render(<ImportUsersDialog open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);

        const file = new File(['...'], 'usuarios.csv', { type: 'text/csv' });
        fireEvent.change(screen.getByLabelText(/seleccionar archivo csv/i), { target: { files: [file] } });
        fireEvent.click(screen.getByRole('button', { name: /validar archivo/i }));

        const updateButton = await screen.findByRole('button', { name: /importar y actualizar/i });
        expect(updateButton).toBeDisabled();
    });
});
