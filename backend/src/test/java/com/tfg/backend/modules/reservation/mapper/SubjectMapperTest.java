package com.tfg.backend.modules.reservation.mapper;

import com.tfg.backend.modules.reservation.dto.SubjectDTO;
import com.tfg.backend.modules.reservation.model.Subject;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para el mapeador de asignaturas (SubjectMapper).
 * Verifica la correcta conversión entre entidades de dominio (Subject) y objetos de transferencia (SubjectDTO).
 */
@DisplayName("Tests Unitarios de SubjectMapper")
class SubjectMapperTest {

    private final SubjectMapper mapper = Mappers.getMapper(SubjectMapper.class);

    /**
     * Verifica el mapeo de una entidad Subject individual a su correspondiente SubjectDTO.
     * Precondiciones: Se inicializa un objeto Subject con datos básicos.
     * Ejecución: Se llama al método toDto del mapper.
     * Aserciones: El DTO resultante no es nulo y sus campos coinciden con los de la entidad original.
     */
    @Test
    @DisplayName("✅ toDto: Mapeo básico")
    void toDto_Success() {
        Subject s = Subject.builder().id(1L).code("S1").name("Math").course("1").build();
        SubjectDTO dto = mapper.toDto(s);

        assertNotNull(dto);
        assertEquals("S1", dto.getCode());
        assertEquals("Math", dto.getName());
    }

    /**
     * Verifica el mapeo de una lista de entidades Subject a una lista de SubjectDTO.
     * Precondiciones: Se inicializa una lista con múltiples entidades Subject.
     * Ejecución: Se llama al método toDtoList del mapper.
     * Aserciones: La lista resultante tiene el mismo tamaño y los elementos se mapean correctamente en orden.
     */
    @Test
    @DisplayName("✅ toDtoList: Mapeo de colecciones")
    void toDtoList_Success() {
        Subject s1 = Subject.builder().id(1L).code("S1").build();
        Subject s2 = Subject.builder().id(2L).code("S2").build();
        
        List<SubjectDTO> dtos = mapper.toDtoList(List.of(s1, s2));

        assertEquals(2, dtos.size());
        assertEquals("S1", dtos.get(0).getCode());
    }

    /**
     * Verifica que el mapper maneje correctamente entradas nulas para evitar NullPointerException.
     * Precondiciones: Ninguna.
     * Ejecución: Se llama al método toDto pasando un valor null.
     * Aserciones: Se espera que el método devuelva null de forma segura.
     */
    @Test
    @DisplayName("🧪 toDto: Maneja nulos")
    void toDto_Null() {
        assertNull(mapper.toDto(null));
    }
}
