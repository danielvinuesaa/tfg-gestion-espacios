package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.core.common.BaseCsvImportService;
import com.tfg.backend.core.exception.BusinessValidationException;
import com.tfg.backend.core.exception.ResourceNotFoundException;
import com.tfg.backend.core.util.CsvProcessor;
import com.tfg.backend.modules.reservation.event.ReservationEvent;
import com.tfg.backend.modules.analytics.service.AuditService;
import com.tfg.backend.modules.reservation.dto.ReservationImportConflictDTO;
import com.tfg.backend.modules.reservation.dto.ReservationImportResultDTO;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.model.Subject;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.reservation.repository.SubjectRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio encargado de gestionar el proceso de importación masiva de reservas académicas
 * a partir de archivos con formato tabular (CSV). Incorpora validación semántica, detección 
 * de conflictos de recursos y desencadenamiento de eventos del dominio.
 */
@Service
@Slf4j
public class ReservationImportServiceImpl extends BaseCsvImportService<ReservationImportServiceImpl.ImportContext, ReservationImportConflictDTO, ReservationImportResultDTO> implements ReservationImportService {

    /** Repositorio de reservas. */
    private final ReservationRepository reservationRepository;
    /** Repositorio de espacios. */
    private final SpaceRepository spaceRepository;
    /** Repositorio de asignaturas. */
    private final SubjectRepository subjectRepository;
    /** Repositorio de usuarios. */
    private final UserRepository userRepository;
    /** Servicio de auditoría. */
    private final AuditService auditService;
    /** Publicador de eventos. */
    private final ApplicationEventPublisher eventPublisher;

    /** Formateador de fechas. */
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("[dd/MM/yyyy][d/M/yyyy]");
    /** Formateador de horas. */
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("[HH.mm][H.mm]");

