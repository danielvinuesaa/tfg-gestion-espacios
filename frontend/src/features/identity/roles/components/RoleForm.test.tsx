import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../../test/test-utils';
import RoleForm from './RoleForm';
import { useRoleForm } from '../hooks/useRoleForm';
import { useApi } from '../../../../shared/utils/api';

vi.mock('../hooks/useRoleForm', () => ({
    useRoleForm: vi.fn()
}));

vi.mock('../../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el componente de formulario de roles.
 * Valida la correcta presentación de los permisos agrupados y la interacción
 * con las acciones de marcado o desmarcado de elementos.
 */
describe('RoleForm', () => {
    const mockHandleClose = vi.fn();
    const mockOnSuccess = vi.fn();
    const mockTogglePermission = vi.fn();
    const mockToggleCategory = vi.fn();
    const mockRequest = vi.fn();

    const mockUseRoleForm = {
        formData: { name: '', description: '', permissions: [], subjectIds: [] },
        loading: false,
        error: null,
        isDirty: false,
        handleChange: vi.fn(),
        handleBlur: vi.fn(),
        saveRole: vi.fn(),
        getFieldError: () => "",
        touched: {},
        setFieldValue: vi.fn(),
        allSubjects: [],
        info: null,
        togglePermission: mockTogglePermission,
        toggleCategory: mockToggleCategory
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRoleForm as any).mockReturnValue(mockUseRoleForm);
        (useApi as any).mockReturnValue({ request: mockRequest });

        mockRequest.mockResolvedValue([
            { name: 'LEER_ESPACIOS', label: 'Ver Espacios', description: 'Desc 1' },
            { name: 'CREAR_ESPACIOS', label: 'Crear Espacios', description: 'Desc 2' }
        ]);
    });

    /**
     * Verifica que el formulario presente el título correcto y
     * cargue asíncronamente las opciones de permisos para mostrarlas.
     */
    it('debe renderizar el título y cargar permisos', async () => {
        render(<RoleForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByText('Nuevo Rol de Usuario')).toBeInTheDocument();
        expect(await screen.findByText('Ver Espacios')).toBeInTheDocument();
    });

    /**
     * Verifica que la selección o deselección de un permiso en
     * concreto llame al método correspondiente para actualizar el estado.
     */
    it('debe llamar a togglePermission al pulsar un checkbox de permiso', async () => {
        render(<RoleForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        const checkbox = await screen.findByLabelText('Ver Espacios');
        fireEvent.click(checkbox);
        expect(mockTogglePermission).toHaveBeenCalledWith('LEER_ESPACIOS', true);
    });

    /**
     * Verifica que el botón de selección grupal dispare la acción
     * que asigna todos los permisos de la categoría a la vez.
     */
    it('debe llamar a toggleCategory al pulsar MARCAR TODO', async () => {
        render(<RoleForm open={true} handleClose={mockHandleClose} onSuccess={mockOnSuccess} />);
        const markAllButtons = await screen.findAllByText(/marcar todo/i);
        fireEvent.click(markAllButtons[0]);
        expect(mockToggleCategory).toHaveBeenCalled();
    });
});
