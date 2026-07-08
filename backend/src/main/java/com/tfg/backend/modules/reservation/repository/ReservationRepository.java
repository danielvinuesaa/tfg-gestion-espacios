package com.tfg.backend.modules.reservation.repository;
import com.tfg.backend.modules.space.validator.SpaceValidator;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio para la gestión de la entidad de dominio Reserva (Reservation).
 * Implementa lógica compleja de detección de solapamientos y la aplicación de filtros
 * avanzados mediante especificaciones de la API Criteria de JPA.
 */
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long>, JpaSpecificationExecutor<Reservation> {
    
    /**
     * Recupera todas las reservas vinculadas a un usuario específico.
     *
     * @param userId El identificador único del usuario.
     * @return Una lista que contiene las entidades de reserva correspondientes al usuario.
     */
    List<Reservation> findByUserId(Long userId);
    
    /**
     * Recupera todas las reservas que se encuentran asociadas a un espacio particular.
     *
     * @param spaceId El identificador único del espacio involucrado.
     * @return Una lista de entidades de reserva asociadas al espacio indicado.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id = :spaceId")
    List<Reservation> findBySpaceId(@Param("spaceId") Long spaceId);

    /**
     * Detecta solapamientos cronológicos buscando reservas en conflicto dentro de un espacio
     * y un rango de fechas u horas determinados.
     * Solo toma en consideración reservas que se encuentren en estado APROBADA o constituyan un BLOQUEO.
     *
     * @param spaceId Identificador del espacio sobre el que se evalúa la colisión.
     * @param start   Límite inferior del rango temporal.
     * @param end     Límite superior del rango temporal.
     * @return Una lista con las reservas que presentan conflicto de solapamiento.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id = :spaceId " +
           "AND r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND ((r.startTime < :end AND r.endTime > :start))")
    List<Reservation> findOverlappingReservations(
            @Param("spaceId") Long spaceId, 
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end
    );

    /**
     * Detecta solapamientos de reservas para un conjunto especificado de espacios,
     * identificando conflictos temporales.
     *
     * @param spaceIds Lista de identificadores de los espacios a comprobar.
     * @param start    El instante de inicio del bloque temporal propuesto.
     * @param end      El instante de término del bloque temporal propuesto.
     * @return Las reservas preexistentes que entran en conflicto.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id IN :spaceIds " +
           "AND r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND ((r.startTime < :end AND r.endTime > :start))")
    List<Reservation> findOverlappingReservationsInSpaces(
            @Param("spaceIds") List<Long> spaceIds, 
            @Param("start") LocalDateTime start, 
            @Param("end") LocalDateTime end
    );

    /**
     * Evalúa colisiones temporales en un espacio determinado, excluyendo explícitamente
     * el registro de una reserva concreta (lo cual resulta esencial en operaciones de actualización).
     *
     * @param spaceId   El identificador del espacio.
     * @param start     El inicio del periodo a verificar.
     * @param end       El fin del periodo a verificar.
     * @param excludeId El identificador de la reserva a omitir en la búsqueda.
     * @return Una colección de reservas que solapan en horario.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id = :spaceId " +
           "AND r.id != :excludeId " +
           "AND r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND ((r.startTime < :end AND r.endTime > :start))")
    List<Reservation> findOverlappingReservationsExcludingId(
            @Param("spaceId") Long spaceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("excludeId") Long excludeId
    );

    /**
     * Verifica conflictos de superposición cronológica para un grupo de espacios,
     * ignorando una reserva particular en los criterios de búsqueda.
     *
     * @param spaceIds  Lista con los identificadores de los espacios objetivo.
     * @param start     Inicio temporal de la validación.
     * @param end       Fin temporal de la validación.
     * @param excludeId Identificador de la reserva que será eximida de la comprobación.
     * @return Las reservas involucradas en un solapamiento efectivo.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id IN :spaceIds " +
           "AND r.id != :excludeId " +
           "AND r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND ((r.startTime < :end AND r.endTime > :start))")
    List<Reservation> findOverlappingInSpacesExcludingId(
            @Param("spaceIds") List<Long> spaceIds,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("excludeId") Long excludeId
    );

    /**
     * Recupera de la persistencia aquellas reservas en estado activo (SOLICITADA o APROBADA)
     * cuya temporalidad sea futura, vinculadas a un usuario específico en calidad de solicitante o responsable.
     *
     * @param userId El identificador numérico de dicho usuario.
     * @param now    La referencia cronológica actual a partir de la cual se efectúa la criba temporal.
     * @return Una colección de entidades Reservation que satisfacen las condiciones planteadas.
     */
    @Query("SELECT r FROM Reservation r WHERE (r.user.id = :userId OR (r.responsible IS NOT NULL AND r.responsible.id = :userId)) " +
           "AND r.status IN ('SOLICITADA', 'APROBADA') AND r.endTime > :now")
    List<Reservation> findActiveReservationsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Identifica y extrae las reservas pendientes de envío de recordatorio.
     *
     * @param status El estado de la reserva.
     * @param start  Fecha y hora de inicio del periodo límite de evaluación.
     * @param end    Fecha y hora de cierre del periodo límite de evaluación.
     * @return Una lista de entidades que requieren notificación.
     */
    List<Reservation> findByStatusAndStartTimeBetweenAndReminderSentFalse(
        ReservationStatus status, 
        LocalDateTime start, 
        LocalDateTime end
    );

    /**
     * Extrae las reservas cuyo estado pendiente de aprobación haya excedido el umbral temporal definido
     * y para las cuales aún no se haya cursado el pertinente recordatorio de gestión.
     *
     * @param status          El estado (típicamente SOLICITADA) objeto de escrutinio.
     * @param createdAtBefore El límite cronológico máximo de creación permitido previo al envío del aviso.
     * @return Colección de las reservas que cumplen las premisas definidas.
     */
    @Query("SELECT r FROM Reservation r WHERE r.status = :status AND r.createdAt < :createdAtBefore " +
           "AND (r.approvalReminderSent = false OR r.approvalReminderSent IS NULL)")
    List<Reservation> findPendingForApprovalReminder(
        @Param("status") ReservationStatus status, 
        @Param("createdAtBefore") LocalDateTime createdAtBefore
    );

    /**
     * Identifica los espacios que se encuentran inmersos de manera efectiva en un proceso
     * de ocupación (APROBADA o BLOQUEO) en el instante de consulta.
     *
     * @param now El tiempo cronológico relativo a evaluar.
     * @return Una recopilación de los identificadores únicos asociados a dichos espacios.
     */
    @Query("SELECT DISTINCT s.id FROM Reservation r JOIN r.spaces s " +
           "WHERE r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND r.startTime <= :now AND r.endTime > :now")
    List<Long> findCurrentlyOccupiedSpaceIds(@Param("now") LocalDateTime now);

    /**
     * Registra cuáles espacios se hallan bajo un bloqueo administrativo vigente en un momento dado.
     *
     * @param now El horizonte temporal utilizado en la inspección.
     * @return Listado de identificadores de los espacios inhabilitados.
     */
    @Query("SELECT DISTINCT s.id FROM Reservation r JOIN r.spaces s " +
           "WHERE r.status = com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO " +
           "AND r.startTime <= :now AND r.endTime > :now")
    List<Long> findCurrentlyBlockedSpaceIds(@Param("now") LocalDateTime now);

    /**
     * Localiza todas las reservas previamente aprobadas para un espacio, acotando
     * su existencia dentro de los márgenes cronológicos proporcionados.
     * Se integra fundamentalmente para el suministro de datos en los procesos de validación estructural.
     *
     * @param spaceId Identificador del espacio sobre el que recae el análisis.
     * @param start   Marca temporal inferior para la acotación.
     * @param end     Marca temporal superior para la acotación.
     * @return Resultados coincidentes ordenados cronológicamente por inicio.
     */
    @Query("SELECT r FROM Reservation r JOIN r.spaces s WHERE s.id = :spaceId " +
            "AND r.status = com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA " +
            "AND r.startTime BETWEEN :start AND :end " +
            "ORDER BY r.startTime ASC")
    List<Reservation> findApprovedReservationsInRange(
            @Param("spaceId") Long spaceId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    /**
     * Cuantifica el número total de reservas consideradas activas (aprobadas, solicitadas o bloqueos)
     * vinculadas a un espacio y cuya fecha de vencimiento es posterior al momento establecido.
     *
     * @param spaceId El identificador distintivo del espacio a analizar.
     * @param now     El límite temporal para considerar la vigencia.
     * @return El conteo global de incidencias.
     */
    @Query("SELECT COUNT(r) FROM Reservation r JOIN r.spaces s WHERE s.id = :spaceId " +
           "AND r.status IN (com.tfg.backend.modules.reservation.model.ReservationStatus.APROBADA, " +
           "com.tfg.backend.modules.reservation.model.ReservationStatus.SOLICITADA, " +
           "com.tfg.backend.modules.reservation.model.ReservationStatus.BLOQUEO) " +
           "AND r.endTime > :now")
    int countActiveBySpace(@Param("spaceId") Long spaceId, @Param("now") LocalDateTime now);
}
