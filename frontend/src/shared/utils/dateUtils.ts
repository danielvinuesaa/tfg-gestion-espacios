import { format as dfFormat, parseISO, isToday as dfIsToday, setHours, setMinutes, addMinutes, startOfHour } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Utilidades para el manejo profesional de fechas y zonas horarias.
 * Centraliza la lógica para asegurar que toda la aplicación use Europe/Madrid.
 */

/**
 * Parsea una cadena de fecha de la API.
 * Si la cadena no tiene offset (LocalDateTime), se asume que es Europe/Madrid.
 * Si lo tiene, se respeta la zona horaria del offset.
 * 
 * @param dateStr - La cadena de texto o el objeto Date a procesar.
 * @returns {Date} El objeto Date correspondiente a la fecha parseada.
 */
export const parseApiDate = (dateStr: string | Date | null | undefined): Date => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return dateStr;
    
    const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
    return parseISO(isoStr);
};

/**
 * Formatea una fecha para mostrarla al usuario en español.
 * 
 * @param date - La fecha a formatear.
 * @param pattern - El patrón de formato deseado (por defecto 'PP').
 * @returns {string} La cadena de texto con la fecha formateada.
 */
export const formatDisplayDate = (date: Date | string | null | undefined, pattern: string = 'PP'): string => {
    try {
        if (!date) return '---';
        const d = typeof date === 'string' ? parseApiDate(date) : date;
        if (isNaN(d.getTime())) return 'Fecha inválida';
        return dfFormat(d, pattern, { locale: es });
    } catch (error) {
        console.error('Error formatting date:', date, error);
        return '---';
    }
};

/**
 * Formatea una fecha para enviarla a la API (ISO sin offset).
 * 
 * @param date - El objeto Date a formatear.
 * @returns {string} La fecha en formato de cadena de texto compatible con la API.
 */
export const formatApiDate = (date: Date): string => {
    return dfFormat(date, "yyyy-MM-dd'T'HH:mm:ss");
};

/**
 * Comprueba si una fecha es futura respecto a "ahora" en la zona horaria unificada.
 * 
 * @param date - La fecha a comprobar.
 * @returns {boolean} Verdadero si la fecha es posterior a la hora actual.
 */
export const isFuture = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? parseApiDate(date) : date;
    return d > new Date();
};

/**
 * Comprueba si una fecha es el día de hoy.
 * 
 * @param date - La fecha a comprobar.
 * @returns {boolean} Verdadero si la fecha corresponde al día en curso.
 */
export const isToday = (date: Date | string): boolean => {
    const d = typeof date === 'string' ? parseApiDate(date) : date;
    return dfIsToday(d);
};

/**
 * Calcula la próxima hora válida para una reserva (redondeo a 30 min).
 * Si la fecha es hoy, busca el próximo hueco libre a partir de ahora.
 * Si la fecha es futura, usa la hora de inicio por defecto del sistema.
 * 
 * @param date - La fecha base para el cálculo.
 * @param defaultStartHour - La hora de inicio por defecto del sistema.
 * @returns {{start: Date, end: Date}} Un objeto que contiene las fechas de inicio y fin sugeridas.
 */
export const getSmartDefaultTime = (date: Date, defaultStartHour: number): { start: Date, end: Date } => {
    let start = new Date(date);
    
    if (dfIsToday(date)) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();

        // Si aún no hemos llegado a la hora de apertura, empezamos en la apertura
        if (currentHour < defaultStartHour) {
            start = setHours(setMinutes(start, 0), defaultStartHour);
        } else {
            // Redondeamos al siguiente bloque de 30 min
            if (currentMinutes < 30) {
                start = setHours(setMinutes(start, 30), currentHour);
            } else {
                start = setHours(setMinutes(start, 0), currentHour + 1);
            }
        }
    } else {
        // Para días futuros, usamos la hora de inicio por defecto
        start = setHours(setMinutes(start, 0), defaultStartHour);
    }

    // El fin es por defecto 1 hora después del inicio
    const end = addMinutes(start, 60);
    
    return { start, end };
};
