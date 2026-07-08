package com.tfg.backend.modules.identity.mapper;
import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.modules.identity.model.User;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * Interfaz de mapeo (utilizando MapStruct) para la entidad {@link User}.
 * Define las reglas de conversión entre el modelo de dominio interno y los objetos 
 * de transferencia de datos (DTO) empleados en las capas de servicio y presentación.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE, uses = {RoleMapper.class})
public interface UserMapper {

    /**
     * Convierte una entidad en un DTO de salida.
     */
    UserDTO toDto(User entity);

    /**
     * Convierte un DTO de solicitud en una entidad base.
     * La contraseña y el rol se gestionan manualmente en el servicio por seguridad y consistencia.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "notificationPreference", ignore = true)
    User toEntity(UserRequest request);

    /**
     * Actualiza una entidad existente con los datos del DTO de solicitud.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "notificationPreference", ignore = true)
    void updateEntityFromRequest(UserRequest request, @MappingTarget User entity);
}
