package com.tfg.backend.modules.identity.service;

import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para {@link UserExportServiceImpl}.
 * Verifica la correcta exportación de los datos de los usuarios a formato CSV,
 * asegurando el formato adecuado de las columnas y la codificación.
 */
class UserExportServiceImplTest {

    private UserExportServiceImpl userExportService;
    private User u1;

    @BeforeEach
    void setUp() {
        userExportService = new UserExportServiceImpl();
        u1 = User.builder()
                .name("Dani Test")
                .email("dani@uniovi.es")
                .role(Role.builder().name("ADMIN").build())
                .status(UserStatus.ACTIVO)
                .build();
    }

    /**
     * Verifica que el servicio genere correctamente el contenido CSV
     * para una lista de usuarios dada y unas columnas especificadas.
     * @throws IOException Si ocurre un error al escribir en el flujo de salida.
     */
    @Test
    void export_ShouldGenerateCsvContent() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        userExportService.export(out, () -> List.of(u1), List.of("name", "email", "role", "status"));

        String csv = out.toString();
        assertTrue(csv.contains("Nombre Completo"));
        assertTrue(csv.contains("dani@uniovi.es"));
        assertTrue(csv.contains("ADMIN"));
        assertTrue(csv.contains("Activo"));
    }

    /**
     * Verifica que cada valor de las columnas de un usuario se formatee correctamente
     * como texto antes de ser exportado.
     */
    @Test
    void getColumnValue_ShouldFormatCorrectly() {
        assertEquals("Dani Test", userExportService.getColumnValue("name", u1));
        assertEquals("dani@uniovi.es", userExportService.getColumnValue("email", u1));
        assertEquals("ADMIN", userExportService.getColumnValue("role", u1));
        assertEquals("Activo", userExportService.getColumnValue("status", u1));
    }
}
