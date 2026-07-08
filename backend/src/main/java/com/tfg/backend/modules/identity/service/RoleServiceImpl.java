package com.tfg.backend.modules.identity.service;
import com.tfg.backend.modules.identity.dto.PermissionDTO;
import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.core.audit.Auditable;
import com.tfg.backend.core.common.BulkConflictSummaryDTO;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.util.BulkConflictHelper;
import com.tfg.backend.modules.identity.validator.RoleValidator;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.modules.identity.mapper.RoleMapper;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.RoleStatus;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.RoleSpecifications;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementación del servicio responsable de la gestión integral de Roles y Permisos en el sistema.
 * Coordina las operaciones de creación, modificación, eliminación (incluida en bloque) y consulta,
 * aplicando validaciones de seguridad y delegando la coherencia a componentes especializados.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RoleServiceImpl implements RoleService {

    /** Repositorio de roles. */
    private final RoleRepository roleRepository;
    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Repositorio de permisos. */
    private final PermissionRepository permissionRepository;
    /** Repositorio de asignaturas. */
    private final SubjectRepository subjectRepository;
    /** Mapeador de roles. */
    private final RoleMapper roleMapper;
    /** Validador de roles. */
    private final RoleValidator roleValidator;

    /**
     * Obtiene todos los permisos.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PermissionDTO> getAllPermissions() {
        return roleMapper.toPermissionDtoList(permissionRepository.findAll());
    }

    /**
     * Cuenta los usuarios por rol.
     */
    @Override
    @Transactional(readOnly = true)
    public long countUsersByRole(Long roleId) {
        return userRepository.countByRoleId(roleId);
    }

    /**
     * Obtiene el resumen de conflictos en bloque para roles.
     */
    @Override
    @Transactional(readOnly = true)
    public BulkConflictSummaryDTO getBulkRoleConflictSummary(List<Long> ids) {
        return BulkConflictHelper.buildSummary(
                ids,
                id -> roleRepository.findById(id).filter(r -> !"ADMIN".equalsIgnoreCase(r.getName())).orElse(null),
                Role::getName,
                role -> userRepository.countByRoleId(role.getId())
        );
    }

    @Override
    @Auditable(entity = "Role", action = "DELETE_ROLE_BULK", includeId = false)
    public void deleteMultiple(List<Long> ids, Long reassignToId) {
        if (reassignToId != null && ids.contains(reassignToId)) {
            throw new BusinessValidationException("reassignToId", "El rol de destino para la reasignación no puede ser uno de los roles que se están eliminando.");
        }

        List<Role> targetRoles = roleRepository.findAllById(ids).stream()
                .filter(r -> !"ADMIN".equalsIgnoreCase(r.getName()))
                .collect(Collectors.toList());

        for (Role role : targetRoles) {
            long userCount = userRepository.countByRoleId(role.getId());
            if (userCount > 0) {
                if (reassignToId == null) {
                    String message = userCount == 1
                            ? String.format("El rol %s tiene 1 usuario vinculado. Debe proporcionar un rol de destino para reasignarlo.", role.getName())
                            : String.format("El rol %s tiene %d usuarios vinculados. Debe proporcionar un rol de destino para reasignarlos.", role.getName(), userCount);
                    throw new BusinessValidationException("reassignToId", message);
                }
                userRepository.reassignUsersRole(role.getId(), reassignToId);
            }
            role.setStatus(RoleStatus.ELIMINADO);
            roleRepository.save(role);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleDTO> findAll(boolean includeDeleted, String sortBy, String direction) {
        Specification<Role> spec = RoleSpecifications.withFilters(includeDeleted);
        Sort.Direction dir = "desc".equalsIgnoreCase(direction) ? Sort.Direction.DESC : Sort.Direction.ASC;
        
        List<Role> roles;

        if ("peso".equalsIgnoreCase(sortBy)) {
            roles = roleRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "name"));
            Comparator<Role> weightComparator = Comparator.comparingInt(r -> r.getPermissions().size());
            if (dir == Sort.Direction.DESC) {
                weightComparator = weightComparator.reversed();
            }
            roles.sort(weightComparator.thenComparing(Role::getName));
        } else if ("userCount".equalsIgnoreCase(sortBy)) {
            roles = roleRepository.findAll(spec, Sort.by(dir, "userCount").and(Sort.by(Sort.Direction.ASC, "name")));
        } else {
            roles = roleRepository.findAll(spec, Sort.by(dir, "name"));
            if ("name".equalsIgnoreCase(sortBy) && dir == Sort.Direction.ASC) {
                roles = prioritizeAdminRole(roles);
            }
        }
        
        return roles.stream().map(roleMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RoleDTO findById(Long id) {
        return roleMapper.toDto(findByIdEntity(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Role findByIdEntity(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "id", id));
    }

    @Override
    @Auditable(entity = "Role", action = "CREATE_ROLE")
    public RoleDTO createRole(RoleRequest request) {
        Set<Permission> perms = resolvePermissions(request.getPermissions());
        
        roleValidator.validateUniqueName(request.getName(), null);
        roleValidator.validatePermissionsCoherence(perms);

        // Mapeo automático de campos simples
        Role role = roleMapper.toEntity(request);
        
        // Resolución manual de campos críticos
        role.setName(request.getName().toUpperCase());
        role.setPermissions(perms);
        role.setStatus(RoleStatus.ACTIVO);
        
        if (request.getSubjectIds() != null && !request.getSubjectIds().isEmpty()) {
            role.setSubjects(new HashSet<>(subjectRepository.findAllById(request.getSubjectIds())));
        }

        return roleMapper.toDto(roleRepository.save(role));
    }

    @Override
    @Auditable(entity = "Role", action = "UPDATE_ROLE")
    public RoleDTO updateRole(Long id, RoleRequest request) {
        Role role = findByIdEntity(id);

        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new AccessDeniedException("El rol ADMINISTRADOR no puede ser modificado manualmente.");
        }

        Set<Permission> perms = resolvePermissions(request.getPermissions());
        
        if (request.getName() != null) {
            roleValidator.validateUniqueName(request.getName(), id);
        }
        roleValidator.validatePermissionsCoherence(perms);

        // Actualización automática de campos mediante MapStruct
        roleMapper.updateEntityFromRequest(request, role);
        
        if (request.getName() != null) {
            role.setName(request.getName().toUpperCase());
        }
        role.setPermissions(perms);
        
        if (request.getSubjectIds() != null) {
            role.setSubjects(new HashSet<>(subjectRepository.findAllById(request.getSubjectIds())));
        }

        return roleMapper.toDto(roleRepository.save(role));
    }

    @Override
    @Auditable(entity = "Role", action = "ACTIVATE_ROLE")
    public RoleDTO activateRole(Long id) {
        Role role = findByIdEntity(id);
        
        if (role.getStatus() == RoleStatus.ACTIVO) {
            throw new BusinessValidationException("status", "El rol ya está activo.");
        }
        
        role.setStatus(RoleStatus.ACTIVO);
        return roleMapper.toDto(roleRepository.save(role));
    }

    @Override
    @Auditable(entity = "Role", action = "DELETE_ROLE")
    public void deleteRole(Long id, Long reassignToId) {
        if (id.equals(reassignToId)) {
            throw new BusinessValidationException("reassignToId", "No se puede reasignar un rol a sí mismo durante su eliminación.");
        }
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "id", id));

        if ("ADMIN".equalsIgnoreCase(role.getName())) {
            throw new AccessDeniedException("El rol ADMINISTRADOR es vital y no puede ser eliminado.");
        }

        long userCount = userRepository.countByRoleId(id);
        if (userCount > 0) {
            if (reassignToId == null) {
                String message = userCount == 1 
                    ? "Existe 1 usuario vinculado a este rol. Debe proporcionar un rol de destino para reasignarlo."
                    : String.format("Existen %d usuarios vinculados a este rol. Debe proporcionar un rol de destino para reasignarlos.", userCount);
                throw new BusinessValidationException("userCount", message);
            }
            userRepository.reassignUsersRole(id, reassignToId);
        }

        role.setStatus(RoleStatus.ELIMINADO);
        roleRepository.save(role);
    }

    private Set<Permission> resolvePermissions(Set<String> names) {
        if (names == null || names.isEmpty()) return new HashSet<>();
        return names.stream()
                .map(name -> permissionRepository.findByName(name)
                        .orElseThrow(() -> new ResourceNotFoundException("Permiso", "nombre", name)))
                .collect(Collectors.toSet());
    }

    private List<Role> prioritizeAdminRole(List<Role> roles) {
        List<Role> sorted = new ArrayList<>(roles);
        sorted.sort((r1, r2) -> {
            if ("ADMIN".equalsIgnoreCase(r1.getName())) return -1;
            if ("ADMIN".equalsIgnoreCase(r2.getName())) return 1;
            return r1.getName().compareToIgnoreCase(r2.getName());
        });
        return sorted;
    }
}
