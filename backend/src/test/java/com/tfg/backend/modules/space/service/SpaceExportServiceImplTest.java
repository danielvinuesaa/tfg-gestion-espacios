package com.tfg.backend.modules.space.service;

import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el servicio de exportación de espacios {@link SpaceExportServiceImpl}.
 * <p>
 * Verifica que la generación de archivos CSV a partir de la lista de espacios
 * se realice correctamente, respetando el formato, las columnas y los valores.
 */
class SpaceExportServiceImplTest {

    private SpaceExportServiceImpl spaceExportService;
    private Space s1;

    @BeforeEach
    void setUp() {
        spaceExportService = new SpaceExportServiceImpl();
        s1 = Space.builder()
                .name("Lab 1")
                .type(SpaceType.LABORATORIO)
                .totalCapacity(25)
                .status(SpaceStatus.DISPONIBLE)
                .gisId("GIS-100")
                .build();
    }

    /**
     * Verifica que el método de exportación genere correctamente el contenido CSV,
     * incluyendo las cabeceras y los datos del espacio formateados adecuadamente.
     */
    @Test
    void export_ShouldGenerateCsvContent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        spaceExportService.export(out, () -> List.of(s1), List.of("name", "type", "capacity", "status"));

        String csv = out.toString();
        assertTrue(csv.contains("Nombre del Espacio"));
        assertTrue(csv.contains("Lab 1"));
        assertTrue(csv.contains("Laboratorio"));
        assertTrue(csv.contains("Disponible"));
    }

    /**
     * Verifica que el método auxiliar que obtiene los valores de las columnas
     * extraiga y formatee correctamente las propiedades de un espacio.
     */
    @Test
    void getColumnValue_ShouldFormatCorrectly() {
        assertEquals("Lab 1", spaceExportService.getColumnValue("name", s1));
        assertEquals("Laboratorio", spaceExportService.getColumnValue("type", s1));
        assertEquals("25", spaceExportService.getColumnValue("capacity", s1));
        assertEquals("Disponible", spaceExportService.getColumnValue("status", s1));
        assertEquals("GIS-100", spaceExportService.getColumnValue("gisId", s1));
    }
}
