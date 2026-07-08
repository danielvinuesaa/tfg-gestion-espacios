package com.tfg.backend.modules.identity.service;

import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.modules.identity.mapper.RoleMapper;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.RoleStatus;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.identity.validator.RoleValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para {@link RoleServiceImpl}.
 * Verifica las operaciones CRUD, validaciones, ordenación y activación
 * correspondientes a la gestión de roles.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de RoleService (Orquestación)")
class RoleServiceImplTest {

    @Mock private RoleRepository roleRepository;
    @Mock private UserRepository userRepository;
    @Mock private PermissionRepository permissionRepository;
    @Mock private SubjectRepository subjectRepository;
    @Mock private RoleMapper roleMapper;
    @Mock private RoleValidator roleValidator;

    @InjectMocks
    private RoleServiceImpl roleService;

    private Role mockRole;
    private Role adminRole;
    private RoleRequest roleRequest;
    private Permission mockPermission;

    @BeforeEach
    void setUp() {
        mockRole = new Role();
        mockRole.setId(1L);
        mockRole.setName("PROFESOR");
        mockRole.setStatus(RoleStatus.ACTIVO);
        mockRole.setPermissions(new HashSet<>());

        adminRole = new Role();
        adminRole.setId(2L);
        adminRole.setName("ADMIN");
        adminRole.setStatus(RoleStatus.ACTIVO);

        mockPermission = new Permission();
        mockPermission.setName("VER_ESPACIOS");

        roleRequest = new RoleRequest();
        roleRequest.setName("PROFESOR");
        roleRequest.setPermissions(Set.of("VER_ESPACIOS"));
    }

    // --- 1. BÚSQUEDA (find) ---

    /**
     * Verifica que la búsqueda de todos los roles ordene correctamente por nombre,
     * priorizando el rol de Administrador.
     */
    @Test
    @DisplayName("✅ findAll: Ordena por nombre con ADMIN primero")
    void findAll_SortByName_PrioritizesAdmin() {
        Role r1 = Role.builder().name("ZETA").build();
        Role r2 = Role.builder().name("ADMIN").build();
        Role r3 = Role.builder().name("ALFA").build();
        
        when(roleRepository.findAll(any(Specification.class), any(Sort.class)))
            .thenReturn(new ArrayList<>(List.of(r1, r2, r3)));
            
        when(roleMapper.toDto(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            return RoleDTO.builder().name(r.getName()).build();
        });

        List<RoleDTO> results = roleService.findAll(false, "name", "asc");

        assertEquals("ADMIN", results.get(0).getName());
        assertEquals("ALFA", results.get(1).getName());
        assertEquals("ZETA", results.get(2).getName());
    }

    /**
     * Verifica que la búsqueda de roles ordene adecuadamente por peso,
     * determinándolo mediante la cantidad de permisos asignados.
     */
    @Test
    @DisplayName("✅ findAll: Ordena por peso (número de permisos)")
    void findAll_SortByWeight() {
        Role rLight = Role.builder().name("L").permissions(Set.of(new Permission())).build();
        Role rHeavy = Role.builder().name("H").permissions(Set.of(new Permission(), new Permission())).build();
        
        when(roleRepository.findAll(any(Specification.class), any(Sort.class)))
            .thenReturn(new ArrayList<>(List.of(rLight, rHeavy)));
            
        when(roleMapper.toDto(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            return RoleDTO.builder().name(r.getName()).build();
        });

        List<RoleDTO> results = roleService.findAll(false, "peso", "desc");

        assertEquals("H", results.get(0).getName());
        assertEquals("L", results.get(1).getName());
    }

    /**
     * Verifica que la búsqueda de roles pueda ordenar de manera descendente
     * por el recuento de usuarios asignados.
     */
    @Test
    @DisplayName("✅ findAll: Ordena por userCount")
    void findAll_SortByUserCount() {
        Role r1 = Role.builder().name("R1").build();
        r1.setUserCount(10L);
        Role r2 = Role.builder().name("R2").build();
        r2.setUserCount(5L);
        
        when(roleRepository.findAll(any(Specification.class), any(Sort.class)))
            .thenReturn(new ArrayList<>(List.of(r1, r2)));
            
        when(roleMapper.toDto(any(Role.class))).thenAnswer(inv -> {
            Role r = inv.getArgument(0);
            return RoleDTO.builder().name(r.getName()).userCount(r.getUserCount()).build();
        });

        List<RoleDTO> results = roleService.findAll(false, "userCount", "desc");

        assertEquals(10L, results.get(0).getUserCount());
        assertEquals(5L, results.get(1).getUserCount());
    }

