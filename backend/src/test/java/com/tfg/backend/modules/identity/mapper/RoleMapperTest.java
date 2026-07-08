package com.tfg.backend.modules.identity.mapper;

import com.tfg.backend.modules.identity.dto.PermissionDTO;
import com.tfg.backend.modules.identity.dto.RoleDTO;
import com.tfg.backend.modules.identity.dto.RoleRequest;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.RoleStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para {@link RoleMapper}.
 * Verifica la correcta conversión entre entidades y DTOs de roles y permisos.
 */
@DisplayName("Tests Unitarios de RoleMapper")
class RoleMapperTest {

    private RoleMapper roleMapper;

    @BeforeEach
    void setUp() {
        roleMapper = Mappers.getMapper(RoleMapper.class);
    }

    /**
     * Verifica el mapeo básico desde una entidad de Rol hacia su respectivo DTO,
     * asegurando que los permisos se mapeen por nombre correctamente.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo básico de rol")
    void toDto_Success() {
        Permission p = Permission.builder().id(1L).name("READ").build();
        Role role = Role.builder()
                .id(1L)
                .name("ADMIN")
                .status(RoleStatus.ACTIVO)
                .permissions(Set.of(p))
                .build();

        RoleDTO dto = roleMapper.toDto(role);

        assertNotNull(dto);
        assertEquals(role.getId(), dto.getId());
        assertEquals(role.getName(), dto.getName());
        assertTrue(dto.getPermissionNames().contains("READ"));
    }

    /**
     * Verifica la correcta transformación de una lista de entidades de Permiso
     * hacia una lista de sus respectivos DTOs.
     */
    @Test
    @DisplayName("✅ toPermissionDtoList: Mapeo de lista de permisos")
    void toPermissionDtoList_Success() {
        Permission p1 = Permission.builder().id(1L).name("P1").build();
        Permission p2 = Permission.builder().id(2L).name("P2").build();

        List<PermissionDTO> dtos = roleMapper.toPermissionDtoList(List.of(p1, p2));

        assertEquals(2, dtos.size());
        assertEquals("P1", dtos.get(0).getName());
        assertEquals("P2", dtos.get(1).getName());
    }

    /**
     * Verifica el correcto mapeo de un objeto de solicitud (RoleRequest)
     * hacia una entidad de Rol nueva, asegurando campos ignorados correctamente.
     */
    @Test
    @DisplayName("✅ toEntity: Mapeo de solicitud a entidad")
    void toEntity_Success() {
        RoleRequest request = new RoleRequest();
        request.setName("New Role");

        Role entity = roleMapper.toEntity(request);

        assertNotNull(entity);
        assertEquals("New Role", entity.getName());
        assertNull(entity.getId());
        assertTrue(entity.getPermissions().isEmpty());
    }

    /**
     * Verifica que el mapeador maneje de manera segura las entradas nulas
     * sin producir excepciones.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(roleMapper.toDto((Role) null));
        assertNull(roleMapper.toDto((Permission) null));
    }
}
