package com.tfg.backend.modules.reservation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tfg.backend.core.security.JwtService;
import com.tfg.backend.modules.identity.model.Permission;
import com.tfg.backend.modules.identity.model.Role;
import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.repository.PermissionRepository;
import com.tfg.backend.modules.identity.repository.RoleRepository;
import com.tfg.backend.modules.identity.repository.UserRepository;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.reservation.repository.ReservationRepository;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import com.tfg.backend.modules.space.repository.SpaceRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * Test separado sin @Transactional para que los hilos paralelos 
 * puedan ver los datos guardados en la BD real.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
/**
 * Suite de pruebas de integración orientada específicamente a la detección y prevención
 * de condiciones de carrera (Race Conditions) durante el proceso de reserva.
 * Utiliza concurrencia para simular múltiples peticiones simultáneas, garantizando
 * la integridad de los datos a través de bloqueos optimistas o pesimistas en base de datos.
 */
public class ReservationRaceConditionIntegrationTest {

    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PermissionRepository permissionRepository;
    @Autowired private SpaceRepository spaceRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private com.tfg.backend.modules.notification.repository.NotificationRepository notificationRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private String adminToken;
    private Space testSpace;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        cleanUp(); // Asegurar base limpia

        Permission p1 = permissionRepository.save(Permission.builder().name("SOLICITAR_RESERVA").build());
        Permission p2 = permissionRepository.save(Permission.builder().name("APROBAR_RESERVA").build());
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").permissions(Set.of(p1, p2)).build());
        
        User admin = userRepository.save(User.builder()
                .email("admin_race@uniovi.es")
                .name("Admin")
                .password(passwordEncoder.encode("Pass123!"))
                .role(adminRole)
                .status(com.tfg.backend.modules.identity.model.UserStatus.ACTIVO)
                .build());

        adminToken = "Bearer " + jwtService.generateToken(admin);

        testSpace = spaceRepository.save(Space.builder()
                .name("Aula Race")
                .type(SpaceType.AULA)
                .totalCapacity(30)
                .status(SpaceStatus.DISPONIBLE)
                .build());
    }

    @AfterEach
    void cleanUp() {
        notificationRepository.deleteAll();
        reservationRepository.deleteAll();
        spaceRepository.deleteAll();
        userRepository.deleteAll();
        roleRepository.deleteAll();
        permissionRepository.deleteAll();
    }

    /**
     * Verifica que cuando múltiples usuarios intentan reservar exactamente el mismo espacio físico
     * en la misma franja horaria de manera simultánea (milisegundos de diferencia), el sistema aplique
     * correctamente los bloqueos de base de datos, permitiendo que solo una petición tenga éxito y
     * rechazando las demás para prevenir dobles reservas.
     *
     * @throws InterruptedException si ocurre un error durante la sincronización de hilos.
     */
    @Test
    @DisplayName("PI-RES-20: Condición de carrera — solo una petición simultánea puede crear la reserva")
    void concurrentReservation_RaceCondition_OnlyOneSucceeds() throws InterruptedException {
        int numberOfThreads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger created = new AtomicInteger(0);
        AtomicInteger rejected = new AtomicInteger(0);

        LocalDateTime start = LocalDateTime.now().plusDays(14).withHour(10).withMinute(0).withSecond(0).withNano(0);
        if (start.getDayOfWeek() == java.time.DayOfWeek.SATURDAY) {
            start = start.plusDays(2);
        } else if (start.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            start = start.plusDays(1);
        }
        LocalDateTime end = start.plusHours(2);

        ReservationRequest req = ReservationRequest.builder()
                .title("Reserva Concurrente")
                .startTime(start).endTime(end)
                .type(ReservationType.CLASE)
                .spaceIds(List.of(testSpace.getId()))
                .isBlock(false)
                .build();

        for (int i = 0; i < numberOfThreads; i++) {
            executorService.submit(() -> {
                try {
                    readyLatch.countDown();
                    startLatch.await(); // Esperar a que el hilo principal dé la salida

                    int status = mockMvc.perform(post("/api/reservations")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req))
                            .header("Authorization", adminToken))
                            .andReturn().getResponse().getStatus();

                    if (status == 201) {
                        created.incrementAndGet();
                    } else {
                        rejected.incrementAndGet();
                    }
                } catch (Exception e) {
                    rejected.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await(); // Esperar a que los hilos estén listos
        startLatch.countDown(); // Pistoletazo de salida simultáneo
        doneLatch.await(); // Esperar a que terminen

        executorService.shutdown();

        // Solo 1 debe triunfar, el otro debe dar error 400 por solapamiento
        assertEquals(1, created.get(), "Solo 1 hilo debió lograr crear la reserva");
        assertEquals(1, rejected.get(), "El otro hilo debió ser rechazado");
        assertEquals(1, reservationRepository.count(), "Solo debe existir 1 reserva en ese hueco");
    }
}
