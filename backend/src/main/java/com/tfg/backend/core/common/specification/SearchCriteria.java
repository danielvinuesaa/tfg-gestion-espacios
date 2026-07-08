package com.tfg.backend.core.common.specification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Representa un criterio o regla de filtrado individual a ser procesada
 * por el motor de especificaciones dinámicas.
 * <p>
 * Agrupa la clave del campo, la operación relacional a aplicar y el valor
 * contra el que se evaluará.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchCriteria {
    
    /**
     * Nombre del campo o ruta de la propiedad en la entidad (por ejemplo, "status" o "user.id").
     */
    private String key;
    
    /**
     * Operación relacional a aplicar para evaluar la condición.
     */
    private SearchOperation operation;
    
    /**
     * Valor del filtro contra el cual se comparará el campo de la entidad.
     */
    private Object value;
}
