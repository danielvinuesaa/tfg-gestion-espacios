package com.tfg.backend.modules.identity.service;

import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.identity.dto.UserImportResultDTO;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import org.junit.jupiter.api.DisplayName;

/**
 * Suite de pruebas unitarias para {@link UserImportServiceImpl}.
 * Verifica el proceso de importación masiva de usuarios desde un archivo CSV,
 * validando los datos, el manejo de conflictos y la estructura del archivo.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de UserImportService")
class UserImportServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuditService auditService;
    @Mock
    private CsvProcessor csvProcessor;
    @Mock
    private MultipartFile mockFile;

    private UserImportServiceImpl userImportService;

    @BeforeEach
    void setUp() {
        userImportService = new UserImportServiceImpl(
                userRepository, roleRepository, passwordEncoder, auditService, csvProcessor);
    }

    /**
     * Verifica que la validación de un archivo CSV correcto no retorne conflictos
     * y cuente correctamente los registros como exitosos y nuevos.
     * @throws Exception Si ocurre un error al procesar el archivo.
     */
    @Test
    void validateCsv_WhenNoConflicts_ShouldReturnSuccess() throws Exception {
        // Arrange
        String[] row = {"John Doe", "john@uniovi.es", "PROFESOR"};
        Role professorRole = Role.builder().name("PROFESOR").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(roleRepository.findByName("PROFESOR")).thenReturn(Optional.of(professorRole));
        when(userRepository.findByEmail("john@uniovi.es")).thenReturn(Optional.empty());

        // Act
        UserImportResultDTO result = userImportService.validateCsv(mockFile);

        // Assert
        assertEquals(1, result.getSuccessCount());
        assertEquals(1, result.getNewCount());
        assertTrue(result.getConflicts().isEmpty());
    }

    /**
     * Verifica que la validación de un archivo CSV detecte conflictos cuando
     * un usuario con el mismo email ya se encuentra registrado.
     * @throws Exception Si ocurre un error al procesar el archivo.
     */
    @Test
    void validateCsv_WhenConflictExists_ShouldReturnConflict() throws Exception {
        // Arrange
        String[] row = {"John Doe", "john@uniovi.es", "ADMIN"};
        Role adminRole = Role.builder().name("ADMIN").build();
        User existingUser = User.builder().email("john@uniovi.es").name("John Old").role(Role.builder().name("PROFESOR").build()).build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmail("john@uniovi.es")).thenReturn(Optional.of(existingUser));

        // Act
        UserImportResultDTO result = userImportService.validateCsv(mockFile);

        // Assert
        assertEquals(0, result.getSuccessCount());
        assertEquals(1, result.getConflicts().size());
        assertEquals("john@uniovi.es", result.getConflicts().get(0).getEmail());
    }

    /**
     * Verifica que al importar un nuevo usuario desde el CSV,
     * este se guarde correctamente con su contraseña encriptada por defecto.
     * @throws Exception Si ocurre un error durante el procesamiento.
     */
    @Test
    void importFromCsv_WhenNewUser_ShouldSaveWithEncodedPassword() throws Exception {
        // Arrange
        String[] row = {"Jane Doe", "jane@uniovi.es", "GESTOR"};
        Role gestorRole = Role.builder().name("GESTOR").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(roleRepository.findByName("GESTOR")).thenReturn(Optional.of(gestorRole));
        when(userRepository.findByEmail("jane@uniovi.es")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_pass");

        // Act
        UserImportResultDTO result = userImportService.importFromCsv(mockFile, false);

        // Assert
        assertEquals(1, result.getSuccessCount());
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("UniOvi.2026");
    }

    /**
     * Verifica que al importar el CSV con la opción de sobrescribir,
     * se actualicen correctamente los datos de los usuarios ya existentes.
     * @throws Exception Si ocurre un error durante el procesamiento.
     */
    @Test
    void importFromCsv_WhenOverwrite_ShouldUpdateExistingUser() throws Exception {
        // Arrange
        String[] row = {"John Updated", "john@uniovi.es", "ADMIN"};
        Role adminRole = Role.builder().name("ADMIN").build();
        User existing = User.builder().email("john@uniovi.es").name("John Old").build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(roleRepository.findByName("ADMIN")).thenReturn(Optional.of(adminRole));
        when(userRepository.findByEmail("john@uniovi.es")).thenReturn(Optional.of(existing));

        // Act
        UserImportResultDTO result = userImportService.importFromCsv(mockFile, true);

        // Assert
        assertEquals(1, result.getSuccessCount());
        assertEquals("John Updated", existing.getName());
        assertEquals(adminRole, existing.getRole());
        verify(userRepository).save(existing);
    }

    /**
     * Verifica que el sistema lance una excepción de validación
     * si una fila del CSV contiene un email con formato inválido.
     */
    @Test
    void validateRowStructure_WhenInvalidEmail_ShouldThrowException() {
        String[] row = {"Name", "not-an-email", "ROLE"};
        assertThrows(BusinessValidationException.class, () -> userImportService.validateRowStructure(row));
    }

    /**
     * Verifica que el mapeo de la fila falle si el rol especificado
     * se encuentra en estado inactivo o eliminado.
     */
    @Test
    @DisplayName("❌ mapRow: Rol inactivo")
    void mapRow_InactiveRole_Fail() {
        String[] row = {"Name", "test@uniovi.es", "INACTIVO"};
        Role inactiveRole = Role.builder().name("INACTIVO").status(com.tfg.backend.modules.identity.model.RoleStatus.ELIMINADO).build();
        
        when(roleRepository.findByName("INACTIVO")).thenReturn(Optional.of(inactiveRole));

        assertThrows(BusinessValidationException.class, () -> userImportService.mapRowToEntity(row));
    }

    /**
     * Verifica que el sistema detecte y reporte un error si existen registros duplicados
     * del mismo usuario dentro del propio archivo CSV.
     */
    @Test
    @DisplayName("❌ processRow: Duplicado en el propio CSV")
    void processRow_DuplicateInCsv_Fail() {
        String[] row = {"John Doe", "john@uniovi.es", "PROFESOR"};
        Role professorRole = Role.builder().name("PROFESOR").status(com.tfg.backend.modules.identity.model.RoleStatus.ACTIVO).build();

        doAnswer(invocation -> {
            CsvProcessor.RowConsumer consumer = invocation.getArgument(2);
            consumer.accept(row, 1);
            consumer.accept(row, 2); // Segunda vez el mismo
            return null;
        }).when(csvProcessor).process(any(), anyBoolean(), any());

        when(roleRepository.findByName("PROFESOR")).thenReturn(Optional.of(professorRole));
        when(userRepository.findByEmail("john@uniovi.es")).thenReturn(Optional.empty());

        UserImportResultDTO result = userImportService.validateCsv(mockFile);
        assertFalse(result.getErrors().isEmpty());
        assertTrue(result.getErrors().get(0).contains("duplicado"));
    }
}
