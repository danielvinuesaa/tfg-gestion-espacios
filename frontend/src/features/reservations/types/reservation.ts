import { Space } from '../../spaces/types/space';
import { User } from '../../identity/types/user';
import { Subject } from './subject';

/**
 * Representa los diferentes estados transaccionales por los que puede atravesar el ciclo de vida de una reserva.
 */
export type ReservationStatus = 'SOLICITADA' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA' | 'BLOQUEO';

/**
 * Representa las clasificaciones formales o tipologías válidas de las actividades asociadas a una reserva.
 */
export type ReservationType = 'CLASE' | 'EXAMEN' | 'OTRO';

/**
 * Estructura de datos integral que modela una reserva de espacios dentro del sistema.
 * 
 * @property id - Identificador único de la entidad reserva.
 * @property spaces - Colección de espacios físicos asociados e implicados en la reserva.
 * @property user - Entidad del usuario que figura como el solicitante o titular de la reserva.
 * @property startTime - Fecha y hora exactas correspondientes al comienzo de la actividad, en formato ISO 8601.
 * @property endTime - Fecha y hora exactas de la finalización de la actividad, en formato ISO 8601.
 * @property status - Estado de aprobación actual y vigente de la reserva.
 * @property type - Clasificación de la índole o naturaleza del evento a desarrollar.
 * @property title - Denominación descriptiva y opcional para la actividad objeto de la reserva.
 * @property subject - Asignatura académica opcionalmente vinculada al propósito de la reserva.
 * @property description - Bloque textual opcional con justificaciones o detalles técnicos adicionales.
 * @property responsible - Usuario del sistema asignado formalmente como responsable principal del evento.
 * @property responsibleName - Designación explícita de la persona encargada en los casos donde no se asigne a un usuario registrado en el sistema.
 * @property rejectionReason - Justificación textual proporcionada por los administradores en el caso de denegación de la solicitud.
 * @property createdAt - Fecha de creación del registro original en formato ISO 8601.
 */
export interface Reservation {
    id: number;
    spaces: Space[];
    user: User;
    startTime: string;
    endTime: string;
    status: ReservationStatus;
    type: ReservationType;
    title?: string;
    subject?: Subject;
    description?: string;
    responsible?: User;
    responsibleName?: string;
    rejectionReason?: string;
    createdAt: string;
}
