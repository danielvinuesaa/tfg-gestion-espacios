/**
 * Validador universal de tiempo para los componentes de selección de hora (pickers) de MUI.
 * Comprueba si una hora y minutos están dentro del rango permitido,
 * ignorando la fecha (año/mes/día).
 * 
 * @param timeValue - El valor de fecha y hora a validar.
 * @param startHour - La hora de inicio mínima permitida.
 * @param endHour - La hora de fin máxima permitida.
 * @returns {boolean} Verdadero si la hora se encuentra fuera del rango permitido, falso en caso contrario.
 */
export const isTimeDisabled = (
    timeValue: Date, 
    startHour: number, 
    endHour: number
): boolean => {
    const hour = timeValue.getHours();
    const minutes = timeValue.getMinutes();

    // Fuera del rango de horas
    if (hour < startHour || hour > endHour) return true;

    // Si es la hora de cierre, solo permitimos el minuto 00
    if (hour === endHour && minutes > 0) return true;

    return false;
};

/**
 * Ajusta una fecha para que tenga la hora de inicio configurada
 * si detecta que la hora es medianoche (comportamiento por defecto de MUI al elegir el día).
 * 
 * @param date - La fecha original seleccionada.
 * @param startHour - La hora de inicio a aplicar si la hora es cero.
 * @returns {Date | null} La fecha con la hora ajustada, o nulo si no se proporciona fecha.
 */
export const adjustTimeToStartHour = (
    date: Date | null,
    startHour: number
): Date | null => {
    if (!date) return null;
    
    // Si la hora y minutos son 0, asumimos que acaba de seleccionar el día 
    // y aplicamos la hora mínima del sistema.
    if (date.getHours() === 0 && date.getMinutes() === 0) {
        const newDate = new Date(date);
        newDate.setHours(startHour, 0, 0, 0);
        return newDate;
    }
    
    return date;
};
