import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useConflictChecker } from './useConflictChecker';
import { useApi } from '../../../shared/utils/api';

vi.mock('../../../shared/utils/api', () => ({
    useApi: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el hook useConflictChecker.
 * Verifica la correcta evaluación de conflictos de horario utilizando
 * llamadas API con una técnica de rebote (debounce).
 */
describe('useConflictChecker', () => {
    const mockRequest = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useApi as any).mockReturnValue({ request: mockRequest });
    });

    /**
     * Verifica que el estado inicial no refleje conflictos ni
     * procesos de comprobación activos.
     */
    it('debe inicializar con valores por defecto', () => {
        const { result } = renderHook(() => useConflictChecker());
        expect(result.current.conflicts).toEqual([]);
        expect(result.current.isChecking).toBe(false);
        expect(result.current.hasConflicts).toBe(false);
    });

    /**
     * Verifica que, al comprobar conflictos con datos válidos, el hook
     * aguarde el tiempo de debounce antes de hacer la solicitud API.
     */
    it('debe llamar a la API tras el debounce al comprobar conflictos', async () => {
        mockRequest.mockResolvedValue([{ spaceId: 1, spaceName: 'Aula 101' }]);
        const { result } = renderHook(() => useConflictChecker());

        const start = new Date(2026, 5, 25, 10);
        const end = new Date(2026, 5, 25, 11);

        act(() => {
            result.current.checkConflicts([1], start, end);
        });

        // Esperar más de los 500ms del debounce
        await waitFor(() => {
            expect(mockRequest).toHaveBeenCalled();
            expect(result.current.hasConflicts).toBe(true);
        }, { timeout: 2000 });
    });

    /**
     * Verifica que, al suministrar parámetros incompletos (ej. sin fechas o espacios),
     * los conflictos se limpien de forma inmediata y no se realice la petición.
     */
    it('debe limpiar conflictos si faltan parámetros', async () => {
        const { result } = renderHook(() => useConflictChecker());

        act(() => {
            result.current.checkConflicts([], null, null);
        });

        expect(mockRequest).not.toHaveBeenCalled();
        expect(result.current.conflicts).toEqual([]);
    });
});
