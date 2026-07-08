package com.tfg.backend.core.security;
import com.tfg.backend.modules.reservation.dto.VisibilityResult;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Implementación robusta del servicio de seguridad que centraliza la evaluación
 * de permisos y políticas de acceso a nivel de aplicación.
 * <p>
 * Se apoya en el contexto de Spring Security para determinar el usuario actualmente
 * autenticado y emplea acceso directo a la base de datos para validar complejas
 * reglas de negocio relativas a reservas, espacios, asignaturas y gestión de usuarios.
 * </p>
 */
@Service("ss")
@RequiredArgsConstructor
public class SecurityServiceImpl implements SecurityService {

    /**
     * Repositorio para el acceso a datos de los usuarios.
     */
    private final UserRepository userRepository;

    /**
     * Repositorio para el acceso a datos de las reservas.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Obtiene el usuario actualmente autenticado en el contexto de seguridad.
     *
     * @return El usuario autenticado, o null si no lo hay.
     */
    @Override
    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    /**
     * Resuelve los resultados de visibilidad según el alcance y el ID de usuario solicitado.
     *
     * @param scope El alcance de la visibilidad.
     * @param requestedUserId El ID del usuario solicitado.
     * @return El resultado de la visibilidad calculada.
     */
    @Override
    public VisibilityResult resolveVisibility(String scope, Long requestedUserId) {
        User user = getCurrentUser();
        if (user == null) {
            return VisibilityResult.builder().targetUserId(-1L).build(); // No access
        }

        Set<String> perms = user.getRole().getPermissionNames();
        boolean hasFullManage = perms.contains("APROBAR_RESERVA") || perms.contains("CANCELAR_RESERVA");
        boolean hasSubjManage = perms.contains("APROBAR_ASIGNATURAS_GESTIONADAS");
        boolean hasGlobalView = perms.contains("VER_TODAS_RESERVAS");

        if ("managed".equalsIgnoreCase(scope)) {
            if (hasFullManage) {
                // Admin/Gestor Global: puede filtrar por cualquier usuario y ve todo.
                return VisibilityResult.builder()
                        .targetUserId(requestedUserId)
                        .securityUserId(null)
                        .managedSubjectIds(null)
                        .build();
            }
            if (hasSubjManage) {
                // Gestor de Asignaturas: 
                // Filtro: si pide un usuario, lo respetamos (pero la seguridad limitará los resultados).
                // Seguridad: Sus reservas propias O las de sus asignaturas.
                return VisibilityResult.builder()
                        .targetUserId(requestedUserId)
                        .securityUserId(user.getId())
                        .managedSubjectIds(new ArrayList<>(user.getRole().getSubjectIds()))
                        .build();
            }
            // Usuario normal: Solo sus reservas.
            return VisibilityResult.builder()
                    .targetUserId(null) // No tiene sentido filtrar si solo ve las suyas
                    .securityUserId(user.getId())
                    .build();
        } else {
            if (hasGlobalView || hasFullManage) {
                return VisibilityResult.builder()
                        .targetUserId(requestedUserId)
                        .securityUserId(null)
                        .build();
            }
            if (hasSubjManage) {
                return VisibilityResult.builder()
                        .targetUserId(requestedUserId)
                        .securityUserId(user.getId())
                        .managedSubjectIds(new ArrayList<>(user.getRole().getSubjectIds()))
                        .build();
            }
            return VisibilityResult.builder()
                    .targetUserId(null)
                    .securityUserId(user.getId())
                    .build();
        }
    }

    /**
     * Verifica si el usuario actual tiene un permiso en particular.
     *
     * @param permission El nombre del permiso.
     * @return true si lo posee, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(String permission) {
        return hasPermission(getCurrentUser(), permission);
    }

    /**
     * Verifica si un usuario especificado tiene un permiso en particular.
     *
     * @param user El usuario a comprobar.
     * @param permission El nombre del permiso.
     * @return true si lo posee, false en caso contrario.
     */
    @Override
    public boolean hasPermission(User user, String permission) {
        if (user == null || user.getRole() == null) return false;
        return user.getRole().getPermissionNames().contains(permission);
    }


