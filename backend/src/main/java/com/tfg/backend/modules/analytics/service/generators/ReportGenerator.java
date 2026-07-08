package com.tfg.backend.modules.analytics.service.generators;

import java.io.ByteArrayInputStream;

/**
 * Interfaz genérica que define el contrato estándar para los diferentes motores de generación de informes del sistema.
 * Asegura que todos los generadores proporcionen capacidades tanto de exportación en formato documental (PDF) 
 * como tabular (CSV).
 *
 * @param <T> El tipo de objeto de transferencia de datos (DTO) que encapsula los parámetros específicos de la petición del informe.
 */
public interface ReportGenerator<T> {
    
    /**
     * Procesa la petición y genera un documento PDF profesional.
     *
     * @param request Parámetros y filtros para la generación del informe.
     * @return Flujo de bytes en memoria correspondiente al archivo PDF generado.
     */
    ByteArrayInputStream generatePDF(T request);

    /**
     * Procesa la petición y genera un conjunto de datos en formato CSV.
     *
     * @param request Parámetros y filtros para la generación del informe.
     * @return Cadena de texto con los datos estructurados separados por punto y coma (CSV).
     */
    String generateCSV(T request);
}
