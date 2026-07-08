package com.tfg.backend.modules.notification.controller;

import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.service.NotificationService;
import com.tfg.backend.modules.identity.model.User;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador REST para la gestión de las preferencias de notificación de los usuarios.
 * Proporciona los endpoints necesarios para consultar, actualizar y restablecer dichas configuraciones.
 */
@RestController
@RequestMapping("/api/notifications/preferences")
@RequiredArgsConstructor
public class NotificationPreferenceController {

    /** Servicio de notificaciones. */
    private final NotificationService notificationService;

    /**
     * Obtiene las preferencias.
     */
    @GetMapping
    public ResponseEntity<NotificationPreferenceDTO> getPreferences(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(notificationService.getPreferences(user));
    }

    /**
     * Actualiza preferencias.
     */
    @PutMapping
    @Auditable(entity = "User", action = "ACTUALIZAR_PREFERENCIAS_NOTIFICACION")
    public ResponseEntity<NotificationPreferenceDTO> updatePreferences(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody NotificationPreferenceDTO newPrefs) {
        
        return ResponseEntity.ok(notificationService.updatePreferences(user, newPrefs));
    }

    /**
     * Restablece preferencias.
     */
    @PostMapping("/reset")
    @Auditable(entity = "User", action = "RESETEAR_PREFERENCIAS_NOTIFICACION")
    public ResponseEntity<Void> resetPreferences(@AuthenticationPrincipal User user) {
        notificationService.resetPreferences(user);
        return ResponseEntity.noContent().build();
    }
}
