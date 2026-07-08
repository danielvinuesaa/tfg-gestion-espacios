package com.tfg.backend.core.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

import java.util.Arrays;
import java.util.List;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Suite de pruebas unitarias para la utilidad de operaciones en bloque (BulkOperationUtils).
 * <p>
 * Verifica el mecanismo de resolución de identificadores para operaciones masivas, validando el
 * uso de listas explícitas de IDs o el uso de un suministrador (supplier) para obtenerlos dinámicamente.
 */
@DisplayName("Tests Unitarios de BulkOperationUtils")
class BulkOperationUtilsTest {

    /**
     * Verifica que se devuelven los identificadores explícitos cuando estos son proporcionados en la llamada.
     * <p>
     * <b>Precondiciones:</b> Se provee una lista con IDs explícitos (ej. 1, 2, 3).
     * <b>Ejecución:</b> Se llama al método {@code resolveIds} pasando la lista explícita.
     * <b>Asertos:</b> Se comprueba que el resultado es exactamente la misma lista de IDs proporcionada.
     */
    @Test
    @DisplayName("🧪 resolveIds: Usa IDs explícitos si se proporcionan")
    void resolveIds_ExplicitIds() {
        List<Long> explicitIds = Arrays.asList(1L, 2L, 3L);
        List<Long> result = BulkOperationUtils.resolveIds(explicitIds, () -> Page.empty(), (String s) -> 0L);

        assertEquals(explicitIds, result);
    }

    /**
     * Verifica que se resuelve correctamente la lista de identificadores utilizando un suministrador (supplier) cuando no se dan IDs explícitos.
     * <p>
     * <b>Precondiciones:</b> Se pasa una lista nula de IDs explícitos y un {@code Supplier} que devuelve una página de elementos.
     * <b>Ejecución:</b> Se invoca {@code resolveIds} extrayendo los IDs a partir de la función mapeadora.
     * <b>Asertos:</b> Se comprueba que el resultado contiene los identificadores derivados correctamente de los elementos del suministrador.
     */
    @Test
    @DisplayName("🧪 resolveIds: Usa searchSupplier si no hay IDs explícitos")
    void resolveIds_FromSupplier() {
        Supplier<Page<String>> supplier = () -> new PageImpl<>(Arrays.asList("A", "B"));
        List<Long> result = BulkOperationUtils.resolveIds(null, supplier, s -> (long) s.charAt(0));

        assertEquals(Arrays.asList(65L, 66L), result);
    }

    /**
     * Verifica que se resuelve correctamente la lista de identificadores utilizando el suministrador cuando se pasa una lista vacía.
     * <p>
     * <b>Precondiciones:</b> Se provee una lista vacía de IDs y un {@code Supplier} que proporciona datos.
     * <b>Ejecución:</b> Se llama a {@code resolveIds}.
     * <b>Asertos:</b> Se comprueba que se ignoran los IDs vacíos y se extraen los identificadores generados por el suministrador.
     */
    @Test
    @DisplayName("🧪 resolveIds: Maneja lista de IDs vacía usando supplier")
    void resolveIds_EmptyListFromSupplier() {
        Supplier<Page<String>> supplier = () -> new PageImpl<>(Arrays.asList("C"));
        List<Long> result = BulkOperationUtils.resolveIds(Arrays.asList(), supplier, s -> (long) s.charAt(0));

        assertEquals(Arrays.asList(67L), result);
    }
}
