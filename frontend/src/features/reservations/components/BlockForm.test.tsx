import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/test-utils';
import BlockForm from './BlockForm';
import { useBlockForm } from '../hooks/useBlockForm';

vi.mock('../hooks/useBlockForm', () => ({
    useBlockForm: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el formulario de bloqueo de espacios.
 * Verifica la correcta visualización del formulario y su integración con
 * el hook useBlockForm para gestionar la creación de bloqueos.
 */
describe('BlockForm', () => {
    const mockOnSuccess = vi.fn();
    const mockHandleClose = vi.fn();
    const mockSubmitBlock = vi.fn().mockResolvedValue({}); // Debe devolver promesa para .catch() en FormDialogWrapper

    const mockSpace = { id: 1, name: 'Aula 101', type: 'AULA', totalCapacity: 50 };

    beforeEach(() => {
        vi.clearAllMocks();
        (useBlockForm as any).mockReturnValue({
            formData: { startTime: new Date(), endTime: new Date(), description: '' },
            setFormData: vi.fn(),
            loading: false,
            error: null,
            isDirty: false,
            submitBlock: mockSubmitBlock,
            conflictEngine: { conflicts: [], isChecking: false },
            getFieldError: vi.fn().mockReturnValue(null)
        });
    });

    /**
     * Verifica que el formulario presente el título correspondiente y
     * muestre el nombre del espacio que se va a bloquear.
     */
    it('debe renderizar el espacio afectado y el título', () => {
        render(
            <BlockForm 
                open={true} 
                handleClose={mockHandleClose} 
                onSuccess={mockOnSuccess} 
                space={mockSpace as any} 
            />
        );

        expect(screen.getByText(/bloquear espacio temporalmente/i)).toBeInTheDocument();
        expect(screen.getByText('Aula 101')).toBeInTheDocument();
    });

    /**
     * Verifica que, al haber modificado el formulario (estado sucio),
     * pulsar el botón de confirmar desencadene el envío del bloqueo.
     */
    it('debe llamar a submitBlock al pulsar confirmar si está sucio', async () => {
        (useBlockForm as any).mockReturnValue({
            formData: { startTime: new Date(), endTime: new Date(), description: 'Mantenimiento' },
            setFormData: vi.fn(),
            loading: false,
            error: null,
            isDirty: true,
            submitBlock: mockSubmitBlock,
            conflictEngine: { conflicts: [], isChecking: false },
            getFieldError: vi.fn().mockReturnValue(null)
        });

        render(
            <BlockForm 
                open={true} 
                handleClose={mockHandleClose} 
                onSuccess={mockOnSuccess} 
                space={mockSpace as any} 
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /confirmar bloqueo/i }));
        expect(mockSubmitBlock).toHaveBeenCalled();
    });
});
