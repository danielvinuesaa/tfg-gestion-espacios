import { GlobalStyles } from '@mui/material';

/**
 * Definición de estilos globales utilizados para la personalización integral de
 * la biblioteca react-big-calendar, con un enfoque particular en la optimización
 * visual de la vista de Agenda. Estos estilos aseguran una apariencia coherente
 * y profesional en toda la interfaz de calendario de la aplicación.
 */
export const calendarGlobalStyles = (
    <GlobalStyles styles={{
        '.rbc-addons-dnd-dragged-event': {
            opacity: '0 !important',
            pointerEvents: 'none'
        },
        '.rbc-addons-dnd-is-dragging .rbc-event': {
            transition: 'none !important'
        },
        /* Personalización de la Vista de Agenda */
        '.rbc-agenda-view': {
            border: 'none !important',
            backgroundColor: '#fff',
            '& .rbc-agenda-table': {
                border: 'none !important',
                '& thead > tr > th': {
                    borderBottom: '2px solid #f1f3f4 !important',
                    padding: '16px !important',
                    color: '#5f6368 !important',
                    fontWeight: '600 !important',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px'
                }
            }
        },
        '.rbc-agenda-date-cell': {
            padding: '16px !important',
            fontWeight: '700 !important',
            color: '#1a73e8 !important',
            fontSize: '0.9rem !important',
            borderBottom: '1px solid #f1f3f4 !important'
        },
        '.rbc-agenda-time-cell': {
            padding: '16px !important',
            color: '#3c4043 !important',
            fontWeight: '500 !important',
            borderBottom: '1px solid #f1f3f4 !important'
        },
        '.rbc-agenda-event-cell': {
            padding: '16px !important',
            cursor: 'pointer !important',
            borderBottom: '1px solid #f1f3f4 !important',
            transition: 'background-color 0.2s',
            '&:hover': {
                backgroundColor: '#f8f9fa !important'
            }
        },
        '.rbc-agenda-view .rbc-agenda-table tbody > tr': {
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#f8f9fa'
            }
        },
        '.rbc-agenda-empty': {
            textAlign: 'center',
            color: '#5f6368',
            backgroundColor: '#fff',
            border: 'none !important'
        },
        /* Mejora de espaciado en slots de tiempo */
        '.rbc-timeslot-group': {
            minHeight: '50px !important'
        },
        /* Asegurar scroll interno en vistas de tiempo */
        '.rbc-time-content': {
            overflowY: 'auto !important',
            /* Scrollbar profesional */
            '&::-webkit-scrollbar': {
                width: '8px',
            },
            '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
                background: '#ccc',
                borderRadius: '10px',
                '&:hover': {
                    background: '#bbb',
                },
            },
        },
        /* Estilo para los eventos en vista de Mes (más limpios) */
        '.rbc-month-view .rbc-event': {
            padding: '1px 5px !important',
            margin: '1px 0 !important'
        }
    }} />
);
