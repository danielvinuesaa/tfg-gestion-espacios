package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import com.tfg.backend.modules.identity.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.tfg.backend.modules.analytics.dto.AuditLogDTO;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.springframework.data.domain.*;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el servicio de auditoría (AuditService).
 * Verifica el registro de acciones realizadas por los usuarios y por el sistema,
 * así como la búsqueda y exportación de registros de auditoría.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de AuditService (Gestión y Consulta)")
class AuditServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private SecurityService securityService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AuditService auditService;

    /**
     * Verifica que el servicio devuelva una página de registros de auditoría mapeada correctamente
     * a DTO, enriqueciendo la información con los datos del usuario que realizó la acción.
     */
    @Test
    @DisplayName("✅ searchLogs: Éxito con mapeo a DTO")
    void searchLogs_Success() {
        AuditLog log = AuditLog.builder()
                .id(1L).action("CREATE").performedBy("admin@es").timestamp(LocalDateTime.now()).build();
        User admin = User.builder().email("admin@es").name("Admin").role(Role.builder().name("ADMIN").build()).build();
        
        when(auditLogRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(log)));
        when(userRepository.findByEmail("admin@es")).thenReturn(Optional.of(admin));

        Page<AuditLogDTO> result = auditService.searchLogs(null, null, null, null, PageRequest.of(0, 10));

        assertFalse(result.isEmpty());
        assertEquals("Admin (ADMIN)", result.getContent().get(0).getPerformedBy());
    }

    /**
     * Verifica que se puedan recuperar los registros de auditoría completos para su exportación
     * sin paginación, utilizando los filtros proporcionados.
     */
    @Test
    @DisplayName("✅ findAllLogsForExport: Recupera entidades")
    void findAllLogsForExport_Success() {
        when(auditLogRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Sort.class)))
                .thenReturn(Collections.emptyList());

        Iterable<AuditLog> logs = auditService.findAllLogsForExport(null, null, null, null);
        assertNotNull(logs);
    }

    /**
     * Verifica que al registrar una acción se asocie correctamente con el usuario
     * autenticado actualmente en el contexto de seguridad.
     */
    @Test
    void logAction_WithCurrentUser() {
        // Arrange
        User user = User.builder().email("admin@uniovi.es").build();
        when(securityService.getCurrentUser()).thenReturn(user);

        // Act
        auditService.logAction("Space", "CREATE", 1L, "Created aula 101");

        // Assert
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
        verify(auditLogRepository).save(argThat(log -> 
            log.getPerformedBy().equals("admin@uniovi.es") &&
            log.getEntityName().equals("Space") &&
            log.getAction().equals("CREATE")
        ));
    }

    /**
     * Verifica que al registrar una acción sin un usuario autenticado (por ejemplo, procesos de fondo),
     * la acción se registre automáticamente como realizada por "SYSTEM".
     */
    @Test
    void logAction_WithSystem() {
        // Arrange
        when(securityService.getCurrentUser()).thenReturn(null);

        // Act
        auditService.logAction("System", "BOOT", null, "System started");

        // Assert
        verify(auditLogRepository).save(argThat(log -> 
            log.getPerformedBy().equals("SYSTEM")
        ));
    }

    /**
     * Verifica que el servicio permita registrar una acción especificando explícitamente
     * el nombre o identificador del usuario que la realizó.
     */
    @Test
    void logAction_ExplicitUser() {
        // Act
        auditService.logAction("User", "LOGIN", 2L, "Logged in", "user@uniovi.es");

        // Assert
        verify(auditLogRepository).save(argThat(log -> 
            log.getPerformedBy().equals("user@uniovi.es")
        ));
    }

    /**
     * Verifica que el sistema no lance excepciones (falle silenciosamente) si ocurre un error
     * al intentar guardar el registro de auditoría en la base de datos, evitando interrumpir la operación principal.
     */
    @Test
    void logAction_WhenRepositoryFails_ShouldNotThrowException() {
        // Arrange
        doThrow(new RuntimeException("DB Error")).when(auditLogRepository).save(any());

        // Act & Assert (Should not throw)
        assertDoesNotThrow(() -> auditService.logAction("X", "Y", 1L, "Z"));
    }

    private void assertDoesNotThrow(Runnable action) {
        try {
            action.run();
        } catch (Exception e) {
            org.junit.jupiter.api.Assertions.fail("Should not have thrown exception: " + e.getMessage());
        }
    }
}
