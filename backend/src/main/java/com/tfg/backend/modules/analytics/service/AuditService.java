package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.core.security.SecurityService;
import com.tfg.backend.modules.analytics.model.AuditLog;
import com.tfg.backend.modules.analytics.repository.AuditLogRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import com.tfg.backend.modules.analytics.dto.AuditLogDTO;
import com.tfg.backend.modules.analytics.repository.AuditLogSpecifications;
import com.tfg.backend.modules.identity.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Servicio transversal (Cross-Cutting Concern) encargado de la gestión centralizada del registro de auditoría.
 * Sigue el principio de Responsabilidad Única (SRP) para garantizar la trazabilidad inmutable de todas las
 * acciones críticas y modificaciones de estado realizadas por los usuarios en el sistema.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    /**
     * Repositorio para el almacenamiento y consulta de logs de auditoría.
     */
    private final AuditLogRepository auditLogRepository;

    /**
     * Servicio encargado de obtener la identidad y contexto del usuario activo.
     */
    private final SecurityService securityService;

    /**
     * Repositorio para consultar información adicional de los usuarios.
     */
    private final UserRepository userRepository;

    /**
     * Busca registros de auditoría filtrados y paginados, convertidos a DTO.
     */
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> searchLogs(String action, String performedBy, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable) {
        Page<AuditLog> logs = auditLogRepository.findAll(
                AuditLogSpecifications.withFilters(action, performedBy, startDate, endDate),
                pageable
        );

        return logs.map(this::convertToDTO);
    }

    /**
     * Obtiene todos los logs filtrados para exportación (entidades).
     */
    @Transactional(readOnly = true)
    public Iterable<AuditLog> findAllLogsForExport(String action, String performedBy, LocalDateTime startDate, LocalDateTime endDate) {
        return auditLogRepository.findAll(
                AuditLogSpecifications.withFilters(action, performedBy, startDate, endDate),
                Sort.by(Sort.Direction.DESC, "timestamp")
        );
    }

    /**
     * Convierte una entidad del modelo de auditoría a un objeto de transferencia de datos enriquecido.
     * Sustituye el identificador interno del autor por su nombre real o marca al sistema.
     *
     * @param log La entidad AuditLog a convertir.
     * @return El DTO correspondiente listo para su exposición.
     */
    private AuditLogDTO convertToDTO(AuditLog log) {
        String author = log.getPerformedBy();
        User u = userRepository.findByEmail(log.getPerformedBy()).orElse(null);

        if (u != null) {
            author = u.getName() + " (" + u.getRole().getName() + ")";
        } else if (log.getPerformedBy() != null && log.getPerformedBy().startsWith("SYSTEM")) {
            author = log.getPerformedBy().replace("SYSTEM", "Sistema");
        }

        String isoTimestamp = log.getTimestamp()
                .atZone(ZoneId.of("Europe/Madrid"))
                .toInstant()
                .toString();

        return AuditLogDTO.builder()
                .id(log.getId().toString())
                .action(log.getAction())
                .performedBy(author)
                .timestamp(isoTimestamp)
                .details(log.getDetails())
                .build();
    }

    /**
     * Registra una acción de auditoría extrayendo automáticamente el usuario autenticado.
     *
     * @param entityName Nombre de la entidad afectada (ej: "User", "Space", "Role").
     * @param action     Acción realizada (ej: "CREATE", "DELETE").
     * @param entityId   ID de la entidad afectada (opcional).
     * @param details    Detalles descriptivos de la operación.
     */
    public void logAction(String entityName, String action, Long entityId, String details) {
        var user = securityService.getCurrentUser();
        String performedBy = user != null ? user.getEmail() : "SYSTEM";

        logAction(entityName, action, entityId, details, performedBy);
    }


    /**
     * Registra una acción de auditoría con un usuario explícito.
     */
    public void logAction(String entityName, String action, Long entityId, String details, String performedBy) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityName(entityName)
                    .entityId(entityId)
                    .performedBy(performedBy)
                    .details(details)
                    .timestamp(LocalDateTime.now())
                    .build();
            
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Fallo al registrar auditoría: Acción={}, Entidad={}, Detalles={}", action, entityName, details, e);
        }
    }
}
