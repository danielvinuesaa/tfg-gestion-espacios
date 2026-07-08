/**
 * Define la estructura de una notificación del sistema dirigida a los usuarios.
 *
 * @property id - Identificador único de la notificación.
 * @property content - Texto descriptivo del evento notificado.
 * @property type - Categoría o tipo de la notificación, que define su origen o la acción relacionada.
 * @property read - Indica si el usuario ya ha marcado la notificación como leída.
 * @property createdAt - Fecha y hora de creación de la notificación (en formato ISO).
 * @property actionPath - (Opcional) Ruta de la aplicación a la cual redirigir al interactuar con la notificación.
 * @property reservationId - (Opcional) Identificador de la reserva vinculada a la notificación, si procede.
 */
export interface Notification {
    id: number;
    content: string;
    type: 'RESERVA_CREADA' | 'RESERVA_APROBADA' | 'RESERVA_RECHAZADA' | 'RESERVA_CANCELADA' | 'RESERVA_ACTUALIZADA' | 'RECORDATORIO' | 'SISTEMA';
    read: boolean;
    createdAt: string;
    actionPath?: string;
    reservationId?: number;
}
