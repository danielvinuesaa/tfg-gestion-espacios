package com.tfg.backend.core.common.specification;

import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para la clase GenericSpecification.
 * <p>
 * Verifica que el motor de criterios JPA construya correctamente los predicados
 * basándose en los diferentes operadores de búsqueda (EQUAL, MATCH, IN, JOIN_EQUAL).
 * Se utilizan mocks de los elementos de JPA Criteria API (Root, CriteriaQuery, CriteriaBuilder).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de GenericSpecification (Motor JPA)")
class GenericSpecificationTest {

    @Mock private Root<Object> root;
    @Mock private CriteriaQuery<?> query;
    @Mock private CriteriaBuilder cb;
    @Mock private Path<Object> path;
    @Mock private Join<Object, Object> join;

    /**
     * Verifica que el operador EQUAL genera correctamente un predicado de igualdad en JPA.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un criterio de búsqueda con el operador EQUAL y un valor específico.
     * <b>Ejecución:</b> Se llama al método {@code toPredicate} de la especificación.
     * <b>Asertos:</b> Se comprueba que se invoca {@code cb.equal} con la ruta y el valor correctos.
     */
    @Test
    @DisplayName("🧪 EQUAL: Llama a cb.equal")
    void toPredicate_Equal() {
        SearchCriteria criteria = new SearchCriteria("name", SearchOperation.EQUAL, "Dani");
        GenericSpecification<Object> spec = new GenericSpecification<>(criteria);

        when(root.get("name")).thenReturn(path);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(path, "Dani");
    }

    /**
     * Verifica que el operador MATCH genera correctamente un predicado de tipo LIKE con conversión a minúsculas en JPA.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un criterio de búsqueda con el operador MATCH y un valor de texto parcial.
     * <b>Ejecución:</b> Se llama al método {@code toPredicate} de la especificación.
     * <b>Asertos:</b> Se comprueba que se invoca {@code cb.like} envolviendo el valor entre porcentajes (%valor%).
     */
    @Test
    @DisplayName("🧪 MATCH: Llama a cb.like con lower")
    void toPredicate_Match() {
        SearchCriteria criteria = new SearchCriteria("name", SearchOperation.MATCH, "abc");
        GenericSpecification<Object> spec = new GenericSpecification<>(criteria);

        when(root.get("name")).thenReturn(path);
        when(cb.lower(any())).thenReturn(null); // Simple verification

        spec.toPredicate(root, query, cb);

        verify(cb).like(any(), eq("%abc%"));
    }

    /**
     * Verifica que el operador IN genera correctamente un predicado de inclusión en JPA para colecciones.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un criterio de búsqueda con el operador IN y una lista de valores (ej. IDs).
     * <b>Ejecución:</b> Se llama al método {@code toPredicate} de la especificación.
     * <b>Asertos:</b> Se comprueba que se invoca el método {@code in} de la ruta (Path) con la lista proporcionada.
     */
    @Test
    @DisplayName("🧪 IN: Maneja colecciones")
    void toPredicate_In() {
        List<Long> ids = List.of(1L, 2L);
        SearchCriteria criteria = new SearchCriteria("id", SearchOperation.IN, ids);
        GenericSpecification<Object> spec = new GenericSpecification<>(criteria);

        when(root.get("id")).thenReturn(path);

        spec.toPredicate(root, query, cb);

        verify(path).in(ids);
    }

    /**
     * Verifica que el operador JOIN_EQUAL genera correctamente un predicado de igualdad utilizando JOIN para entidades relacionadas.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un criterio de búsqueda con el operador JOIN_EQUAL y una ruta anidada (ej. "user.email").
     * <b>Ejecución:</b> Se llama al método {@code toPredicate} de la especificación simulando la estructura del objeto relacionado.
     * <b>Asertos:</b> Se comprueba que se invoca {@code cb.equal} sobre la ruta resultante del JOIN con el valor esperado.
     */
    @Test
    @DisplayName("🧪 JOIN_EQUAL: Maneja rutas anidadas con join")
    void toPredicate_JoinEqual() {
        SearchCriteria criteria = new SearchCriteria("user.email", SearchOperation.JOIN_EQUAL, "test@es");
        GenericSpecification<Object> spec = new GenericSpecification<>(criteria);

        // getPath will call root.get("user") then get("email")
        when(root.get("user")).thenReturn(path);
        when(path.get("email")).thenReturn(path); // Mocking deep path

        when(root.join("user")).thenReturn(join);
        when(join.get("email")).thenReturn(path);

        spec.toPredicate(root, query, cb);

        verify(cb).equal(path, "test@es");
    }
}
