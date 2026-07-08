package com.tfg.backend.modules.reservation.mapper;

import com.tfg.backend.modules.identity.mapper.RoleMapper;
import com.tfg.backend.modules.identity.mapper.UserMapper;
import com.tfg.backend.modules.reservation.dto.ReservationDTO;
import com.tfg.backend.modules.reservation.dto.ReservationRequest;
import com.tfg.backend.modules.reservation.model.Reservation;
import com.tfg.backend.modules.reservation.model.ReservationStatus;
import com.tfg.backend.modules.reservation.model.ReservationType;
import com.tfg.backend.modules.space.mapper.SpaceMapper;
import com.tfg.backend.modules.space.model.Space;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el mapeador de reservas (ReservationMapper).
 * Verifica la correcta conversión entre entidades de dominio (Reservation) y objetos de transferencia (ReservationDTO y ReservationRequest).
 * Incluye la configuración de mapeadores anidados mediante ReflectionTestUtils.
 */
@DisplayName("Tests Unitarios de ReservationMapper")
class ReservationMapperTest {

    private ReservationMapper reservationMapper;
    private UserMapper userMapper;
    private RoleMapper roleMapper;
    private SpaceMapper spaceMapper;

    @BeforeEach
    void setUp() {
        reservationMapper = Mappers.getMapper(ReservationMapper.class);
        userMapper = Mappers.getMapper(UserMapper.class);
        roleMapper = Mappers.getMapper(RoleMapper.class);
        spaceMapper = Mappers.getMapper(SpaceMapper.class);

        ReflectionTestUtils.setField(userMapper, "roleMapper", roleMapper);
        ReflectionTestUtils.setField(reservationMapper, "userMapper", userMapper);
        ReflectionTestUtils.setField(reservationMapper, "spaceMapper", spaceMapper);
    }

    /**
     * Verifica el mapeo de una entidad Reservation a su correspondiente ReservationDTO,
     * incluyendo las colecciones anidadas como los espacios asociados.
     * Precondiciones: Se inicializa una reserva con un espacio vinculado.
     * Ejecución: Se llama al método toDto del mapper.
     * Aserciones: El DTO resultante no es nulo y los campos (incluidos los espacios) se mapean correctamente.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo completo de reserva")
    void toDto_Success() {
        Space space = Space.builder().id(1L).name("Aula 1").build();
        Reservation res = Reservation.builder()
                .id(100L)
                .title("Clase de Prueba")
                .status(ReservationStatus.APROBADA)
                .type(ReservationType.CLASE)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(2))
                .spaces(Set.of(space))
                .build();

        ReservationDTO dto = reservationMapper.toDto(res);

        assertNotNull(dto);
        assertEquals(res.getId(), dto.getId());
        assertEquals(res.getTitle(), dto.getTitle());
        assertFalse(dto.getSpaces().isEmpty());
        assertEquals("Aula 1", dto.getSpaces().iterator().next().getName());
    }

    /**
     * Verifica el mapeo de un ReservationRequest a una entidad Reservation.
     * Precondiciones: Se inicializa un ReservationRequest con datos básicos de solicitud.
     * Ejecución: Se llama al método toEntity del mapper.
     * Aserciones: La entidad resultante tiene los campos básicos mapeados. El ID debe ser nulo y los espacios deben estar vacíos
     * ya que la resolución de IDs a entidades se realiza a nivel de servicio.
     */
    @Test
    @DisplayName("✅ toEntity: Mapeo de solicitud a entidad (campos básicos)")
    void toEntity_Success() {
        ReservationRequest request = ReservationRequest.builder()
                .title("Nueva Reserva")
                .type(ReservationType.OTRO)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusHours(1))
                .spaceIds(List.of(1L))
                .build();

        Reservation entity = reservationMapper.toEntity(request);

        assertNotNull(entity);
        assertEquals(request.getTitle(), entity.getTitle());
        assertEquals(request.getType(), entity.getType());
        assertNull(entity.getId());
        assertTrue(entity.getSpaces().isEmpty()); // Ignorado por el mapper, se resuelve en servicio
    }

    /**
     * Verifica que el mapper maneje correctamente las entradas nulas para evitar NullPointerException.
     * Precondiciones: Ninguna.
     * Ejecución: Se llama al método toDto pasando un valor null.
     * Aserciones: Se espera que el método devuelva null de forma segura.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(reservationMapper.toDto(null));
    }
}
