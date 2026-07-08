package com.tfg.backend.modules.identity.mapper;

import com.tfg.backend.modules.identity.dto.PermissionDTO;
import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;
import java.util.Set;

/**
 * Interfaz de mapeo (utilizando MapStruct) específica para la entidad {@link Role}.
 * Se encarga de transformar objetos de transferencia de datos de entrada y salida
 * desde y hacia la entidad de dominio correspondiente, incluyendo relaciones complejas.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface RoleMapper {

    /**
     * Convierte una entidad en un DTO de salida.
     * Mapea automáticamente la colección de permisos usando toDto(Permission).
     */
    @Mapping(target = "permissionNames", expression = "java(entity.getPermissionNames())")
    @Mapping(target = "subjects", expression = "java(entity.getSubjectDetails())")
    @Mapping(target = "subjectIds", expression = "java(entity.getSubjectIds())")
    RoleDTO toDto(Role entity);

    PermissionDTO toDto(Permission entity);

    List<PermissionDTO> toPermissionDtoList(List<Permission> entities);

    /**
     * Convierte un DTO de solicitud en una entidad base.
     * El nombre se normaliza en el servicio y las relaciones se resuelven manualmente.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "permissions", ignore = true)
    @Mapping(target = "subjects", ignore = true)
    @Mapping(target = "status", ignore = true)
    Role toEntity(RoleRequest request);

    /**
     * Actualiza una entidad existente con los datos del DTO de solicitud.
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "permissions", ignore = true)
    @Mapping(target = "subjects", ignore = true)
    @Mapping(target = "status", ignore = true)
    void updateEntityFromRequest(RoleRequest request, @MappingTarget Role entity);
}
