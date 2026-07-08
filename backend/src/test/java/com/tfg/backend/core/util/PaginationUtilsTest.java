package com.tfg.backend.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Suite de pruebas unitarias para la utilidad de paginación (PaginationUtils).
 * <p>
 * Verifica que los criterios de ordenación (Sort) se ajusten correctamente,
 * en especial para soportar comparaciones ignorando mayúsculas/minúsculas (case-insensitive)
 * en propiedades simples.
 */
@DisplayName("Tests Unitarios de PaginationUtils")
class PaginationUtilsTest {

    /**
     * Verifica que se aplica la configuración "ignore case" a la ordenación por una propiedad simple.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un objeto {@code Pageable} con ordenación ascendente sobre la propiedad "name".
     * <b>Ejecución:</b> Se invoca la conversión de la paginación a case-insensitive.
     * <b>Asertos:</b> Se comprueba que el criterio de ordenación resultante tiene activada la bandera {@code isIgnoreCase}.
     */
    @Test
    @DisplayName("🧪 ensureCaseInsensitive: Convierte ordenación simple a case-insensitive")
    void ensureCaseInsensitive_SimpleProperty() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("name").ascending());
        Pageable result = PaginationUtils.ensureCaseInsensitive(pageable);

        Sort.Order order = result.getSort().getOrderFor("name");
        assertNotNull(order);
        assertTrue(order.isIgnoreCase());
    }

    /**
     * Verifica que no se aplica la configuración "ignore case" a propiedades anidadas.
     * <p>
     * <b>Precondiciones:</b> Se proporciona un objeto {@code Pageable} con ordenación sobre una propiedad anidada (ej. "role.name").
     * <b>Ejecución:</b> Se invoca la conversión de la paginación a case-insensitive.
     * <b>Asertos:</b> Se comprueba que el criterio de ordenación resultante no tiene activada la bandera {@code isIgnoreCase}, para evitar problemas de compatibilidad con JPA.
     */
    @Test
    @DisplayName("🧪 ensureCaseInsensitive: No aplica ignoreCase a propiedades anidadas")
    void ensureCaseInsensitive_NestedProperty() {
        Pageable pageable = PageRequest.of(0, 10, Sort.by("role.name").ascending());
        Pageable result = PaginationUtils.ensureCaseInsensitive(pageable);

        Sort.Order order = result.getSort().getOrderFor("role.name");
        assertNotNull(order);
        assertFalse(order.isIgnoreCase());
    }

    /**
     * Verifica el comportamiento del utilitario ante objetos de paginación nulos o sin ordenación definida.
     * <p>
     * <b>Precondiciones:</b> Se provee un objeto {@code Pageable} nulo y otro válido pero sin ordenación (unsorted).
     * <b>Ejecución:</b> Se invoca la conversión para ambos casos.
     * <b>Asertos:</b> Se comprueba que retorna {@code null} si el parámetro es nulo y devuelve el mismo objeto si no hay ordenación.
     */
    @Test
    @DisplayName("🧪 ensureCaseInsensitive: Maneja Pageable nulo o sin ordenación")
    void ensureCaseInsensitive_NullOrUnsorted() {
        assertNull(PaginationUtils.ensureCaseInsensitive(null));

        Pageable unsorted = PageRequest.of(0, 10);
        assertSame(unsorted, PaginationUtils.ensureCaseInsensitive(unsorted));
    }
}
