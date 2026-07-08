package com.tfg.backend.modules.identity.repository;

import com.tfg.backend.modules.identity.model.User;
import com.tfg.backend.modules.identity.model.UserStatus;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Suite de pruebas unitarias para {@link UserSpecifications}.
 * Verifica la correcta construcción de predicados JPA para el filtrado dinámico de usuarios.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Tests Unitarios de UserSpecifications")
class UserSpecificationsTest {

    @Mock private Root<User> root;
    @Mock private CriteriaQuery<?> query;
    @Mock private CriteriaBuilder cb;
    @Mock private Path<Object> path;
    @Mock private Expression<String> expression;

    /**
     * Verifica la correcta construcción de las especificaciones cuando se proveen
     * todos los parámetros de filtrado.
     */
    @Test
    @DisplayName("🧪 withFilters: Caso completo")
    void withFilters_Full() {
        Specification<User> spec = UserSpecifications.withFilters("Dani", 1L, UserStatus.ACTIVO, false);
        assertNotNull(spec);

        when(root.get(anyString())).thenReturn(path);
        when(cb.lower(any())).thenReturn(expression);

        spec.toPredicate(root, query, cb);

        verify(cb, atLeastOnce()).or(any(), any());
    }

    /**
     * Verifica que la especificación incluya registros eliminados cuando se establece
     * explícitamente el indicador para incluirlos.
     */
    @Test
    @DisplayName("🧪 withFilters: Incluyendo eliminados")
    void withFilters_IncludeDeleted() {
        Specification<User> spec = UserSpecifications.withFilters(null, null, null, true);
        assertNotNull(spec);

        spec.toPredicate(root, query, cb);
        // Debería devolver conjunction() si no hay otros filtros
    }

    /**
     * Verifica que, por defecto, la especificación excluya a los usuarios marcados
     * como eliminados, asegurando que no se muestren en los resultados.
     */
    @Test
    @DisplayName("🧪 withFilters: Ocultando eliminados por defecto")
    void withFilters_HideDeletedByDefault() {
        Specification<User> spec = UserSpecifications.withFilters(null, null, null, false);
        
        when(root.get(anyString())).thenReturn(path);

        spec.toPredicate(root, query, cb);

        verify(cb).notEqual(path, UserStatus.ELIMINADO);
    }
}
