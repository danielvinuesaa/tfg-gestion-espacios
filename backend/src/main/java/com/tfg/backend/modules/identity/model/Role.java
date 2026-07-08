package com.tfg.backend.modules.identity.model;
import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.model.Subject;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Formula;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Entidad JPA que define un Rol de usuario dentro del sistema.
 * Un rol agrupa un conjunto de permisos y asignaturas que serán otorgados
 * a los usuarios que lo posean, facilitando la gestión centralizada de accesos
 * basándose en el principio de Control de Acceso Basado en Roles (RBAC).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    /** Identificador único. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nombre del rol. */
    @Column(nullable = false, unique = true)
    private String name;

    /** Descripción del rol. */
    private String description;

    /** Estado del rol. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleStatus status = RoleStatus.ACTIVO;

    /**
     * Número de usuarios activos vinculados a este rol.
     */
    @Formula("(SELECT count(*) FROM users u WHERE u.role_id = id AND u.status != 'ELIMINADO')")
    private Long userCount;

    /**
     * Número total de usuarios (activos y eliminados) vinculados a este rol.
     * Crucial para validaciones de borrado ya que usuarios eliminados pueden ser restaurados.
     */
    @Formula("(SELECT count(*) FROM users u WHERE u.role_id = id)")
    private Long totalUserCount;

    /** Permisos asignados. */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_permission_assignment",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @JsonIgnore
    @Builder.Default
    private Set<Permission> permissions = new java.util.HashSet<>();

    /** Asignaturas vinculadas. */
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "role_subjects",
        joinColumns = @JoinColumn(name = "role_id"),
        inverseJoinColumns = @JoinColumn(name = "subject_id")
    )
    @JsonIgnore
    @Builder.Default
    private Set<Subject> subjects = new java.util.HashSet<>();

    /**
     * Devuelve los objetos completos de permisos para asegurar consistencia de labels en el frontend.
     */
    @JsonProperty("permissions")
    public Set<Permission> getPermissionDetails() {
        return permissions != null ? permissions : Collections.emptySet();
    }

    /**
     * Devuelve solo los nombres de los permisos para compatibilidad lógica rápida.
     */
    @JsonProperty("permissionNames")
    public Set<String> getPermissionNames() {
        if (permissions == null) return Collections.emptySet();
        return permissions.stream()
                .map(Permission::getName)
                .collect(Collectors.toSet());
    }

    @JsonProperty("subjects")
    public List<SubjectDTO> getSubjectDetails() {
        if (subjects == null) return Collections.emptyList();
        return subjects.stream()
                .map(s -> SubjectDTO.builder()
                        .id(s.getId())
                        .code(s.getCode())
                        .name(s.getName())
                        .build())
                .collect(Collectors.toList());
    }

    @JsonProperty("subjectIds")
    public List<Long> getSubjectIds() {
        if (subjects == null) return Collections.emptyList();
        return subjects.stream()
                .map(Subject::getId)
                .collect(Collectors.toList());
    }
}
