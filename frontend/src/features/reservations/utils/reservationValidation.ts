import { isFuture } from '../../../shared/utils/dateUtils';
import type { ReservationFormData } from '../hooks/useReservationForm';

/**
 * Define la estructura del resultado de una operación de validación.
 * 
 * @property isValid - Indica si los datos proporcionados han superado la validación de manera satisfactoria.
 * @property error - Mensaje descriptivo del error en caso de que la validación no se cumpla (opcional).
 */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Motor de validación declarativo utilizado por el formulario de reservas.
 * 
 * Actúa como un módulo centralizado para establecer las reglas de negocio, garantizando 
 * la consistencia semántica y estructural de los datos, tanto durante la creación como 
 * en la edición de las entidades correspondientes.
 */
export const reservationValidation = {
    /**
     * Valida la integridad básica de las fechas y reglas de negocio de dominio temporal.
     * 
     * @param values - Objeto con los datos actuales ingresados en el formulario.
     * @param isEdit - Valor booleano que indica si el contexto actual es la edición de una reserva existente.
     * @returns Estructura `ValidationResult` reflejando el éxito de la validación o el motivo del fracaso.
     */
    validateTemporalRange: (values: ReservationFormData, isEdit: boolean): ValidationResult => {
        const { startTime, endTime } = values;

        if (!startTime || !endTime) {
            return { isValid: false, error: "Las fechas de inicio y fin son obligatorias" };
        }

        if (endTime <= startTime) {
            return { isValid: false, error: "La hora de fin debe ser posterior a la de inicio" };
        }

        // Solo validamos que sea a futuro si no es una edición (o si se ha cambiado a una nueva fecha)
        if (!isEdit && !isFuture(startTime)) {
            return { isValid: false, error: "No se puede realizar una reserva en una fecha u hora pasada" };
        }

        return { isValid: true };
    },

    /**
     * Valida la selección de recursos de tipo espacio físico.
     * 
     * @param spaceIds - Colección de identificadores numéricos correspondientes a los espacios seleccionados.
     * @returns Estructura `ValidationResult` detallando el resultado de la comprobación de recursos mínimos.
     */
    validateResources: (spaceIds: number[]): ValidationResult => {
        if (!spaceIds || spaceIds.length === 0) {
            return { isValid: false, error: "Debe seleccionar al menos un espacio" };
        }
        return { isValid: true };
    },

    /**
     * Valida los metadatos y requerimientos contextuales según la tipología específica de la reserva.
     * 
     * @param values - Objeto con los datos capturados actualmente en el formulario.
     * @returns Estructura `ValidationResult` confirmando la correcta completitud de los metadatos o indicando las carencias encontradas.
     */
    validateMetadata: (values: ReservationFormData): ValidationResult => {
        if (values.isBlock) {
            if (!values.description || values.description.trim().length < 5) {
                return { isValid: false, error: "La descripción del bloqueo debe tener al menos 5 caracteres" };
            }
            return { isValid: true };
        }

        if (!values.title || values.title.trim().length < 3) {
            return { isValid: false, error: "El título de la actividad es obligatorio (mín. 3 caracteres)" };
        }

        if (!values.type) {
            return { isValid: false, error: "El tipo de actividad es obligatorio" };
        }

        return { isValid: true };
    }
};
