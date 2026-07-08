package com.tfg.backend.modules.notification.mapper;

import com.tfg.backend.modules.notification.dto.NotificationDTO;
import com.tfg.backend.modules.notification.dto.NotificationPreferenceDTO;
import com.tfg.backend.modules.notification.model.Notification;
import com.tfg.backend.modules.notification.model.NotificationPreference;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

/**
 * Interfaz de mapeo para el módulo de Notificaciones.
 * Utiliza MapStruct para generar de forma automática las conversiones
 * entre las entidades del modelo ({@link Notification}, {@link NotificationPreference}) y sus respectivos DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface NotificationMapper {

    /**
     * Convierte una entidad de tipo {@link Notification} en su DTO correspondiente.
     *
     * @param entity La entidad notificación.
     * @return El DTO con los datos de la notificación.
     */
    NotificationDTO toDto(Notification entity);
    
    /**
     * Convierte una lista de entidades {@link Notification} en una lista de DTOs.
     *
     * @param entities Lista de entidades de notificación.
     * @return Lista de DTOs de notificación.
     */
    List<NotificationDTO> toDtoList(List<Notification> entities);

    /**
     * Convierte la entidad embebible {@link NotificationPreference} en su DTO.
     *
     * @param entity La entidad de preferencias.
     * @return El DTO correspondiente.
     */
    NotificationPreferenceDTO toDto(NotificationPreference entity);

    /**
     * Actualiza los datos de una entidad {@link NotificationPreference} a partir de su DTO.
     *
     * @param dto    El DTO que contiene las nuevas preferencias.
     * @param entity La entidad que será actualizada.
     */
    void updateEntityFromDto(NotificationPreferenceDTO dto, @MappingTarget NotificationPreference entity);
}
