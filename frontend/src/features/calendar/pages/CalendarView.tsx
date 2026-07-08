import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { 
    format, 
    parse, 
    startOfWeek, 
    getDay, 
    isSameMonth, 
    isSameWeek, 
    startOfMonth 
} from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

// Utils & Helpers
import { isFuture as isFutureUtil, isToday as isTodayUtil, getSmartDefaultTime } from '../../../shared/utils/dateUtils';
import { getSpaceColors } from '../../../theme/reservationTheme';
import { calendarGlobalStyles } from '../styles/Calendar.styles';

// Contexts & Hooks
import { useAuth } from '../../../context/AuthContext';
import { useSnackbar } from '../../../context/SnackbarContext';
import { useSettings } from '../../../context/SettingsContext';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import type { CalendarEvent } from '../hooks/useCalendarEvents';
import { useModalStack } from '../../../shared/hooks/useModalStack';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';

// Module Components
import CalendarHeader from '../components/CalendarHeader';
import CalendarSidebar from '../components/CalendarSidebar';
import EventTooltip from '../components/EventTooltip';
import AgendaEvent from '../components/AgendaEvent';
import CalendarDialogs from '../components/CalendarDialogs';
import type { CalendarModalData } from '../components/CalendarDialogs';

// Shared Components
import PageLoader from '../../../shared/components/PageLoader';

// Material UI
import { Box, Alert, Drawer, useMediaQuery, useTheme, Typography } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';

/**
 * Objeto de configuración de localización en español para la biblioteca react-big-calendar.
 * Emplea las utilidades de `date-fns` para garantizar el correcto parseo, formateo
 * y cálculo de inicios de semana y días de acuerdo a la configuración regional española.
 */
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales: { 'es': es }
});

const DnDCalendar = withDragAndDrop(Calendar);

/**
 * Componente que representa la vista principal del Calendario de Espacios de la aplicación.
 *
 * Su propósito es centralizar la visualización de las reservas existentes, integrar los 
 * sistemas de filtrado por espacio, estado y tipo de reserva, y facilitar la gestión 
 * interactiva a través de operaciones de Drag & Drop (arrastrar y soltar) y redimensionamiento.
 * Además, orquesta la apertura y cierre de diversos modales (creación, edición, detalles)
 * e interactúa con el estado de sincronización y navegación de la URL.
 *
 * @returns Elemento JSX que contiene la interfaz completa del calendario, barra lateral y diálogos.
 */
