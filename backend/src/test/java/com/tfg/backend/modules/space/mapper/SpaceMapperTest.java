package com.tfg.backend.modules.space.mapper;

import com.tfg.backend.modules.space.dto.SpaceDTO;
import com.tfg.backend.modules.space.dto.SpaceRequest;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.space.model.SpaceStatus;
import com.tfg.backend.modules.space.model.SpaceType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el mapeador de espacios {@link SpaceMapper}.
 * <p>
 * Verifica la correcta conversión entre entidades de dominio, DTOs y objetos
 * de solicitud (Request), asegurando la transferencia íntegra de datos.
 */
@DisplayName("Tests Unitarios de SpaceMapper")
class SpaceMapperTest {

    private SpaceMapper spaceMapper;

    @BeforeEach
    void setUp() {
        spaceMapper = Mappers.getMapper(SpaceMapper.class);
    }

    /**
     * Verifica que la conversión de una entidad Space a SpaceDTO preserve
     * correctamente todos los valores fundamentales.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo básico de espacio")
    void toDto_Success() {
        Space space = Space.builder()
                .id(1L)
                .name("Aula 1")
                .type(SpaceType.AULA)
                .status(SpaceStatus.DISPONIBLE)
                .totalCapacity(30)
                .build();

        SpaceDTO dto = spaceMapper.toDto(space);

        assertNotNull(dto);
        assertEquals(space.getId(), dto.getId());
        assertEquals(space.getName(), dto.getName());
        assertEquals(space.getType(), dto.getType());
    }

    /**
     * Verifica que una lista de entidades Space se mapee exitosamente a
     * una lista de objetos SpaceDTO conservando su orden y datos.
     */
    @Test
    @DisplayName("✅ toDtoList: Mapeo de lista de espacios")
    void toDtoList_Success() {
        Space s1 = Space.builder().id(1L).name("S1").build();
        Space s2 = Space.builder().id(2L).name("S2").build();

        List<SpaceDTO> dtos = spaceMapper.toDtoList(List.of(s1, s2));

        assertEquals(2, dtos.size());
        assertEquals("S1", dtos.get(0).getName());
        assertEquals("S2", dtos.get(1).getName());
    }

    /**
     * Verifica que la conversión de una solicitud SpaceRequest a la entidad
     * Space de dominio asigne los campos adecuadamente y deje el ID nulo.
     */
    @Test
    @DisplayName("✅ toEntity: Mapeo de solicitud a entidad")
    void toEntity_Success() {
        SpaceRequest request = new SpaceRequest();
        request.setName("New Space");
        request.setType(SpaceType.AULA);
        request.setTotalCapacity(20);

        Space entity = spaceMapper.toEntity(request);

        assertNotNull(entity);
        assertEquals("New Space", entity.getName());
        assertEquals(SpaceType.AULA, entity.getType());
        assertNull(entity.getId());
    }

    /**
     * Verifica que el mapeador maneje de forma segura los valores nulos,
     * devolviendo nulo cuando se le pasa una entidad inexistente.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(spaceMapper.toDto(null));
    }
}