    /**
     * Verifica si el usuario actual es administrador.
     *
     * @return true si es administrador, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean isAdmin() {
        User user = getCurrentUser();
        return user != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    /**
     * Verifica si el usuario actual puede editar una reserva dada.
     *
     * @param reservationId El ID de la reserva.
     * @return true si puede editarla, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canEditReservation(Long reservationId) {
        User user = getCurrentUser();
        if (user == null) return false;

        // 1. Administradores o Usuarios con permiso de aprobación (Global)
        if (isAdmin() || hasPermission("APROBAR_RESERVA")) return true;

        return reservationRepository.findById(reservationId)
                .map(res -> {
                    // 2. El propietario siempre puede editar
                    if (res.getUser().getId().equals(user.getId())) return true;

                    // 3. Gestores de la asignatura vinculada
                    return hasPermission("APROBAR_ASIGNATURAS_GESTIONADAS") && 
                           res.getSubject() != null && 
                           managesSubject(res.getSubject().getId());
                })
                .orElse(false);
    }

    /**
     * Verifica si el usuario actual puede cancelar una reserva dada.
     *
     * @param reservationId El ID de la reserva.
     * @return true si puede cancelarla, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canCancelReservation(Long reservationId) {
        User user = getCurrentUser();
        if (user == null) return false;

        return reservationRepository.findById(reservationId)
                .map(res -> {
                    // 1. El propietario siempre puede cancelar su propia reserva (sea cual sea el estado)
                    if (res.getUser().getId().equals(user.getId())) return true;

                    // 2. Si la reserva está SOLICITADA (pendiente), los gestores NO deben cancelarla,
                    // sino RECHAZARLA para proporcionar obligatoriamente un motivo.
                    if (res.getStatus() == com.tfg.backend.modules.reservation.model.ReservationStatus.SOLICITADA) {
                        return false;
                    }

                    // 3. Reglas para reservas ya APROBADAS o BLOQUEOS:
                    // 3.1 Administradores o usuarios con permiso global de cancelación
                    if (isAdmin() || hasPermission("CANCELAR_RESERVA")) return true;

                    // 3.2 Gestores de la asignatura vinculada
                    return hasPermission("APROBAR_ASIGNATURAS_GESTIONADAS") && 
                           res.getSubject() != null && 
                           managesSubject(res.getSubject().getId());
                })
                .orElse(false);
    }

    /**
     * Verifica si el usuario actual puede aprobar una reserva dada.
     *
     * @param reservationId El ID de la reserva.
     * @return true si puede aprobarla, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canApproveReservation(Long reservationId) {
        User user = getCurrentUser();
        if (user == null) return false;

        return reservationRepository.findById(reservationId)
                .map(res -> canUserApproveReservation(user, res))
                .orElse(false);
    }

    /**
     * Verifica si un usuario puede aprobar una reserva dada.
     *
     * @param user El usuario a comprobar.
     * @param res La reserva a comprobar.
     * @return true si puede aprobarla, false en caso contrario.
     */
    @Override
    public boolean canUserApproveReservation(User user, Reservation res) {
        if (user == null || res == null) return false;

        // 1. Permiso global
        if (hasPermission(user, "APROBAR_RESERVA")) return true;

        // 2. Permiso por asignatura gestionada
        if (hasPermission(user, "APROBAR_ASIGNATURAS_GESTIONADAS")) {
            return res.getSubject() != null && user.getRole().getSubjects().stream()
                    .anyMatch(s -> s.getId().equals(res.getSubject().getId()));
        }

        return false;
    }

    /**
     * Verifica si el usuario actual puede visualizar una reserva dada.
     *
     * @param reservationId El ID de la reserva.
     * @return true si puede visualizarla, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canViewReservation(Long reservationId) {
        User user = getCurrentUser();
        if (user == null) return false;

        // 1. Administradores o Usuarios con permiso de visualización total o gestión global
        if (isAdmin() || 
            hasPermission("VER_TODAS_RESERVAS") || 
            hasPermission("APROBAR_RESERVA") || 
            hasPermission("CANCELAR_RESERVA")) return true;

        return reservationRepository.findById(reservationId)
                .map(res -> {
                    // 2. El propietario o el responsable siempre pueden ver
                    if (res.getUser().getId().equals(user.getId())) return true;
                    if (res.getResponsible() != null && res.getResponsible().getId().equals(user.getId())) return true;

                    // 3. Gestores de la asignatura vinculada
                    return (hasPermission("APROBAR_ASIGNATURAS_GESTIONADAS") || hasPermission("CANCELAR_RESERVA")) && 
                           res.getSubject() != null && 
                           managesSubject(res.getSubject().getId());
                })
                .orElse(false);
    }

    /**
     * Verifica si el usuario actual gestiona una asignatura dada.
     *
     * @param subjectId El ID de la asignatura.
     * @return true si la gestiona, false en caso contrario.
     */
    @Override
    public boolean managesSubject(Long subjectId) {
        User user = getCurrentUser();
        if (user == null || user.getRole() == null || subjectId == null) return false;
        
        return user.getRole().getSubjects().stream()
                .anyMatch(s -> s.getId().equals(subjectId));
    }

    /**
     * Verifica si el usuario actual puede visualizar a otros usuarios.
     *
     * @return true si puede ver a los usuarios, false en caso contrario.
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canViewUsers() {
        return isAdmin() || 
               hasPermission("GESTIONAR_USUARIOS") || 
               hasPermission("GESTIONAR_ROLES") || 
               hasPermission("VER_TODAS_RESERVAS") || 
               hasPermission("APROBAR_RESERVA") || 
               hasPermission("APROBAR_ASIGNATURAS_GESTIONADAS") || 
               hasPermission("CANCELAR_RESERVA") ||
               hasPermission("IMPORTAR_RESERVAS") ||
               hasPermission("EXPORTAR_RESERVAS");
    }

    /**
     * Verifica si el usuario actual puede gestionar a otro usuario.
     *
     * @param targetUserId El ID del usuario objetivo a gestionar.
     * @return true si puede gestionarlo, false en caso contrario.
     */
    @Override
    public boolean canManageUser(Long targetUserId) {
        User current = getCurrentUser();
        if (current == null) return false;

        // Auto-edición siempre permitida a nivel de acceso API (las restricciones de campos irán en el servicio)
        if (current.getId().equals(targetUserId)) return true;

        if (!hasPermission("GESTIONAR_USUARIOS")) return false;

        // Y solo un ADMIN puede tocar a otro ADMIN
        return userRepository.findById(targetUserId).map(target -> {
            if ("ADMIN".equalsIgnoreCase(target.getRole().getName())) {
                return isAdmin();
            }
            return true;
        }).orElse(false);
    }
}
