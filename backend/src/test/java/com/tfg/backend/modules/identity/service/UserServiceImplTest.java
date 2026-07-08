package com.tfg.backend.modules.identity.service;

import com.tfg.backend.modules.identity.dto.UserDTO;
import com.tfg.backend.modules.identity.dto.UserRequest;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.modules.identity.mapper.UserMapper;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.notification.repository.NotificationRepository;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.identity.validator.UserValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para {@link UserServiceImpl}.
 * Verifica exhaustivamente la gestión de usuarios, incluyendo búsqueda, creación, edición,
 * eliminación y manejo de conflictos con otros dominios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de UserService (Exhaustividad Total de Usuarios)")
class UserServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserValidator userValidator;
    @Mock private SecurityService securityService;
    @Mock private UserMapper userMapper;

    @InjectMocks
    private UserServiceImpl userService;

    private User mockUser;
    private UserDTO mockUserDTO;
    private User adminUser;
    private Role mockRole;
    private UserRequest userRequest;

    @BeforeEach
    void setUp() {
        mockRole = new Role();
        mockRole.setId(1L);
        mockRole.setName("PROFESOR");

        mockUser = new User();
        mockUser.setId(10L);
        mockUser.setEmail("user@uniovi.es");
        mockUser.setName("Usuario Normal");
        mockUser.setStatus(UserStatus.ACTIVO);
        mockUser.setRole(mockRole);

        mockUserDTO = new UserDTO();
        mockUserDTO.setId(10L);
        mockUserDTO.setEmail("user@uniovi.es");
        mockUserDTO.setName("Usuario Normal");
        mockUserDTO.setStatus(UserStatus.ACTIVO);

        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@uniovi.es");
        adminUser.setName("Admin Principal");
        adminUser.setStatus(UserStatus.ACTIVO);
        adminUser.setRole(mockRole);

        userRequest = new UserRequest();
        userRequest.setEmail("new@uniovi.es");
        userRequest.setName("Nuevo Usuario");
        userRequest.setPassword("secret123");
        userRequest.setRoleId(1L);
    }

    // --- 0. BÚSQUEDA (find) ---

    /**
     * Verifica que se recupere exitosamente un usuario por su identificador.
     */
    @Test
    @DisplayName("✅ findById: Éxito")
    void findById_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);
        UserDTO result = userService.findById(10L);
        assertEquals("user@uniovi.es", result.getEmail());
    }

    /**
     * Verifica que se lance una excepción si no se encuentra un usuario por su identificador.
     */
    @Test
    @DisplayName("❌ findById: No encontrado")
    void findById_NotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.findById(99L));
    }

    /**
     * Verifica que se lance una excepción al buscar un usuario que está marcado como eliminado.
     */
    @Test
    @DisplayName("❌ findById: Usuario marcado como ELIMINADO")
    void findById_Deleted() {
        mockUser.setStatus(UserStatus.ELIMINADO);
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        assertThrows(ResourceNotFoundException.class, () -> userService.findById(10L));
    }

    /**
     * Verifica que la obtención de todos los usuarios omita aquellos en estado eliminado.
     */
    @Test
    @DisplayName("✅ findAll: Filtra eliminados")
    void findAll_FiltersDeleted() {
        User deleted = new User(); deleted.setStatus(UserStatus.ELIMINADO);
        when(userRepository.findAll()).thenReturn(List.of(mockUser, deleted));
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);
        List<UserDTO> results = userService.findAll();
        assertEquals(1, results.size());
        assertEquals("user@uniovi.es", results.get(0).getEmail());
    }

    // --- 1. CREACIÓN (create) ---

    /**
     * Verifica la creación exitosa de un usuario con datos válidos.
     */
    @Test
    @DisplayName("🚀 create: Éxito con datos válidos")
    void createUser_Success() {
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(userMapper.toEntity(any())).thenReturn(new User());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any())).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        assertDoesNotThrow(() -> userService.createUser(userRequest));
        verify(userValidator).validateEmail(anyString(), any());
        verify(userValidator).validatePasswordStrength(anyString());
        verify(userRepository).save(any());
    }

    /**
     * Verifica que el sistema rechace la creación de un usuario cuyo email ya está registrado.
     */
    @Test
    @DisplayName("❌ create: Fallo si el email está repetido")
    void createUser_EmailTaken_Fail() {
        doThrow(new BusinessValidationException("email", "Ya existe"))
            .when(userValidator).validateEmail(anyString(), any());

        assertThrows(BusinessValidationException.class, () -> userService.createUser(userRequest));
    }

    /**
     * Verifica que el sistema rechace la creación de un usuario si el rol especificado no existe.
     */
    @Test
    @DisplayName("❌ create: Fallo si el rol no existe")
    void createUser_RoleNotFound_Fail() {
        when(roleRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.createUser(userRequest));
    }

    // --- 2. EDICIÓN (update) ---

    /**
     * Verifica que la actualización de datos básicos de un usuario se realice con éxito.
     */
    @Test
    @DisplayName("✅ update: Éxito al editar datos básicos")
    void updateUser_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(userRepository.save(any())).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        userRequest.setName("Nombre Editado");
        userRequest.setEmail("editado@uniovi.es");
        userRequest.setPassword("NewPass123!");

        UserDTO result = userService.updateUser(10L, userRequest);

        assertNotNull(result);
        verify(userValidator).validateEmail(eq("editado@uniovi.es"), any());
        verify(userValidator).validatePasswordStrength("NewPass123!");
        verify(userRepository).save(any());
    }

    /**
     * Verifica que el sistema permita a un usuario mantener su propio email en una actualización sin conflicto.
     */
    @Test
    @DisplayName("✅ update: No detecta email repetido si es su propio email")
    void updateUser_SameEmail_NoConflict() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findById(1L)).thenReturn(Optional.of(mockRole));
        when(userRepository.save(any())).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        userRequest.setEmail("user@uniovi.es"); 
        userService.updateUser(10L, userRequest);

        verify(userValidator).validateEmail(eq("user@uniovi.es"), eq(Optional.empty()));
    }

    /**
     * Verifica que el estado del administrador principal esté protegido y no se pueda alterar.
     */
    @Test
    @DisplayName("🔒 update: Protección de status del Administrador principal")
    void updateUser_AdminStatusProtection() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        when(roleRepository.findById(anyLong())).thenReturn(Optional.of(mockRole));
        when(userRepository.save(any())).thenReturn(adminUser);
        when(userMapper.toDto(adminUser)).thenReturn(new UserDTO());

        userRequest.setEmail("admin@uniovi.es");
        userRequest.setStatus(UserStatus.BLOQUEADO); // Intento de bloquear al admin

        userService.updateUser(1L, userRequest);

        // El status no debe haber cambiado (se queda en ACTIVO)
        assertEquals(UserStatus.ACTIVO, adminUser.getStatus());
    }

    /**
     * Verifica el bloqueo exitoso de un usuario que no tiene reservas activas.
     */
    @Test
    @DisplayName("✅ update: Bloqueo de usuario sin reservas")
    void updateUser_Block_NoReservations_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findById(anyLong())).thenReturn(Optional.of(mockRole));
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of());
        when(userRepository.save(any())).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        userRequest.setStatus(UserStatus.BLOQUEADO);
        userService.updateUser(10L, userRequest);

        assertEquals(UserStatus.BLOQUEADO, mockUser.getStatus());
    }

    /**
     * Verifica que se rechace el bloqueo de un usuario con reservas activas si no se especifica el parámetro de forzado.
     */
    @Test
    @DisplayName("❌ update: Bloqueo de usuario con reservas (sin force) -> Error")
    void updateUser_Block_WithReservations_NoForce_Fail() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findById(anyLong())).thenReturn(Optional.of(mockRole));
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of(new com.tfg.backend.modules.reservation.model.Reservation()));

        userRequest.setStatus(UserStatus.BLOQUEADO);
        userRequest.setForce(false);

        assertThrows(BusinessValidationException.class, () -> userService.updateUser(10L, userRequest));
    }

    /**
     * Verifica que el bloqueo forzado de un usuario con reservas activas se realice con éxito, cancelando sus reservas.
     */
    @Test
    @DisplayName("✅ update: Bloqueo de usuario con reservas (con force) -> Éxito y cancelación")
    void updateUser_Block_WithReservations_Force_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(roleRepository.findById(anyLong())).thenReturn(Optional.of(mockRole));
        
        var res = new com.tfg.backend.modules.reservation.model.Reservation();
        res.setStatus(ReservationStatus.APROBADA);
        res.setEndTime(LocalDateTime.now().plusDays(1)); // Futura
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of(res));
        when(userRepository.save(any())).thenReturn(mockUser);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        userRequest.setStatus(UserStatus.BLOQUEADO);
        userRequest.setForce(true);

        userService.updateUser(10L, userRequest);

        assertEquals(UserStatus.BLOQUEADO, mockUser.getStatus());
        assertEquals(ReservationStatus.CANCELADA, res.getStatus());
    }

    /**
     * Verifica que el sistema impida a un usuario cambiar su propio rol.
     */
    @Test
    @DisplayName("🔒 update: Bloquea cambio de ROL en auto-edición")
    void updateUser_SelfRoleProtection() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(securityService.getCurrentUser()).thenReturn(mockUser); // Simula que es él mismo

        userRequest.setEmail("user@uniovi.es");
        userRequest.setRoleId(99L); // Intento de cambiar su propio rol

        // Simulamos que el validador lanza excepción (deberíamos verificar que se llama)
        doThrow(new BusinessValidationException("roleId", "No puedes cambiar tu propio rol"))
            .when(userValidator).validateSelfUpdate(any(), anyLong(), any());

        assertThrows(BusinessValidationException.class, () -> userService.updateUser(10L, userRequest));
    }

    // --- 3. ELIMINACIÓN Y SEGURIDAD ---

    /**
     * Verifica que se rechace la eliminación de un usuario que posee reservas activas.
     */
    @Test
    @DisplayName("❌ delete: Fallo por reservas activas")
    void deleteUser_Conflict_Fail() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of(new com.tfg.backend.modules.reservation.model.Reservation()));

        assertThrows(BusinessValidationException.class, () -> userService.deleteUser(10L));
    }

    /**
     * Verifica que la eliminación forzada de un usuario se complete con éxito, cancelando sus reservas activas.
     */
    @Test
    @DisplayName("✅ forceDelete: Éxito cancelando reservas")
    void forceDeleteUser_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        var res = new com.tfg.backend.modules.reservation.model.Reservation();
        res.setStatus(ReservationStatus.APROBADA);
        res.setEndTime(LocalDateTime.now().plusDays(1)); // Futura
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of(res));

        userService.forceDeleteUser(10L);

        assertEquals(ReservationStatus.CANCELADA, res.getStatus());
        assertEquals(UserStatus.ELIMINADO, mockUser.getStatus());
        verify(notificationRepository).deleteByUser(mockUser);
    }

    /**
     * Verifica que el sistema rechace el intento de un usuario de eliminarse a sí mismo.
     */
    @Test
    @DisplayName("❌ delete: No se puede borrar a sí mismo")
    void deleteUser_Self_Fail() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        doThrow(new BusinessValidationException("email", "No puedes borrarte a ti mismo"))
            .when(userValidator).validateNotSelf(any(), any());

        assertThrows(BusinessValidationException.class, () -> userService.deleteUser(10L));
    }

    /**
     * Verifica que el administrador principal no pueda ser eliminado del sistema.
     */
    @Test
    @DisplayName("🔒 security: El administrador principal no puede ser ELIMINADO")
    void forceDeleteUser_AdminProtection() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(adminUser));
        doThrow(new BusinessValidationException("email", "Protección Admin"))
            .when(userValidator).validateNotAdmin(adminUser);

        assertThrows(BusinessValidationException.class, () -> userService.forceDeleteUser(1L));
    }

    // --- 4. OTROS ---

    /**
     * Verifica que la reactivación de un usuario eliminado se realice exitosamente.
     */
    @Test
    @DisplayName("✅ restore: Éxito al reactivar")
    void restoreUser_Success() {
        mockUser.setStatus(UserStatus.ELIMINADO);
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        userService.restoreUser(10L);
        assertEquals(UserStatus.ACTIVO, mockUser.getStatus());
    }

    /**
     * Verifica que en las búsquedas el administrador principal aparezca al principio de los resultados.
     */
    @Test
    @DisplayName("✅ searchUsers: Ordena al admin al principio")
    void searchUsers_AdminAtTop() {
        User u1 = User.builder().id(2L).email("user@uniovi.es").name("User").build();
        User admin = User.builder().id(1L).email("admin@uniovi.es").name("Admin").build();
        
        when(userRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new org.springframework.data.domain.PageImpl<>(List.of(u1, admin)));
        
        when(userMapper.toDto(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return UserDTO.builder().id(u.getId()).email(u.getEmail()).name(u.getName()).build();
        });

        var result = userService.searchUsers(null, null, null, false, org.springframework.data.domain.PageRequest.of(0, 10));

        assertEquals(2, result.getContent().size());
        assertEquals("admin@uniovi.es", result.getContent().get(0).getEmail());
    }

    /**
     * Verifica la correcta detección de reservas activas al consultar conflictos de un usuario.
     */
    @Test
    @DisplayName("✅ getUserConflicts: Detecta reservas activas")
    void getUserConflicts_Success() {
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any()))
                .thenReturn(List.of(com.tfg.backend.modules.reservation.model.Reservation.builder()
                        .id(1L).spaces(Set.of()).startTime(java.time.LocalDateTime.now()).endTime(java.time.LocalDateTime.now().plusHours(1)).status(ReservationStatus.APROBADA).build()));

        var result = userService.getUserConflicts(10L);

        assertTrue(result.isHasConflicts());
        assertEquals(1, result.getConflictCount());
    }

    /**
     * Verifica que el resumen de conflictos para operaciones masivas informe correctamente
     * sobre los elementos impactados.
     */
    @Test
    @DisplayName("✅ getBulkUserConflictSummary: Resumen correcto")
    void getBulkUserConflictSummary_Success() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        when(reservationRepository.findActiveReservationsByUserId(anyLong(), any())).thenReturn(List.of(new com.tfg.backend.modules.reservation.model.Reservation()));

        var result = userService.getBulkUserConflictSummary(List.of(10L));

        assertEquals(1, result.getConflictCount());
        assertEquals(1, result.getTotalImpactedItems());
    }

    /**
     * Verifica la restauración exitosa de un usuario eliminado utilizando su correo electrónico.
     */
    @Test
    @DisplayName("✅ restoreUserByEmail: Éxito")
    void restoreUserByEmail_Success() {
        mockUser.setStatus(UserStatus.ELIMINADO);
        when(userRepository.findByEmail("user@uniovi.es")).thenReturn(Optional.of(mockUser));
        userService.restoreUserByEmail("user@uniovi.es");
        assertEquals(UserStatus.ACTIVO, mockUser.getStatus());
    }

    /**
     * Verifica que el sistema lance una excepción al intentar restaurar a un usuario
     * que no se encuentra en estado eliminado.
     */
    @Test
    @DisplayName("❌ restoreUser: Fallo si no está eliminado")
    void restoreUser_NotDeleted_Fail() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(mockUser));
        assertThrows(BusinessValidationException.class, () -> userService.restoreUser(10L));
    }

    /**
     * Verifica que la eliminación masiva llame internamente a los métodos individuales de cada usuario.
     */
    @Test
    @DisplayName("✅ deleteMultiple: Llama a los métodos individuales")
    void deleteMultiple_Success() {
        User u1 = User.builder().id(10L).email("u1@uniovi.es").status(UserStatus.ACTIVO).build();
        User u2 = User.builder().id(11L).email("u2@uniovi.es").status(UserStatus.ACTIVO).build();
        
        when(userRepository.findById(10L)).thenReturn(Optional.of(u1));
        when(userRepository.findById(11L)).thenReturn(Optional.of(u2));
        
        userService.deleteMultiple(List.of(10L, 11L), false);
        
        verify(userRepository, times(2)).save(any());
    }

    /**
     * Verifica que la eliminación masiva funcione correctamente cuando se proporciona el parámetro de forzado.
     */
    @Test
    @DisplayName("✅ deleteMultiple: Con opción force")
    void deleteMultiple_Force_Success() {
        User u1 = User.builder().id(10L).email("u1@uniovi.es").status(UserStatus.ACTIVO).build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(u1));
        doNothing().when(userValidator).validateNotAdmin(u1);

        userService.deleteMultiple(List.of(10L), true);
        
        assertEquals(UserStatus.ELIMINADO, u1.getStatus());
    }
    // --- PU-USVC-27: restoreByEmail — email no encontrado ---
    /**
     * Verifica que el intento de restaurar un usuario por un correo inexistente
     * devuelva la excepción correspondiente.
     */
    @Test
    @DisplayName("❌ PU-USVC-27: restoreByEmail con email inexistente lanza ResourceNotFoundException")
    void restoreUserByEmail_NotFound() {
        when(userRepository.findByEmail("ghost@uniovi.es")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> userService.restoreUserByEmail("ghost@uniovi.es"));
    }

    // --- PU-USVC-28: restoreByEmail — usuario no eliminado ---
    /**
     * Verifica que la restauración por correo electrónico falle si el usuario ya se encuentra activo.
     */
    @Test
    @DisplayName("❌ PU-USVC-28: restoreByEmail con usuario ACTIVO lanza BusinessValidationException")
    void restoreUserByEmail_NotDeleted() {
        mockUser.setStatus(UserStatus.ACTIVO);
        when(userRepository.findByEmail("user@uniovi.es")).thenReturn(Optional.of(mockUser));
        assertThrows(BusinessValidationException.class, () -> userService.restoreUserByEmail("user@uniovi.es"));
    }

    // --- PU-USVC-30: Admin NO se fija en páginas > 0 ---
    /**
     * Verifica que el administrador no sea fijado artificialmente en resultados de búsquedas paginadas
     * diferentes a la primera página.
     */
    @Test
    @DisplayName("✅ PU-USVC-30: Admin no se reposiciona artificialmente en páginas > 0")
    void searchUsers_AdminNotPinnedOnSubsequentPages() {
        // En page > 0, el servicio devuelve los resultados sin reordenar
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(1, 10); // página 1
        org.springframework.data.domain.Page<User> page =
                new org.springframework.data.domain.PageImpl<>(List.of(mockUser));

        when(userRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class),
                any(org.springframework.data.domain.Pageable.class))).thenReturn(page);
        when(userMapper.toDto(mockUser)).thenReturn(mockUserDTO);

        var result = userService.searchUsers(null, null, null, false, pageable);

        assertNotNull(result);
        // En páginas > 0, el contenido no debe ser manipulado artificialmente
        assertEquals(1, result.getContent().size());
    }

    // --- PU-USVC-34: Eliminación masiva con lista vacía ---
    /**
     * Verifica que no se realicen operaciones ni se lancen excepciones al solicitar
     * una eliminación masiva con una lista vacía.
     */
    @Test
    @DisplayName("✅ PU-USVC-34: deleteMultiple con lista vacía no invoca ninguna operación")
    void deleteMultiple_EmptyList_NoOperation() {
        assertDoesNotThrow(() -> userService.deleteMultiple(Collections.emptyList(), false));
        assertDoesNotThrow(() -> userService.deleteMultiple(null, false));
        verify(userRepository, never()).findById(any());
    }

    // --- PU-USVC-35: Eliminación masiva continúa ante fallo individual ---
    /**
     * Verifica que la eliminación masiva proceda con el resto de usuarios
     * aunque alguno de los identificadores proporcionados no exista.
     */
    @Test
    @DisplayName("✅ PU-USVC-35: deleteMultiple continúa si un ID no existe")
    void deleteMultiple_ContinuesOnIndividualFailure() {
        User validUser = User.builder().id(10L).email("u1@uniovi.es").status(UserStatus.ACTIVO).build();
        when(userRepository.findById(10L)).thenReturn(Optional.of(validUser));
        when(userRepository.findById(99L)).thenReturn(Optional.empty()); // Inexistente

        // No debe lanzar excepción global; el ID válido se procesa
        assertDoesNotThrow(() -> userService.deleteMultiple(List.of(10L, 99L), false));
        verify(userRepository).save(validUser);
    }
}
