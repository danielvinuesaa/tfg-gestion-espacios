package com.tfg.backend.modules.analytics.service;

import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.analytics.service.generators.OccupancyReportGenerator;
import com.tfg.backend.modules.analytics.service.generators.SignatureReportGenerator;
import com.tfg.backend.modules.analytics.service.generators.SubjectUsageReportGenerator;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import com.tfg.backend.modules.reservation.mapper.ReservationMapper;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio responsable de la orquestación y generación de informes del sistema.
 * Coordina la extracción de datos de reservas, espacios y asignaturas para crear
 * documentos PDF o CSV detallados según las peticiones de los usuarios.
 */
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    /**
     * Repositorio para la interacción y consulta de reservas.
     */
    private final ReservationRepository reservationRepository;

    /**
     * Componente generador del reporte de partes de firmas.
     */
    private final SignatureReportGenerator signatureReportGenerator;

    /**
     * Componente generador del reporte de uso por asignaturas.
     */
    private final SubjectUsageReportGenerator subjectUsageReportGenerator;

    /**
     * Componente generador del reporte de ocupación de espacios.
     */
    private final OccupancyReportGenerator occupancyReportGenerator;

    /**
     * Conversor para transformar las entidades de reserva en DTOs.
     */
    private final ReservationMapper reservationMapper;

    /**
     * Genera un informe en formato PDF que contiene los registros de firmas u hojas de asistencia.
     *
     * @param request Parámetros y filtros necesarios para la generación del informe.
     * @return Un flujo de entrada de bytes correspondiente al documento PDF generado.
     */
    @Override
    public ByteArrayInputStream generateSignatureLogs(SignatureLogRequest request) {
        return signatureReportGenerator.generatePDF(request);
    }

    /**
     * Genera un informe en formato CSV con los registros de firmas u hojas de asistencia.
     *
     * @param request Parámetros y filtros necesarios para la generación del informe.
     * @return Una cadena de texto con el contenido en formato CSV.
     */
    @Override
    public String generateSignatureLogsCSV(SignatureLogRequest request) {
        return signatureReportGenerator.generateCSV(request);
    }

    /**
     * Genera un informe en formato PDF relativo al uso de los espacios por parte de las asignaturas.
     *
     * @param request Parámetros y filtros para determinar qué uso de asignaturas incluir.
     * @return Un flujo de entrada de bytes del documento PDF resultante.
     */
    @Override
    public ByteArrayInputStream generateSubjectUsagePDF(SubjectUsageRequest request) {
        return subjectUsageReportGenerator.generatePDF(request);
    }

    /**
     * Genera un informe en formato CSV detallando el uso de los espacios por parte de las asignaturas.
     *
     * @param request Parámetros y filtros para determinar qué datos incluir.
     * @return Una cadena de texto con el contenido en formato CSV.
     */
    @Override
    public String generateSubjectUsageCSV(SubjectUsageRequest request) {
        return subjectUsageReportGenerator.generateCSV(request);
    }

    /**
     * Genera un informe de ocupación en formato PDF, detallando el nivel de uso de los espacios.
     *
     * @param request Parámetros y filtros temporales y de espacios para el cálculo de la ocupación.
     * @return Un flujo de entrada de bytes del documento PDF generado.
     */
    @Override
    public ByteArrayInputStream generateOccupancyPDF(OccupancyRequest request) {
        return occupancyReportGenerator.generatePDF(request);
    }

    /**
     * Genera un informe de ocupación en formato CSV.
     *
     * @param request Parámetros y filtros temporales para la generación de la ocupación.
     * @return Una cadena de texto con los datos de ocupación estructurados en CSV.
     */
    @Override
    public String generateOccupancyCSV(OccupancyRequest request) {
        return occupancyReportGenerator.generateCSV(request);
    }

    /**
     * Filtra y devuelve los identificadores de aquellos espacios que no tienen reservas aprobadas
     * que se solapen con el intervalo de tiempo especificado.
     *
     * @param spaceIds Lista de identificadores de espacios a verificar.
     * @param start Fecha y hora de inicio del periodo.
     * @param end Fecha y hora de fin del periodo.
     * @return Una lista de identificadores de espacios que están libres en el rango dado.
     */
    @Override
    public List<Long> getEmptySpaceIds(List<Long> spaceIds, LocalDateTime start, LocalDateTime end) {
        List<Reservation> reservations = getApprovedReservationsForSpaces(spaceIds, start, end);
        List<Long> busyIds = reservations.stream()
                .flatMap(r -> r.getSpaces().stream()).map(Space::getId).distinct().toList();
        return spaceIds.stream().filter(id -> !busyIds.contains(id)).collect(Collectors.toList());
    }

    /**
     * Filtra y devuelve los identificadores de aquellas asignaturas que no tienen reservas aprobadas
     * de un tipo específico durante el intervalo de tiempo dado.
     *
     * @param subjectIds Lista de identificadores de asignaturas a evaluar.
     * @param types Tipos de reservas a considerar en la validación.
     * @param start Fecha y hora de inicio.
     * @param end Fecha y hora de finalización.
     * @return Lista de identificadores de asignaturas sin reservas en ese periodo.
     */
    @Override
    public List<Long> getEmptySubjectIds(List<Long> subjectIds, List<ReservationType> types, LocalDateTime start, LocalDateTime end) {
        return subjectIds.stream().filter(id -> {
            List<ReservationDTO> res = getApprovedReservationsBySubject(id, start, end);
            if (types != null && !types.isEmpty()) {
                res = res.stream().filter(r -> types.contains(r.getType())).collect(Collectors.toList());
            }
            return res.isEmpty();
        }).collect(Collectors.toList());
    }

    /**
     * Obtiene una lista de reservas aprobadas para una asignatura concreta dentro de un periodo de tiempo.
     *
     * @param id Identificador de la asignatura.
     * @param s Fecha y hora de inicio del periodo.
     * @param e Fecha y hora de finalización del periodo.
     * @return Lista de objetos de transferencia de datos (DTO) con la información de las reservas.
     */
    @Override
    public List<ReservationDTO> getApprovedReservationsBySubject(Long id, LocalDateTime s, LocalDateTime e) {
        return reservationRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReservationStatus.APROBADA)
                .filter(r -> r.getSubject() != null && r.getSubject().getId().equals(id))
                .filter(r -> !r.getStartTime().isBefore(s) && !r.getStartTime().isAfter(e))
                .sorted(Comparator.comparing(Reservation::getStartTime))
                .map(reservationMapper::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Recupera las reservas en estado aprobado asociadas a una serie de espacios y en un marco temporal específico.
     *
     * @param ids Lista de identificadores de espacios a buscar.
     * @param s Fecha y hora de inicio del intervalo de búsqueda.
     * @param e Fecha y hora de fin del intervalo de búsqueda.
     * @return Lista de reservas ordenadas cronológicamente por su fecha de inicio.
     */
    @Override
    public List<Reservation> getApprovedReservationsForSpaces(List<Long> ids, LocalDateTime s, LocalDateTime e) {
        return reservationRepository.findAll().stream()
                .filter(r -> r.getStatus() == ReservationStatus.APROBADA)
                .filter(r -> !r.getStartTime().isBefore(s) && !r.getStartTime().isAfter(e))
                .filter(r -> r.getSpaces().stream().anyMatch(sp -> ids.contains(sp.getId())))
                .sorted(Comparator.comparing(Reservation::getStartTime)).collect(Collectors.toList());
    }
}