const CalendarView = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user, hasPermission, managesSubject } = useAuth();
    const { showSnackbar } = useSnackbar();
    const { timeSettings } = useSettings();
    const { startHour, endHour } = timeSettings;

    // --- Estado de UI y Navegación del Calendario ---
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<string>('month');
    const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

    // --- Lógica de Datos Centralizada ---
    const {
        filteredEvents,
        spaces,
        selectedSpaceIds,
        selectedStatuses,
        selectedTypes,
        allTypes,
        toggleSpace,
        toggleAllSpaces,
        toggleStatus,
        toggleAllStatuses,
        toggleType,
        toggleAllTypes,
        loading,
        error,
        syncingEventId,
        handleUpdateEvent,
        handleApprove,
        fetchReservations
    } = useCalendarEvents(calendarDate, currentView);

    // --- Gestión de Diálogos (Stack de Modales) ---
    const modals = useModalStack<CalendarModalData>({
        details: null,
        edit: null,
        create: null,
        delete: null,
        reject: null,
        confirmAction: null
    });

    // --- Sincronización con URL (Query Params) ---
    useCalendarNavigation({
        filteredEvents,
        modals,
        setCalendarDate,
        setCurrentView
    });

    // --- Callbacks de Gestión de Vista ---
    const handleViewChange = useCallback((newView: string) => {
        const today = new Date();
        let newDate = new Date(calendarDate);

        if (currentView === 'month' && ['week', 'day', 'agenda'].includes(newView)) {
            newDate = isSameMonth(calendarDate, today) ? today : startOfMonth(calendarDate);
        } else if (currentView === 'week' && newView === 'day') {
            newDate = isSameWeek(calendarDate, today, { weekStartsOn: 1 }) ? today : startOfWeek(calendarDate, { weekStartsOn: 1 });
        }

        setCalendarDate(newDate);
        setCurrentView(newView);
    }, [calendarDate, currentView]);

    // --- Handlers de Acciones del Calendario ---
    
    const handleConfirmAction = useCallback(() => {
        const pendingAction = modals.getData('confirmAction');
        if (pendingAction) {
            handleUpdateEvent(pendingAction.event.id, pendingAction.start, pendingAction.end, pendingAction.event);
            modals.close('confirmAction');
        }
    }, [modals, handleUpdateEvent]);

    const handleMoveEvent = useCallback(({ event, start, end }: any) => {
        if (!isFutureUtil(start)) {
            showSnackbar("No puedes mover reservas al pasado.", 'error');
            return;
        }
        modals.open('confirmAction', { event, start, end, type: 'MOVE' });
    }, [modals, showSnackbar]);

    const handleResizeEvent = useCallback(({ event, start, end }: any) => {
        modals.open('confirmAction', { event, start, end, type: 'RESIZE' });
    }, [modals]);

    const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
        if (!hasPermission('SOLICITAR_RESERVA') || !user) return;
        
        // Permitimos si es hoy o futuro
        if (!isTodayUtil(start) && !isFutureUtil(start)) {
            showSnackbar("No se permiten reservas en fechas pasadas.", 'error');
            return;
        }

        let adjStart = new Date(start);
        let adjEnd = new Date(end);

        // Si es una selección de día completo (00:00), aplicamos el ajuste inteligente
        if (start.getHours() === 0 && start.getMinutes() === 0) {
            const smartTimes = getSmartDefaultTime(start, startHour);
            adjStart = smartTimes.start;
            adjEnd = smartTimes.end;
        }

        modals.open('create', { 
            start: adjStart, 
            end: adjEnd, 
            spaceIds: (selectedSpaceIds.length === 1 ? [selectedSpaceIds[0]] : []) 
        });
    }, [hasPermission, user, showSnackbar, startHour, selectedSpaceIds, modals, isTodayUtil, isFutureUtil, getSmartDefaultTime]);

    const handleInternalApprove = useCallback(async (resId: number) => {
        return await handleApprove(resId);
    }, [handleApprove]);

    // --- Selectores Memorizados ---

    const selectedEventId = modals.getData('details') || modals.getData('edit') || modals.getData('delete') || modals.getData('reject');

    const selectedEvent = useMemo(() => 
        filteredEvents.find(e => e.id === selectedEventId) || null,
    [filteredEvents, selectedEventId]);

    // Regla de Negocio: Una reserva es editable si es futura y no es terminal (CANCELADA/RECHAZADA)
    // Solo el dueño, admins o gestores con permiso de aprobación pueden editar.
    const getCanEdit = useCallback((event: CalendarEvent) => {
        const res = event.resource;
        const isTerminal = res.status === 'CANCELADA' || res.status === 'RECHAZADA';
        const isFuture = isFutureUtil(event.start); // Usamos el inicio para editar
        if (!isFuture || isTerminal) return false;

        const isOwner = user?.id === res.user.id;
        const isApprover = hasPermission('APROBAR_RESERVA') || (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id));
        return isOwner || isApprover || user?.role === 'ADMIN';
    }, [user, hasPermission, managesSubject]);

    // Regla de Negocio: Una reserva se puede cancelar si es futura.
    // Dueños pueden siempre. Admins o gestores solo si NO está pendiente (deben rechazar).
    const getCanDelete = useCallback((event: CalendarEvent) => {
        const res = event.resource;
        const isFuture = isFutureUtil(event.start); // No se cancela si ya empezó
        if (!isFuture) return false;

        const isOwner = user?.id === res.user.id;
        if (isOwner) return true;
        
        // Gestores no pueden cancelar si está pendiente (deben RECHAZAR con motivo)
        if (res.status === 'SOLICITADA') return false;

        const hasCancelPrivileges = hasPermission('CANCELAR_RESERVA') || user?.role === 'ADMIN';
        const hasSubjectCancel = hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && res.subject && managesSubject(res.subject.id);
        
        return hasCancelPrivileges || hasSubjectCancel;
    }, [user, hasPermission, managesSubject]);

    const isFuture = selectedEvent ? isFutureUtil(selectedEvent.start) : false;
    
    const canEdit = useMemo(() => {
        if (!selectedEvent) return false;
        return getCanEdit(selectedEvent);
    }, [selectedEvent, getCanEdit]);

    const canDelete = useMemo(() => {
        if (!selectedEvent) return false;
        return getCanDelete(selectedEvent);
    }, [selectedEvent, getCanDelete]);

    const canApproveReject = useMemo(() => {
        if (!selectedEvent || selectedEvent.resource.status !== 'SOLICITADA') return false;
        const isFutureEvent = isFutureUtil(selectedEvent.start);
        if (!isFutureEvent) return false;

        if (hasPermission('APROBAR_RESERVA')) return true;
        if (hasPermission('APROBAR_ASIGNATURAS_GESTIONADAS') && selectedEvent.resource.subject) {
            return managesSubject(selectedEvent.resource.subject.id);
        }
        return false;
    }, [selectedEvent, hasPermission, managesSubject]);

    const calendarMin = useMemo(() => { 
        const d = new Date(); d.setHours(startHour, 0, 0); return d; 
    }, [startHour]);
    
    const calendarMax = useMemo(() => { 
        const d = new Date(); d.setHours(endHour, 0, 0); return d; 
    }, [endHour]);

    const eventStyleGetter = useCallback((evt: CalendarEvent) => {
        const res = evt.resource;
        const isSyncing = syncingEventId === evt.id;
        const colors = getSpaceColors(res.spaces?.[0]?.type || 'OTROS', (res.spaces?.length || 0) > 1);
        
        const statusColors: Record<string, string> = {
            'APROBADA': '#1a73e8',
            'SOLICITADA': '#f29900',
            'BLOQUEO': '#455a64'
        };

        const isDraggable = getCanEdit(evt);

        return {
            style: {
                backgroundColor: colors.bg,
                color: colors.text,
                border: '1px solid rgba(0,0,0,0.08)',
                borderLeft: `4px solid ${statusColors[res.status] || '#757575'}`,
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '2px 5px',
                opacity: isSyncing ? 0.6 : 1,
                cursor: isDraggable ? 'move' : 'default',
                pointerEvents: isSyncing ? 'none' as const : 'auto' as const,
                transition: 'all 0.2s ease-in-out',
                boxShadow: isSyncing ? 'none' : '0 1px 3px rgba(60,64,67,0.15)',
                zIndex: isSyncing ? 0 : 1
            }
        };
    }, [syncingEventId, getCanEdit]);

    if (loading && filteredEvents.length === 0) {
        return <PageLoader message="Cargando calendario..." />;
    }

    if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', bgcolor: '#f8f9fa', overflow: 'hidden' }}>
            {calendarGlobalStyles}
            
            <Drawer
                variant={isMobile ? "temporary" : "persistent"}
                anchor="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                sx={{
                    width: sidebarOpen ? 320 : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': { 
                        width: 320, 
                        position: 'relative', 
                        height: '100%', 
                        border: 'none', 
                        borderRight: '1px solid #dadce0' 
                    },
                }}
            >
                <CalendarSidebar 
                    spaces={spaces} 
                    selectedSpaceIds={selectedSpaceIds} 
                    selectedStatuses={selectedStatuses}
                    allTypes={allTypes}
                    selectedTypes={selectedTypes}
                    onToggleSpace={toggleSpace}
                    onToggleAll={toggleAllSpaces}
                    onToggleStatus={toggleStatus}
                    onToggleAllStatuses={toggleAllStatuses}
                    onToggleType={toggleType}
                    onToggleAllTypes={toggleAllTypes}
                    onClose={() => setSidebarOpen(false)}
                />
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <Box sx={{ 
                    flexGrow: 1, 
                    bgcolor: 'white', 
                    borderRadius: isMobile ? 0 : 3, 
                    p: isMobile ? 1 : 2, 
                    m: isMobile ? 0 : 2, 
                    boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden' 
                }}>
                    <DnDCalendar
                        localizer={localizer}
                        events={filteredEvents}
                        selectable
                        onSelectSlot={handleSelectSlot}
                        onEventDrop={handleMoveEvent}
                        onEventResize={handleResizeEvent}
                        draggableAccessor={(evt: any) => getCanEdit(evt)}
                        resizableAccessor={(evt: any) => getCanEdit(evt)}
                        resizable={['week', 'day'].includes(currentView)}
                        view={currentView as any}
                        onView={handleViewChange}
                        date={calendarDate}
                        onNavigate={setCalendarDate}
                        length={7}
                        min={calendarMin}
                        max={calendarMax}
                        style={{ height: '100%' }}
                        culture='es'
                        messages={{
                            next: "Sig.", previous: "Ant.", today: "Hoy",
                            month: "Mes", week: "Sem.", day: "Día",
                            agenda: "Agenda", 
                            noEventsInRange: (
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    py: 10, 
                                    color: 'text.disabled',
                                    gap: 2
                                }}>
                                    <EventBusyIcon sx={{ fontSize: 64, opacity: 0.4 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                                        No hay eventos programados en este periodo
                                    </Typography>
                                    <Typography variant="body2">
                                        Intenta cambiar las fechas o ajustar los filtros laterales.
                                    </Typography>
                                </Box>
                            ) as any
                        }}                        components={{
                            toolbar: (props) => (
                                <CalendarHeader {...props} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                            ),
                            event: (props: any) => (
                                <EventTooltip event={props.event}>
                                    <div style={{ height: '100%', width: '100%' }}>{props.title}</div>
                                </EventTooltip>
                            ),
                            agenda: { 
                                event: (props: any) => <AgendaEvent {...props} /> 
                            }
                        }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(evt: CalendarEvent) => modals.open('details', evt.id)}
                    />
                </Box>
            </Box>

            <CalendarDialogs 
                modals={modals}
                selectedEvent={selectedEvent}
                canEdit={canEdit}
                canDelete={canDelete}
                canApproveReject={canApproveReject}
                onFetchReservations={fetchReservations}
                onShowSnackbar={showSnackbar}
                onApprove={handleInternalApprove}
                onConfirmAction={handleConfirmAction}
            />
        </Box>
    );
};

export default CalendarView;