    /**
     * Constructor de ReservationImportServiceImpl.
     *
     * @param reservationRepository Repositorio de reservas
     * @param spaceRepository Repositorio de espacios
     * @param subjectRepository Repositorio de asignaturas
     * @param userRepository Repositorio de usuarios
     * @param auditService Servicio de auditoría
     * @param csvProcessor Procesador de CSV
     * @param eventPublisher Publicador de eventos
     */
    public ReservationImportServiceImpl(ReservationRepository reservationRepository, SpaceRepository spaceRepository, 
                                        SubjectRepository subjectRepository, UserRepository userRepository, 
                                        AuditService auditService, CsvProcessor csvProcessor,
                                        ApplicationEventPublisher eventPublisher) {
        super(csvProcessor);
        this.reservationRepository = reservationRepository;
        this.spaceRepository = spaceRepository;
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Valida el archivo CSV sin importar los datos.
     *
     * @param file Archivo CSV a validar
     * @return Resultado de la validación
     */
    @Override
    @Transactional(readOnly = true)
    public ReservationImportResultDTO validateFromCsv(MultipartFile file) {
        List<ImportContext> internalProcessed = new ArrayList<>();
        return processFile(file, ReservationImportResultDTO::new, (ctx, result, processedKeys, row) -> {
            if (checkInternalOverlap(ctx, internalProcessed, result, row)) return;
            if (checkConflicts(ctx, result, row)) return;
            internalProcessed.add(ctx);
        });
    }

    /**
     * Importa reservas desde un archivo CSV.
     *
     * @param file Archivo CSV
     * @param userEmail Email del usuario que importa
     * @param overwrite Indica si se debe sobrescribir
     * @return Resultado de la importación
     */
    @Override
    @Transactional
    public ReservationImportResultDTO importFromCsv(MultipartFile file, String userEmail, boolean overwrite) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + userEmail));

        List<ImportContext> internalProcessed = new ArrayList<>();
        ReservationImportResultDTO result = processFile(file, ReservationImportResultDTO::new, (ctx, res, processedKeys, row) -> {
            // 1. Validar solapamiento interno del CSV primero
            if (hasInternalOverlap(ctx, internalProcessed)) {
                res.addError("Conflicto interno: Esta fila se solapa con otra anterior del mismo archivo.");
                return;
            }

            // 2. Resolver todos los espacios de la fila
            Set<Space> spaces = resolveSpaces(ctx.locationName);
            if (spaces.isEmpty() && ctx.isPhysical) {
                res.addError("Error: No se encontró ninguno de los espacios indicados: " + ctx.locationName);
                return;
            }
            ctx.spaces = spaces;

            // 3. Gestionar solapamientos para CADA espacio (Política ESTRICTA)
            for (Space space : spaces) {
                List<Reservation> overlaps = reservationRepository.findOverlappingReservations(space.getId(), ctx.start, ctx.end);
                if (!overlaps.isEmpty()) {
                    // ESTÁNDAR PROFESIONAL: Los solapamientos bloquean la importación de esa fila específica
                    // para evitar cancelaciones accidentales de datos previos.
                    String info = overlaps.get(0).getTitle() + " en " + space.getName();
                    res.addError("Conflicto: El espacio '" + space.getName() + "' ya está ocupado por: " + info);
                    return;
                }
            }
            
            // 4. Crear reserva vinculando todos los espacios
            Reservation reservation = buildReservation(ctx, currentUser, row);
            Reservation saved = reservationRepository.save(reservation);
            
            // DISPARAR EVENTO DE CREACIÓN (Notifica al dueño y admins si procede)
            eventPublisher.publishEvent(new ReservationEvent(this, saved, ReservationEvent.ReservationAction.CREATE));
            
            internalProcessed.add(ctx);
            res.incrementSuccess();
            res.incrementNew();
        });

        auditService.logAction("Reservation", "IMPORTAR_RESERVAS", null, 
                "Importación masiva finalizada. Éxitos: " + result.getSuccessCount() + (overwrite ? " (Modo Forzado)" : ""), userEmail);

        return result;
    }

    /**
     * Comprueba conflictos de la reserva.
     *
     * @param ctx Contexto de importación
     * @param result Resultado de la importación
     * @param row Fila del CSV
     * @return true si hay conflicto, false en caso contrario
     */
    private boolean checkConflicts(ImportContext ctx, ReservationImportResultDTO result, String[] row) {
        if (!ctx.isPhysical || ctx.spaces.isEmpty()) {
            result.incrementSuccess();
            result.incrementNew();
            return false;
        }

        for (Space space : ctx.spaces) {
            List<Reservation> overlaps = reservationRepository.findOverlappingReservations(space.getId(), ctx.start, ctx.end);
            if (!overlaps.isEmpty()) {
                String info = overlaps.get(0).getTitle() + " en " + space.getName();
                result.addConflict(createConflictDTO(row, "OVERLAP", "Conflicto: " + info + (overlaps.size() > 1 ? " y otros" : "")));
                return true;
            }
        }

        result.incrementSuccess();
        result.incrementNew();
        return false;
    }

    /**
     * Comprueba solapamientos internos.
     *
     * @param ctx Contexto actual
     * @param processed Lista de contextos procesados
     * @param result Resultado
     * @param row Fila del CSV
     * @return true si hay solapamiento, false en caso contrario
     */
    private boolean checkInternalOverlap(ImportContext ctx, List<ImportContext> processed, ReservationImportResultDTO result, String[] row) {
        if (hasInternalOverlap(ctx, processed)) {
            result.addConflict(createConflictDTO(row, "OVERLAP", "Conflicto interno: Se solapa con otra reserva del mismo archivo."));
            return true;
        }
        return false;
    }

    /**
     * Verifica si hay solapamiento interno.
     *
     * @param ctx Contexto actual
     * @param processed Lista de contextos
     * @return true si hay solapamiento interno
     */
    private boolean hasInternalOverlap(ImportContext ctx, List<ImportContext> processed) {
        if (!ctx.isPhysical || ctx.locationName == null || ctx.locationName.isEmpty()) return false;
        
        String[] currentSpaces = ctx.locationName.split(",");
        for (ImportContext prev : processed) {
            // Comprobar solapamiento temporal
            if (ctx.start.isBefore(prev.end) && ctx.end.isAfter(prev.start)) {
                // Comprobar si comparten algún espacio
                String[] prevSpaces = prev.locationName.split(",");
                for (String s1 : currentSpaces) {
                    for (String s2 : prevSpaces) {
                        if (s1.trim().equalsIgnoreCase(s2.trim())) return true;
                    }
                }
            }
        }
        return false;
    }

    /**
     * Resuelve los espacios a partir del nombre.
     *
     * @param locationPath Nombres de espacios
     * @return Conjunto de espacios
     */
    private Set<Space> resolveSpaces(String locationPath) {
        if (locationPath == null || locationPath.isEmpty()) return Collections.emptySet();
        return Arrays.stream(locationPath.split(","))
                .map(String::trim)
                .filter(name -> !name.isEmpty())
                .map(spaceRepository::findByNameIgnoreCase)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toSet());
    }

    /**
     * Construye una reserva.
     *
     * @param ctx Contexto de importación
     * @param owner Propietario
     * @param row Fila del CSV
     * @return Reserva construida
     */
    private Reservation buildReservation(ImportContext ctx, User owner, String[] row) {
        return Reservation.builder()
                .title(row[0].trim())
                .startTime(ctx.start)
                .endTime(ctx.end)
                .status(ReservationStatus.APROBADA)
                .type(ctx.type)
                .description(ctx.description)
                .responsibleName(owner.getName())
                .user(owner)
                .subject(ctx.subject)
                .spaces(ctx.spaces)
                .build();
    }

    /**
     * Valida la estructura de la fila.
     *
     * @param row Fila del CSV
     */
    @Override
    protected void validateRowStructure(String[] row) {
        if (row.length < 7) throw new BusinessValidationException("Faltan columnas (mínimo 7 requeridas).");
    }

    /**
     * Mapea una fila a un contexto de importación.
     *
     * @param row Fila del CSV
     * @return Contexto de importación
     */
    @Override
    protected ImportContext mapRowToEntity(String[] row) {
        try {
            ImportContext ctx = new ImportContext();
            ctx.start = LocalDateTime.of(
                java.time.LocalDate.parse(row[1].trim(), DATE_FORMATTER),
                java.time.LocalTime.parse(row[2].trim(), TIME_FORMATTER)
            );
            ctx.end = LocalDateTime.of(
                java.time.LocalDate.parse(row[3].trim(), DATE_FORMATTER),
                java.time.LocalTime.parse(row[4].trim(), TIME_FORMATTER)
            );

            if (ctx.end.isBefore(ctx.start) || ctx.end.isEqual(ctx.start)) {
                throw new BusinessValidationException("Error de lógica: La fecha de fin debe ser posterior a la de inicio.");
            }

            if (ctx.start.isBefore(LocalDateTime.now())) {
                throw new BusinessValidationException("Error cronológico: No se pueden importar reservas con fecha de inicio en el pasado.");
            }
            
            ctx.description = row[5].trim();
            ctx.locationName = row[6].trim();
            ctx.isPhysical = !ctx.locationName.equalsIgnoreCase("Online") && !ctx.locationName.isEmpty();

            // Columna opcional 7 (Índice 7) para el Tipo de Reserva
            ctx.type = ReservationType.CLASE; // Valor por defecto si no hay columna
            if (row.length > 7 && !row[7].trim().isEmpty()) {
                String typeStr = row[7].trim().toUpperCase();
                try {
                    ctx.type = ReservationType.valueOf(typeStr);
                } catch (IllegalArgumentException e) {
                    throw new BusinessValidationException("El tipo de reserva '" + typeStr + "' no es válido. Valores permitidos: CLASE, EXAMEN, OTRO.");
                }
            }
            
            // VALIDACIÓN DE INTEGRIDAD: Asignatura y Espacios deben existir
            String subjectCode = extractSubjectCode(row[0].trim());
            ctx.subject = subjectRepository.findByCode(subjectCode)
                    .orElseThrow(() -> new BusinessValidationException("La asignatura con código '" + subjectCode + "' no existe en el sistema."));

            if (ctx.isPhysical) {
                ctx.spaces = resolveSpaces(ctx.locationName);
                if (ctx.spaces.isEmpty()) {
                    throw new BusinessValidationException("Dato inválido: No se encontró ninguno de los espacios indicados (" + ctx.locationName + ").");
                }
            }

            return ctx;
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessValidationException("Formato incorrecto en fechas u horas: " + e.getMessage());
        }
    }

    /**
     * Extrae el código de la asignatura.
     *
     * @param raw Cadena sin procesar
     * @return Código de la asignatura
     */
    private String extractSubjectCode(String raw) {
        if (raw == null || raw.isEmpty()) return "";
        return raw.contains(".") ? raw.substring(0, raw.indexOf(".")).trim() : raw.trim();
    }

    /**
     * Crea un DTO de conflicto de importación.
     *
     * @param row Fila
     * @param type Tipo de conflicto
     * @param msg Mensaje
     * @return DTO de conflicto
     */
    private ReservationImportConflictDTO createConflictDTO(String[] row, String type, String msg) {
        return ReservationImportConflictDTO.builder()
                .subjectCode(row[0])
                .startTime(row[1] + " " + row[2])
                .endTime(row[3] + " " + row[4])
                .location(row[6])
                .description(row[5])
                .type(type)
                .message(msg)
                .build();
    }

    /**
     * Contexto de importación de una fila.
     */
    public static class ImportContext {
        /** Fecha de inicio. */
        LocalDateTime start;
        /** Fecha de fin. */
        LocalDateTime end;
        /** Descripción de la reserva. */
        String description;
        /** Nombre de la ubicación. */
        String locationName;
        /** Indica si es física. */
        boolean isPhysical;
        /** Asignatura. */
        Subject subject;
        /** Tipo de reserva. */
        ReservationType type;
        /** Espacios asignados. */
        Set<Space> spaces = new HashSet<>();
    }
}