    // --- 2. CREACIÓN (create) ---

    /**
     * Verifica la correcta creación de un rol delegando las validaciones correspondientes
     * y guardando la entidad.
     */
    @Test
    @DisplayName("🚀 create: Delega validaciones y guarda el rol")
    void createRole_Success() {
        when(permissionRepository.findByName("VER_ESPACIOS")).thenReturn(Optional.of(mockPermission));
        when(roleMapper.toEntity(any())).thenReturn(new Role());
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleService.createRole(roleRequest);

        verify(roleValidator).validateUniqueName(anyString(), any());
        verify(roleValidator).validatePermissionsCoherence(any());
        verify(roleRepository).save(any());
    }

    /**
     * Verifica que el flujo de creación se interrumpa y lance excepción
     * si alguna de las reglas de validación falla.
     */
    @Test
    @DisplayName("❌ create: Se detiene si el validador lanza excepción")
    void createRole_ValidationFail() {
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        doThrow(new BusinessValidationException("name", "Error")).when(roleValidator).validateUniqueName(anyString(), any());

        assertThrows(BusinessValidationException.class, () -> roleService.createRole(roleRequest));
        verify(roleRepository, never()).save(any());
    }

    // --- 3. EDICIÓN (update) ---

    /**
     * Verifica la actualización exitosa de la información de un rol.
     */
    @Test
    @DisplayName("✅ update: Éxito")
    void updateRole_Success() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleService.updateRole(1L, roleRequest);

