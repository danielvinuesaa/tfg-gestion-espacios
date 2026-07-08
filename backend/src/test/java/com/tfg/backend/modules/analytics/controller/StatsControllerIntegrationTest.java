package com.tfg.backend.modules.analytics.controller;

import com.tfg.backend.BaseIntegrationTest;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Set;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Suite de pruebas de integración para el controlador de estadísticas (StatsController).
 * Verifica que los endpoints que proporcionan información de resumen y actividad reciente
 * devuelvan las métricas esperadas y apliquen la seguridad adecuada.
 */
@DisplayName("Tests de Integración: StatsController (API)")
class StatsControllerIntegrationTest extends BaseIntegrationTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private JwtService jwtService;

    private String userToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        userRepository.deleteAll();
        roleRepository.deleteAll();

        Role userRole = roleRepository.save(Role.builder().name("PROFESOR").permissions(Set.of()).build());
        User user = userRepository.save(User.builder().email("user@test.com").password("pass").name("User").role(userRole).build());
        
        userToken = "Bearer " + jwtService.generateToken(user);
    }

    /**
     * Verifica que un usuario autenticado pueda recuperar las estadísticas generales del sistema,
     * incluyendo los totales, la actividad del periodo y los registros recientes.
     */
    @Test
    @DisplayName("📈 GET /api/stats: Éxito")
    void getDashboardStats_Success() throws Exception {
        mockMvc.perform(get("/api/stats")
                .header("Authorization", userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.systemTotals").exists())
                .andExpect(jsonPath("$.periodActivity.reservationsCount").exists())
                .andExpect(jsonPath("$.recentActivity").isArray());
    }

    /**
     * Verifica que si se intenta acceder a las estadísticas sin proporcionar un token de autenticación válido,
     * el sistema bloquee el acceso retornando un error HTTP 403 Forbidden.
     */
    @Test
    @DisplayName("🚫 GET /api/stats: No autorizado sin token")
    void getDashboardStats_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isForbidden());
    }
}
