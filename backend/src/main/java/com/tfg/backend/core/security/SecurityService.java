package com.tfg.backend.core.security;
import com.tfg.backend.modules.reservation.dto.VisibilityResult;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.identity.model.User;


/**
 * Servicio centralizado para la gestión de reglas de seguridad y permisos de negocio.
 * Permite desacoplar la lógica de "quién puede hacer qué" de los controladores y servicios.
 */
public interface SecurityService {

    /**
     * Obtiene el usuario autenticado actualmente en el contexto de seguridad.
     *
     * @return El objeto {@link User} que representa al usuario actual.
     */
    User getCurrentUser();

    /**
     * Resuelve la visibilidad de los datos basándose en el alcance solicitado y los permisos del usuario actual.
     *
     * @param scope El alcance solicitado (por ejemplo, 'all' o 'managed').
     * @param requestedUserId El identificador del usuario solicitado para el filtrado, de manera opcional.
     * @return Un objeto {@link VisibilityResult} que contiene los identificadores para el filtrado en base de datos.
     */
    VisibilityResult resolveVisibility(String scope, Long requestedUserId);

    /**
     * Comprueba de manera general si el usuario autenticado cuenta con un permiso específico.
     *
     * @param permission La cadena de texto que define el permiso a evaluar.
     * @return {@code true} si posee el permiso, {@code false} en caso contrario.
     */
    boolean hasPermission(String permission);

    /**
     * Comprueba si un usuario en concreto dispone de un permiso específico.
     *
     * @param user El usuario cuyos permisos se van a verificar.
     * @param permission La cadena de texto que define el permiso a evaluar.
     * @return {@code true} si el usuario posee el permiso, {@code false} en caso contrario.
     */
    boolean hasPermission(User user, String permission);

    /**
     * Comprueba si el usuario autenticado ostenta el rol de administrador del sistema.
     *
     * @return {@code true} si el usuario tiene rol de administrador, {@code false} en caso contrario.
     */
    boolean isAdmin();

    /**
     * Determina si el usuario actual se encuentra autorizado para editar los detalles de una reserva.
     * Regla de negocio: Debe ser el propietario de la reserva, tener permisos de aprobación o ser administrador.
     *
     * @param reservationId El identificador único de la reserva.
     * @return {@code true} si el usuario puede editar la reserva, {@code false} en caso contrario.
     */
    boolean canEditReservation(Long reservationId);

    /**
     * Determina si el usuario actual posee los permisos necesarios para cancelar una reserva.
     * Regla de negocio: Debe ser el propietario, tener el permiso de cancelación específico o ser administrador.
     *
     * @param reservationId El identificador único de la reserva a cancelar.
     * @return {@code true} si se autoriza la cancelación, {@code false} en caso contrario.
     */
    boolean canCancelReservation(Long reservationId);

    /**
     * Determina si el usuario actual cuenta con la capacidad de aprobar una reserva específica.
     *
     * @param reservationId El identificador único de la reserva.
     * @return {@code true} si el usuario puede aprobar la reserva, {@code false} en caso contrario.
     */
    boolean canApproveReservation(Long reservationId);

    /**
     * Determina si un usuario concreto cuenta con la capacidad de aprobar una reserva específica.
     *
     * @param user El usuario evaluado.
     * @param reservation La entidad de reserva en evaluación.
     * @return {@code true} si el usuario puede realizar la aprobación, {@code false} en caso contrario.
     */
    boolean canUserApproveReservation(User user, Reservation reservation);

    /**
     * Verifica de manera contextual si el usuario gestiona una asignatura en específico.
     *
     * @param subjectId El identificador único de la asignatura.
     * @return {@code true} si el usuario es gestor de la asignatura, {@code false} en caso contrario.
     */
    boolean managesSubject(Long subjectId);

    /**
     * Determina si el usuario dispone de los privilegios necesarios para visualizar el detalle de una reserva concreta.
     * Regla de negocio: Debe ser el propietario, contar con permisos de lectura globales, ser gestor de la asignatura o administrador.
     *
     * @param reservationId El identificador único de la reserva.
     * @return {@code true} si el usuario puede visualizar la reserva, {@code false} en caso contrario.
     */
    boolean canViewReservation(Long reservationId);

    /**
     * Verifica si el usuario actual se encuentra capacitado para llevar a cabo acciones administrativas sobre otro usuario.
     * Regla de negocio: El usuario debe tener permisos de gestión de usuarios y no puede actuar sobre un administrador o sí mismo.
     *
     * @param targetUserId El identificador único del usuario objetivo.
     * @return {@code true} si se autoriza la gestión, {@code false} en caso contrario.
     */
    boolean canManageUser(Long targetUserId);

    /**
     * Comprueba si el usuario posee los permisos de lectura requeridos para acceder a los listados del catálogo de usuarios.
     * Este nivel de acceso es esencial para gestores de reservas, gestores de roles y administradores del sistema.
     *
     * @return {@code true} si el usuario puede visualizar el catálogo de usuarios, {@code false} en caso contrario.
     */
    boolean canViewUsers();
}
