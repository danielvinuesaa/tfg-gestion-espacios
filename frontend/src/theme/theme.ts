import { createTheme } from '@mui/material/styles';
import type {} from '@mui/x-date-pickers/themeAugmentation';

/**
 * Configuración global del tema de Material-UI para la aplicación.
 * Define la paleta de colores, formas predeterminadas y las adaptaciones de 
 * estilo específicas para diversos componentes, incluidos los selectores de fecha y hora.
 */
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#dadce0',
          },
        },
        notchedOutline: {
          borderColor: '#dadce0',
        },
      },
    },

    // Configuración para el Reloj Digital (el que muestra una lista de horas)
    MuiDigitalClock: {
      defaultProps: {
        skipDisabled: true,
      },
    },
    // Configuración para el Reloj de Varias Secciones (el que tiene columnas de Horas y Minutos)
    MuiMultiSectionDigitalClock: {
      defaultProps: {
        skipDisabled: true,
      },
    },
    MuiDateTimePicker: {
      defaultProps: {
        // Aseguramos que el paso de minutos sea global si no se especifica
        minutesStep: 15,
        slotProps: {
          desktopPaper: {
            sx: {
              borderRadius: '24px',
              boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
              p: 1,
              mt: 1,
              border: 'none',
            }
          },
          toolbar: {
            hidden: true,
          },
          digitalClock: {
            skipDisabled: true,
          },
          multiSectionDigitalClock: {
            skipDisabled: true,
          }
        } as any,
      },
    },
    MuiDatePicker: {
      defaultProps: {
        slotProps: {
          desktopPaper: {
            sx: {
              borderRadius: '24px',
              boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
              p: 1,
              mt: 1,
              border: 'none',
            }
          },
          toolbar: {
            hidden: true,
          }
        },
      },
    },
    MuiDateCalendar: {
      styleOverrides: {
        root: {
          width: '280px',
        }
      }
    }
  }
});