        verify(roleMapper).updateEntityFromRequest(any(), any());
        verify(roleRepository).save(mockRole);
    }

    /**
     * Verifica que el sistema impida la edición del rol de Administrador.
     */
    @Test
    @DisplayName("❌ update: Bloquea edición del ADMIN")
    void updateRole_Admin_Fail() {
        when(roleRepository.findById(2L)).thenReturn(Optional.of(adminRole));
        assertThrows(AccessDeniedException.class, () -> roleService.updateRole(2L, roleRequest));
    }

    /**
     * Verifica que si se proporciona un nombre nulo en la petición de actualización,
     * el nombre del rol no sufra cambios.
     */
    @Test
    @DisplayName("✅ update: Éxito con nombre nulo (no cambia)")
    void updateRole_NameNull() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleRequest.setName(null);
        roleService.updateRole(1L, roleRequest);

        verify(roleRepository).save(mockRole);
        assertEquals("PROFESOR", mockRole.getName());
    }

    /**
     * Verifica que la actualización fracase si se especifica un permiso inexistente.
     */
    @Test
    @DisplayName("❌ update: Lanza excepción si permiso no existe")
    void updateRole_PermissionNotFound_Fail() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> roleService.updateRole(1L, roleRequest));
    }

    // --- 4. ELIMINACIÓN ---

    /**
     * Verifica la correcta generación de un resumen de conflictos para operaciones masivas de roles.
     */
    @Test
    @DisplayName("🧪 getBulkRoleConflictSummary: Genera resumen correctamente")
    void getBulkRoleConflictSummary_Success() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(userRepository.countByRoleId(1L)).thenReturn(2L);

        com.tfg.backend.core.common.BulkConflictSummaryDTO summary = roleService.getBulkRoleConflictSummary(List.of(1L));

        assertNotNull(summary);
        assertEquals(1, summary.getItemsWithConflicts().size());
        assertEquals(2L, summary.getTotalImpactedItems());
    }

    /**
     * Verifica que el rol de Administrador no pueda ser eliminado del sistema.
     */
    @Test
    @DisplayName("❌ delete: No se puede eliminar el ADMINISTRADOR")
    void deleteRole_Admin_Fail() {
        when(roleRepository.findById(2L)).thenReturn(Optional.of(adminRole));
        assertThrows(AccessDeniedException.class, () -> roleService.deleteRole(2L, null));
    }

    /**
     * Verifica que se rechace un intento de eliminación de rol que intente reasignar
     * sus usuarios al mismo rol que se está borrando.
     */
    @Test
    @DisplayName("❌ delete: Fallo si reasigna a sí mismo")
    void deleteRole_SelfReassign_Fail() {
        assertThrows(BusinessValidationException.class, () -> roleService.deleteRole(1L, 1L));
    }

    /**
     * Verifica que no sea posible eliminar un rol que posee usuarios asignados
     * si no se proporciona un rol de destino para reasignarlos.
     */
    @Test
    @DisplayName("❌ delete: Fallo si tiene usuarios y no hay destino")
    void deleteRole_HasUsers_NoDestination_Fail() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(userRepository.countByRoleId(1L)).thenReturn(10L);

        assertThrows(BusinessValidationException.class, () -> roleService.deleteRole(1L, null));
    }

    /**
     * Verifica la eliminación masiva exitosa de roles junto con la reasignación
     * de todos los usuarios vinculados al rol destino.
     */
    @Test
    @DisplayName("✅ deleteMultiple: Éxito con reasignación")
    void deleteMultiple_Success() {
        when(roleRepository.findAllById(anyList())).thenReturn(List.of(mockRole));
        when(userRepository.countByRoleId(1L)).thenReturn(5L);

        roleService.deleteMultiple(List.of(1L), 3L);

        verify(userRepository).reassignUsersRole(1L, 3L);
        assertEquals(RoleStatus.ELIMINADO, mockRole.getStatus());
    }

    /**
     * Verifica la correcta activación (o reactivación) de un rol previamente eliminado.
     */
    @Test
    @DisplayName("✅ activateRole: Éxito")
    void activateRole_Success() {
        mockRole.setStatus(RoleStatus.ELIMINADO);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).status(RoleStatus.ACTIVO).build());

        roleService.activateRole(1L);

        assertEquals(RoleStatus.ACTIVO, mockRole.getStatus());
    }

    /**
     * Verifica que el sistema lance una excepción al intentar activar un rol
     * que ya se encuentra activo.
     */
    @Test
    @DisplayName("❌ activateRole: Fallo si ya está activo")
    void activateRole_AlreadyActive_Fail() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        assertThrows(BusinessValidationException.class, () -> roleService.activateRole(1L));
    }

    /**
     * Verifica que la eliminación masiva sea rechazada si el rol destino de la reasignación
     * también se incluye dentro de la lista de roles a borrar.
     */
    @Test
    @DisplayName("❌ deleteMultiple: Fallo si el destino está en la lista de borrado")
    void deleteMultiple_ReassignToSelf_Fail() {
        assertThrows(BusinessValidationException.class, () -> roleService.deleteMultiple(List.of(1L, 2L), 1L));
    }

    /**
     * Verifica que falle una eliminación masiva de roles si alguno de ellos tiene usuarios
     * y no se ha especificado un rol de destino.
     */
    @Test
    @DisplayName("❌ deleteMultiple: Fallo si tiene usuarios y no hay destino")
    void deleteMultiple_HasUsers_NoDestination_Fail() {
        when(roleRepository.findAllById(anyList())).thenReturn(List.of(mockRole));
        when(userRepository.countByRoleId(1L)).thenReturn(5L);

        assertThrows(BusinessValidationException.class, () -> roleService.deleteMultiple(List.of(1L), null));
    }
    // --- PU-RSVC-09: Creación con asignaturas vinculadas ---
    /**
     * Verifica que se puedan asociar asignaturas a un rol satisfactoriamente
     * durante el proceso de su creación.
     */
    @Test
    @DisplayName("✅ PU-RSVC-09: Creación exitosa con subjectIds vincula asignaturas al rol")
    void createRole_WithSubjects_Success() {
        var subject = new com.tfg.backend.modules.reservation.model.Subject();
        subject.setId(10L);
        roleRequest.setSubjectIds(List.of(10L));

        when(roleMapper.toEntity(any())).thenReturn(mockRole);
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(subjectRepository.findAllById(anyList())).thenReturn(List.of(subject));
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleService.createRole(roleRequest);

        verify(subjectRepository).findAllById(List.of(10L));
        verify(roleRepository).save(any());
    }

    // --- PU-RSVC-13: Actualización con nombre null no altera el nombre ---
    /**
     * Verifica que al actualizar un rol sin suministrar un nombre (nombre nulo),
     * el sistema no dispare la validación de unicidad para no alterar el existente.
     */
    @Test
    @DisplayName("✅ PU-RSVC-13: Actualización con name=null no invoca validateUniqueName")
    void updateRole_NameNull_DoesNotValidateName() {
        roleRequest.setName(null);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleService.updateRole(1L, roleRequest);

        verify(roleValidator, never()).validateUniqueName(any(), any());
    }

    // --- PU-RSVC-15: Actualización reemplaza asignaturas vinculadas ---
    /**
     * Verifica que la actualización de un rol reemplace su conjunto actual de asignaturas
     * vinculadas por el especificado en la solicitud.
     */
    @Test
    @DisplayName("✅ PU-RSVC-15: Actualización con subjectIds reemplaza el conjunto de asignaturas")
    void updateRole_ReplacesSubjects() {
        var newSubject = new com.tfg.backend.modules.reservation.model.Subject();
        newSubject.setId(20L);
        roleRequest.setSubjectIds(List.of(20L));

        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(permissionRepository.findByName(anyString())).thenReturn(Optional.of(mockPermission));
        when(subjectRepository.findAllById(List.of(20L))).thenReturn(List.of(newSubject));
        when(roleRepository.save(any())).thenReturn(mockRole);
        when(roleMapper.toDto(any(Role.class))).thenReturn(RoleDTO.builder().id(1L).build());

        roleService.updateRole(1L, roleRequest);

        verify(subjectRepository).findAllById(List.of(20L));
        verify(roleRepository).save(any());
    }

    // --- PU-RSVC-24: Restauración falla si rol ya está activo ---
    /**
     * Verifica que falle la solicitud de activación para un rol cuyo estado
     * ya es ACTIVO en el sistema.
     */
    @Test
    @DisplayName("❌ PU-RSVC-24: activateRole falla si el rol ya está ACTIVO")
    void activateRole_AlreadyActive_ThrowsException() {
        mockRole.setStatus(RoleStatus.ACTIVO);
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        assertThrows(BusinessValidationException.class, () -> roleService.activateRole(1L));
    }

    // --- PU-RSVC-25: Restauración falla si rol no existe ---
    /**
     * Verifica que se lance la excepción correspondiente al intentar
     * activar un rol que no existe en el repositorio.
     */
    @Test
    @DisplayName("❌ PU-RSVC-25: activateRole falla si el rol no existe en repositorio")
    void activateRole_NotFound_ThrowsException() {
        when(roleRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> roleService.activateRole(99L));
    }

    // --- PU-RSVC-26: deleteMultiple silencia el rol ADMIN ---
    /**
     * Verifica que la eliminación masiva de roles proteja el rol de Administrador
     * ignorándolo de manera silenciosa para prevenir su supresión.
     */
    @Test
    @DisplayName("✅ PU-RSVC-26: deleteMultiple ignora silenciosamente el rol ADMIN")
    void deleteMultiple_IgnoresAdminRole() {
        adminRole.setStatus(RoleStatus.ACTIVO);
        when(roleRepository.findAllById(anyList())).thenReturn(List.of(adminRole));

        // Si adminRole es el único en la lista, no debe lanzar excepción ni guardar
        assertDoesNotThrow(() -> roleService.deleteMultiple(List.of(adminRole.getId()), null));
        verify(roleRepository, never()).save(any());
    }

    // --- PU-RSVC-27: deleteMultiple con lista vacía ---
    /**
     * Verifica que la eliminación masiva procese sin errores y sin realizar ninguna
     * acción cuando se le envía una lista vacía.
     */
    @Test
    @DisplayName("✅ PU-RSVC-27: deleteMultiple con lista vacía no ejecuta ninguna operación")
    void deleteMultiple_EmptyList_NoOperation() {
        assertDoesNotThrow(() -> roleService.deleteMultiple(Collections.emptyList(), null));
        verify(roleRepository, never()).save(any());
    }
}
