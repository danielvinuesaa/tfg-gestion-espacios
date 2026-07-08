package com.tfg.backend.core.audit;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Aspecto (AOP) responsable de interceptar la ejecución de los métodos anotados con {@link Auditable}.
 * Proporciona un mecanismo centralizado para registrar los cambios de estado en las entidades de la aplicación.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    /**
     * Servicio encargado de registrar los eventos de auditoría.
     */
    private final AuditService auditService;

    /**
     * Gestor de entidades de JPA.
     */
    private final EntityManager entityManager;

    /**
     * Mapa de nombres simples de entidades a sus clases completas.
     */
    private static final Map<String, String> ENTITY_PACKAGE_MAP = Map.of(
        "Space", "com.tfg.backend.modules.space.model.Space",
        "User", "com.tfg.backend.modules.identity.model.User",
        "Role", "com.tfg.backend.modules.identity.model.Role",
        "Reservation", "com.tfg.backend.modules.reservation.model.Reservation",
        "AuditLog", "com.tfg.backend.modules.analytics.model.AuditLog"
    );

    /**
     * Formateador de fechas para los registros.
     */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Método interceptor que rodea la ejecución de un método anotado con {@link Auditable}.
     * Calcula los detalles del cambio y registra la acción mediante el servicio de auditoría.
     *
     * @param joinPoint El punto de ejecución capturado.
     * @param auditable La anotación que contiene los metadatos de auditoría.
     * @return El resultado de la ejecución del método interceptado.
     * @throws Throwable Si ocurre alguna excepción durante la ejecución del método original.
     */
    @Around("@annotation(auditable)")
    public Object auditAction(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        String entityName = auditable.entity();
        String action = auditable.action();
        Long entityId = extractIdFromArgs(joinPoint);
        Object oldEntity = null;

        if (action.contains("UPDATE") && entityId != null) {
            oldEntity = fetchEntityState(entityName, entityId);
        }

        Object result = joinPoint.proceed();

        try {
            if (entityId == null && auditable.includeId()) {
                entityId = extractIdFromObject(result);
            }

            String details;
            if (oldEntity != null && result != null) {
                details = buildDiffDetails(oldEntity, result);
            } else {
                details = buildBasicDetails(result, action, joinPoint);
            }

            auditService.logAction(entityName, action, entityId, details);
        } catch (Exception e) {
            log.error("Error al procesar auditoría: {}", e.getMessage());
        }

        return result;
    }

    /**
     * Obtiene el estado anterior de una entidad dada su ID.
     *
     * @param entityName El nombre de la entidad.
     * @param id El identificador.
     * @return El estado anterior o null si falla.
     */
    private Object fetchEntityState(String entityName, Long id) {
        try {
            String className = ENTITY_PACKAGE_MAP.get(entityName);
            if (className == null) return null;
            Class<?> clazz = Class.forName(className);
            Object entity = entityManager.find(clazz, id);
            if (entity != null) {
                entityManager.detach(entity);
            }
            return entity;
        } catch (Exception e) {
            log.warn("No se pudo obtener el estado previo para auditoría de {}: {}", entityName, e.getMessage());
            return null;
        }
    }

    /**
     * Extrae el ID de los argumentos de la llamada.
     *
     * @param joinPoint El punto de intersección.
     * @return El ID extraído, o null.
     */
    private Long extractIdFromArgs(ProceedingJoinPoint joinPoint) {
        for (Object arg : joinPoint.getArgs()) {
            if (arg instanceof Long) return (Long) arg;
        }
        return null;
    }

    /**
     * Extrae el ID del objeto resultante.
     *
     * @param obj El objeto a analizar.
     * @return El ID extraído, o null.
     */
    private Long extractIdFromObject(Object obj) {
        if (obj == null) return null;
        try {
            return (Long) obj.getClass().getMethod("getId").invoke(obj);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Construye un resumen de las diferencias entre dos estados de un objeto.
     *
     * @param oldObj El objeto original.
     * @param newObj El objeto nuevo.
     * @return Cadena con los detalles de las diferencias.
     */
    private String buildDiffDetails(Object oldObj, Object newObj) {
        List<String> changes = new ArrayList<>();
        Field[] fields = oldObj.getClass().getDeclaredFields();

        for (Field field : fields) {
            try {
                if (isIgnoredField(field.getName())) continue;
                
                field.setAccessible(true);
                Object oldVal = field.get(oldObj);
                
                Object newVal;
                try {
                    Field newField = newObj.getClass().getDeclaredField(field.getName());
                    newField.setAccessible(true);
                    newVal = newField.get(newObj);
                } catch (NoSuchFieldException e) {
                    continue; // Skip if field is not present in DTO
                }

                String formattedOld = formatValue(oldVal);
                String formattedNew = formatValue(newVal);

                if (!Objects.equals(oldVal, newVal) && !formattedOld.equals(formattedNew)) {
                    changes.add(String.format("%s: %s -> %s", 
                        translateFieldName(field.getName()), 
                        formattedOld, 
                        formattedNew));
                }
            } catch (Exception ignored) {}
        }

        String baseDetails = changes.isEmpty() ? "Sin cambios detectados" : "Cambios: " + String.join(", ", changes);
        return enrichWithMetadata(newObj, baseDetails);
    }

    /**
     * Enriquece los detalles con metadatos específicos del dominio.
     *
     * @param entity El objeto de dominio.
     * @param details Los detalles existentes.
     * @return Los detalles enriquecidos.
     */
    private String enrichWithMetadata(Object entity, String details) {
        try {
            if (entity.getClass().getSimpleName().equals("Reservation")) {
                String title = (String) entity.getClass().getMethod("getTitle").invoke(entity);
                String responsible = (String) entity.getClass().getMethod("getResponsibleName").invoke(entity);
                String status = entity.getClass().getMethod("getStatus").invoke(entity).toString();
                
                String meta = String.format("%s (Responsable: %s)", title, responsible);
                if (status.equals("RECHAZADA")) {
                    String reason = (String) entity.getClass().getMethod("getRejectionReason").invoke(entity);
                    if (reason != null) meta += " - Motivo: " + reason;
                }
                return meta + " • " + details;
            }
            
            String name = (String) entity.getClass().getMethod("getName").invoke(entity);
            return name + " • " + details;
        } catch (Exception e) {
            try {
                String email = (String) entity.getClass().getMethod("getEmail").invoke(entity);
                return email + " • " + details;
            } catch (Exception e2) {
                return details;
            }
        }
    }

    /**
     * Determina si el campo debe ignorarse en las auditorías.
     *
     * @param name El nombre del campo.
     * @return true si se ignora, false en caso contrario.
     */
    private boolean isIgnoredField(String name) {
        return Set.of("id", "version", "createdAt", "updatedAt", "password", "lastLogin", "rejectionReason").contains(name);
    }

    /**
     * Traduce los nombres de los campos a términos en español.
     *
     * @param name El nombre del campo en inglés.
     * @return El nombre traducido.
     */
    private String translateFieldName(String name) {
        Map<String, String> translations = new HashMap<>();
        translations.put("name", "nombre");
        translations.put("totalCapacity", "capacidad total");
        translations.put("status", "estado");
        translations.put("type", "tipo");
        translations.put("email", "correo");
        translations.put("role", "rol");
        translations.put("description", "descripción");
        translations.put("startTime", "inicio");
        translations.put("endTime", "fin");
        translations.put("title", "título");
        return translations.getOrDefault(name, name);
    }

    /**
     * Formatea un valor para su representación textual.
     *
     * @param val El valor a formatear.
     * @return La representación en cadena del valor.
     */
    private String formatValue(Object val) {
        if (val == null) return "nulo";
        if (val instanceof java.time.LocalDateTime) {
            return ((java.time.LocalDateTime) val).format(DATE_FORMATTER);
        }
        if (val instanceof Collection) {
            return "[" + ((Collection<?>) val).size() + " elementos]";
        }
        if (val.getClass().isEnum()) {
            return val.toString();
        }
        
        // Extraer identificadores legibles de entidades o DTOs anidados
        if (!val.getClass().getName().startsWith("java.")) {
            try {
                return "\"" + (String) val.getClass().getMethod("getEmail").invoke(val) + "\"";
            } catch (Exception e) {
                try {
                    return "\"" + (String) val.getClass().getMethod("getName").invoke(val) + "\"";
                } catch (Exception e2) {
                    try {
                        return "\"" + (String) val.getClass().getMethod("getTitle").invoke(val) + "\"";
                    } catch (Exception e3) {
                        // Si no tiene ninguno de estos campos descriptivos, hacemos fallback a toString truncado o ID
                    }
                }
            }
        }
        return "\"" + val.toString() + "\"";
    }

    /**
     * Construye detalles básicos sobre la ejecución de una acción.
     *
     * @param result El resultado de la operación.
     * @param action El nombre de la acción.
     * @param joinPoint El punto de intersección.
     * @return La cadena con los detalles básicos.
     */
    private String buildBasicDetails(Object result, String action, ProceedingJoinPoint joinPoint) {
        String base = "Acción ejecutada: " + action;
        if (result != null) {
            return enrichWithMetadata(result, base);
        }
        Long entityId = extractIdFromArgs(joinPoint);
        if (entityId != null) {
            return base + " sobre el registro con ID " + entityId;
        }
        return base;
    }
}
