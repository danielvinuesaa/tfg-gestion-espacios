package com.tfg.backend.modules.notification.repository;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.identity.model.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos para la entidad {@link Notification}.
 * Proporciona operaciones de persistencia y consultas específicas para la gestión de notificaciones.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Recupera todas las notificaciones pertenecientes a un usuario específico,
     * ordenadas descendentemente según su fecha de creación (las más recientes primero).
     *
     * @param user El usuario propietario de las notificaciones.
     * @return Una lista de notificaciones asociadas al usuario.
     */
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Recupera de forma paginada las notificaciones de un usuario, ordenadas por fecha de creación descendente.
     *
     * @param user     El usuario propietario de las notificaciones.
     * @param pageable La información de paginación solicitada.
     * @return Una página que contiene las notificaciones.
     */
    org.springframework.data.domain.Page<Notification> findByUserOrderByCreatedAtDesc(User user, org.springframework.data.domain.Pageable pageable);
    
    /**
     * Cuenta el número total de notificaciones que no han sido marcadas como leídas para un usuario.
     *
     * @param user El usuario consultado.
     * @return El número de notificaciones no leídas.
     */
    long countByUserAndReadFalse(User user);

    /**
     * Recupera todas las notificaciones de un usuario que se encuentran en estado no leído.
     *
     * @param user El usuario propietario de las notificaciones.
     * @return Una lista con las notificaciones pendientes de lectura.
     */
    List<Notification> findByUserAndReadFalse(User user);

    /**
     * Elimina de forma permanente todas las notificaciones asociadas a un usuario específico.
     *
     * @param user El usuario cuyas notificaciones serán eliminadas.
     */
    void deleteByUser(User user);
}
