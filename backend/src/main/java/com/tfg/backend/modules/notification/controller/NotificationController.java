package com.tfg.backend.modules.notification.controller;

import com.tfg.backend.modules.notification.dto.NotificationDTO;
import com.tfg.backend.modules.notification.service.NotificationService;
import com.tfg.backend.modules.identity.model.User;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para la gestión de las notificaciones de los usuarios.
 * Proporciona endpoints para consultar notificaciones, marcarlas como leídas,
 * eliminarlas y obtener el conteo de notificaciones no leídas, utilizando DTOs para el intercambio de datos.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    /** Servicio de notificaciones. */
    private final NotificationService notificationService;

    /**
     * Obtiene notificaciones.
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDTO>> getMyNotifications(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        return ResponseEntity.ok(notificationService.getMyNotifications(user, pageable));
    }

    /**
     * Obtiene recuento no leídas.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(user)));
    }

    /**
     * Marca como leída.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        notificationService.markAsRead(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Marca todas como leídas.
     */
    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Elimina notificación.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * Elimina todas las notificaciones.
     */
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllNotifications(@AuthenticationPrincipal User user) {
        notificationService.clearAllNotifications(user);
        return ResponseEntity.noContent().build();
    }
}
