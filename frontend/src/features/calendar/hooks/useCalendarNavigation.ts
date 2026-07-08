import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { parseApiDate } from '../../../shared/utils/dateUtils';
import type { CalendarEvent } from './useCalendarEvents';

/**
 * Interfaz que define las propiedades requeridas para el hook de navegación del calendario.
 */
interface UseCalendarNavigationProps {
    /** Lista de eventos actualmente filtrados y renderizados en el calendario. */
    filteredEvents: CalendarEvent[];
    /** Gestor de modales que controla la apertura y cierre de diálogos (creación, detalles, etc.). */
    modals: any;
    /** Función de actualización para establecer la fecha actual de enfoque en el calendario. */
    setCalendarDate: (date: Date) => void;
    /** Función de actualización para cambiar la vista actual del calendario (mes, semana, día, agenda). */
    setCurrentView: (view: string) => void;
}

/**
 * Hook personalizado para orquestar la sincronización bidireccional entre la URL (parámetros de consulta)
 * y el estado interno del calendario.
 * 
 * Permite interceptar enlaces directos (por ejemplo, desde notificaciones por correo) para abrir 
 * automáticamente los modales de detalles de una reserva específica o el formulario de creación,
 * ajustando simultáneamente la fecha y vista del calendario. Implementa salvaguardas para permitir 
 * múltiples navegaciones reactivas sin incurrir en bucles infinitos.
 *
 * @param props - Propiedades de configuración descritas en {@link UseCalendarNavigationProps}.
 */
export const useCalendarNavigation = ({
    filteredEvents,
    modals,
    setCalendarDate,
    setCurrentView
}: UseCalendarNavigationProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Usamos el ID de la URL como referencia para saber qué hemos procesado
    const lastProcessedIdRef = useRef<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const resIdParam = params.get('reservationId');
        const openForm = params.get('openForm') === 'true';
        
        // Si no hay parámetros relevantes, reseteamos la referencia y salimos
        if (!openForm && !resIdParam) {
            lastProcessedIdRef.current = null;
            return;
        }

        // Si ya hemos procesado este ID de reserva específico en este ciclo de vida, evitamos duplicidad
        const currentRef = openForm ? 'new' : resIdParam;
        if (lastProcessedIdRef.current === currentRef) return;

        // Escenario A: Abrir formulario de creación
        if (openForm) {
            lastProcessedIdRef.current = 'new';
            const qSpaceIds = params.get('spaceId');
            const qStart = params.get('start');
            const qEnd = params.get('end');

            if (qStart && qEnd) {
                const start = parseApiDate(qStart);
                const end = parseApiDate(qEnd);
                const spaceIds = qSpaceIds 
                    ? qSpaceIds.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id)) 
                    : [];
                
                modals.open('create', { start, end, spaceIds });
                setCalendarDate(start);
                setCurrentView('week');
                // Limpiamos URL pero mantenemos la referencia para no re-procesar
                navigate(location.pathname, { replace: true });
            }
        } 
        // Escenario B: Abrir detalles de una reserva específica
        else if (resIdParam) {
            const resId = parseInt(resIdParam);
            const event = filteredEvents.find(e => e.id === resId);
            const dateParam = params.get('date');
            
            lastProcessedIdRef.current = resIdParam;

            // Si el evento ya está cargado, movemos la vista
            if (event) {
                setCalendarDate(event.start);
                setCurrentView('week');
                modals.open('details', event.resource); // Abrimos con objeto si existe
            } else {
                // Si no está cargado (otra fecha o carga lenta), abrimos solo con ID
                // Y si nos pasan la fecha por URL, movemos el calendario a esa fecha
                if (dateParam) {
                    try {
                        const parsedDate = parseApiDate(dateParam);
                        setCalendarDate(parsedDate);
                        setCurrentView('week');
                    } catch (e) {
                        console.error('Error parsing date from URL', e);
                    }
                }
                modals.open('details', resId);
            }
            
            // Limpiamos URL
            navigate(location.pathname, { replace: true });
        }
    }, [location.search, filteredEvents, navigate, location.pathname, modals, setCalendarDate, setCurrentView]);
};
