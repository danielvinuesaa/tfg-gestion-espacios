import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalendarNavigation } from './useCalendarNavigation';
import { useLocation, useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(),
    useNavigate: vi.fn()
}));

/**
 * Suite de pruebas unitarias para el hook useCalendarNavigation.
 * Verifica la navegación basada en parámetros de URL, incluyendo la apertura
 * automática de modales (creación, detalles) y el ajuste de fechas/vistas.
 */
describe('useCalendarNavigation', () => {
    const mockNavigate = vi.fn();
    const mockSetDate = vi.fn();
    const mockSetView = vi.fn();
    const mockModals = { open: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        (useNavigate as any).mockReturnValue(mockNavigate);
    });

    /**
     * Verifica que si existe el parámetro 'reservationId' en la URL y el evento
     * correspondiente está cargado, se actualicen la fecha y vista, se abra el
     * modal de detalles y se limpie la URL.
     */
    it('debe abrir modal de detalles cuando reservationId está en la URL', () => {
        (useLocation as any).mockReturnValue({ search: '?reservationId=123', pathname: '/calendar' });
        
        const filteredEvents = [
            { id: 123, start: new Date(2026, 4, 25), resource: { id: 123, title: 'Test' } }
        ];

        renderHook(() => useCalendarNavigation({
            filteredEvents: filteredEvents as any,
            modals: mockModals,
            setCalendarDate: mockSetDate,
            setCurrentView: mockSetView
        }));

        expect(mockSetDate).toHaveBeenCalledWith(filteredEvents[0].start);
        expect(mockSetView).toHaveBeenCalledWith('week');
        expect(mockModals.open).toHaveBeenCalledWith('details', filteredEvents[0].resource);
        expect(mockNavigate).toHaveBeenCalledWith('/calendar', { replace: true });
    });

    /**
     * Verifica que si existe el parámetro 'openForm=true' en la URL, se abra el
     * modal de creación de reserva extrayendo los datos de inicio, fin y espacios,
     * ajustando la fecha y limpiando la URL.
     */
    it('debe abrir modal de creación cuando openForm=true está en la URL', () => {
        (useLocation as any).mockReturnValue({ 
            search: '?openForm=true&start=2026-05-25T10:00:00&end=2026-05-25T12:00:00&spaceId=1,2', 
            pathname: '/calendar' 
        });

        renderHook(() => useCalendarNavigation({
            filteredEvents: [],
            modals: mockModals,
            setCalendarDate: mockSetDate,
            setCurrentView: mockSetView
        }));

        expect(mockModals.open).toHaveBeenCalledWith('create', expect.objectContaining({
            spaceIds: [1, 2]
        }));
        expect(mockSetDate).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/calendar', { replace: true });
    });

    /**
     * Verifica que si se proporciona un 'reservationId' en la URL pero el evento
     * no se encuentra entre los eventos filtrados/cargados localmente, se proceda
     * a abrir el modal de detalles pasando únicamente el ID.
     */
    it('debe abrir detalles solo con ID si el evento no está cargado', () => {
        (useLocation as any).mockReturnValue({ search: '?reservationId=999', pathname: '/calendar' });

        renderHook(() => useCalendarNavigation({
            filteredEvents: [],
            modals: mockModals,
            setCalendarDate: mockSetDate,
            setCurrentView: mockSetView
        }));

        expect(mockModals.open).toHaveBeenCalledWith('details', 999);
        expect(mockNavigate).toHaveBeenCalled();
    });
});
