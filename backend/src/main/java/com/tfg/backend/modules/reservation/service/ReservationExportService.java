package com.tfg.backend.modules.reservation.service;
import com.tfg.backend.modules.reservation.model.Reservation;

import java.io.OutputStream;
import java.io.IOException;
import java.util.List;
import java.util.function.Supplier;

/**
 * Interfaz que define el contrato para el servicio de exportación de registros de reservas,
 * permitiendo la generación de archivos estructurados y listos para el análisis de datos.
 */
public interface ReservationExportService {
    void export(OutputStream outputStream, Supplier<Iterable<Reservation>> reservationSupplier, List<String> columns) throws IOException;
}
