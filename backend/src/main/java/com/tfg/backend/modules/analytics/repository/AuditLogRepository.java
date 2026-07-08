package com.tfg.backend.modules.analytics.repository;
import com.tfg.backend.modules.analytics.model.AuditLog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos para la entidad de registro de auditoría (AuditLog).
 * Proporciona métodos para consultar y persistir el historial de acciones realizadas en el sistema.
 */
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    /**
     * Encuentra y devuelve la lista de registros de auditoría asociados a una entidad específica,
     * ordenados de forma descendente según su fecha y hora.
     *
     * @param entityName El nombre de la entidad sobre la cual se realizó la acción.
     * @param entityId El identificador de la entidad afectada.
     * @return Una lista de registros de auditoría ordenados por marca de tiempo más reciente primero.
     */
    List<AuditLog> findByEntityNameAndEntityIdOrderByTimestampDesc(String entityName, Long entityId);
}
