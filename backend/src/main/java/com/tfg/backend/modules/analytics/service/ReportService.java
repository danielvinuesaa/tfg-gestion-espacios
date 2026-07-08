package com.tfg.backend.modules.analytics.service;
import com.tfg.backend.modules.analytics.dto.OccupancyRequest;
import com.tfg.backend.modules.analytics.dto.SignatureLogRequest;
import com.tfg.backend.modules.reservation.dto.SubjectUsageRequest;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationType;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Interfaz de servicio que define el contrato para la generación, gestión y recuperación
 * de informes analíticos y estadísticos (ocupación, uso de recursos, firmas).
 * Proporciona métodos para obtener documentos en formatos estándar (PDF, CSV) así como
 * consultas avanzadas de datos consolidados para su presentación.
 */
public interface ReportService {
    ByteArrayInputStream generateSignatureLogs(SignatureLogRequest request);
    String generateSignatureLogsCSV(SignatureLogRequest request);
    ByteArrayInputStream generateSubjectUsagePDF(SubjectUsageRequest request);
    String generateSubjectUsageCSV(SubjectUsageRequest request);
    ByteArrayInputStream generateOccupancyPDF(OccupancyRequest request);
    String generateOccupancyCSV(OccupancyRequest request);
    List<ReservationDTO> getApprovedReservationsBySubject(Long subjectId, LocalDateTime start, LocalDateTime end);
    List<Reservation> getApprovedReservationsForSpaces(List<Long> spaceIds, LocalDateTime start, LocalDateTime end);
    List<Long> getEmptySpaceIds(List<Long> spaceIds, LocalDateTime start, LocalDateTime end);
    List<Long> getEmptySubjectIds(List<Long> subjectIds, List<ReservationType> types, LocalDateTime start, LocalDateTime end);
}
