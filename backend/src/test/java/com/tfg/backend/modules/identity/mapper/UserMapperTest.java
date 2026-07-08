package com.tfg.backend.modules.identity.mapper;

import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para {@link UserMapper}.
 * Verifica la correcta conversión entre entidades y DTOs de usuarios,
 * así como la actualización parcial de los datos desde una solicitud.
 */
@DisplayName("Tests Unitarios de UserMapper")
class UserMapperTest {

    private UserMapper userMapper;
    private RoleMapper roleMapper;

    @BeforeEach
    void setUp() {
        userMapper = Mappers.getMapper(UserMapper.class);
        roleMapper = Mappers.getMapper(RoleMapper.class);
        ReflectionTestUtils.setField(userMapper, "roleMapper", roleMapper);
    }

    /**
     * Verifica que la conversión desde una entidad Usuario hacia un DTO
     * se realice transfiriendo correctamente todos los datos correspondientes.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo básico de usuario")
    void toDto_Success() {
        Role role = Role.builder().id(1L).name("ADMIN").build();
        User user = User.builder()
                .id(10L)
                .email("test@uniovi.es")
                .name("Test User")
                .status(UserStatus.ACTIVO)
                .role(role)
                .build();

        UserDTO dto = userMapper.toDto(user);

        assertNotNull(dto);
        assertEquals(user.getId(), dto.getId());
        assertEquals(user.getEmail(), dto.getEmail());
        assertEquals(user.getName(), dto.getName());
        assertEquals(user.getStatus(), dto.getStatus());
        assertNotNull(dto.getRole());
        assertEquals("ADMIN", dto.getRole().getName());
    }

    /**
     * Verifica el mapeo de una petición de creación (UserRequest)
     * hacia una nueva entidad de Usuario, asegurando que propiedades como
     * el password y rol sean ignorados por el mapstruct como se espera.
     */
    @Test
    @DisplayName("✅ toEntity: Mapeo de solicitud a entidad")
    void toEntity_Success() {
        UserRequest request = new UserRequest();
        request.setEmail("new@uniovi.es");
        request.setName("New User");
        request.setRoleId(1L);

        User entity = userMapper.toEntity(request);

        assertNotNull(entity);
        assertEquals(request.getEmail(), entity.getEmail());
        assertEquals(request.getName(), entity.getName());
        assertNull(entity.getId());
        assertNull(entity.getPassword()); // Ignorado por el mapper
        assertNull(entity.getRole()); // Ignorado por el mapper, se resuelve en servicio
    }

    /**
     * Verifica la actualización exitosa de una entidad existente a partir
     * de un objeto con datos de solicitud, omitiendo atributos inmutables o no provistos.
     */
    @Test
    @DisplayName("✅ updateEntityFromRequest: Actualización parcial")
    void updateEntityFromRequest_Success() {
        User user = User.builder().id(10L).email("old@uniovi.es").name("Old Name").build();
        UserRequest request = new UserRequest();
        request.setName("New Name");
        request.setEmail("new@uniovi.es");

        userMapper.updateEntityFromRequest(request, user);

        assertEquals(10L, user.getId()); // No debe cambiar
        assertEquals("New Name", user.getName());
        assertEquals("new@uniovi.es", user.getEmail());
    }

    /**
     * Verifica que el mapeador tolere adecuadamente objetos nulos.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(userMapper.toDto(null));
    }
}
