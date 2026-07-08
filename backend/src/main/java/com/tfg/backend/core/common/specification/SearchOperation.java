package com.tfg.backend.core.common.specification;

/**
 * Enumeración que define las operaciones de búsqueda y filtrado soportadas
 * por el motor genérico de especificaciones basado en Criteria API de JPA.
 */
public enum SearchOperation {
    /** Igualdad estricta */
    EQUAL,
    
    /** Desigualdad */
    NOT_EQUAL,
    
    /** Mayor que (estricto) */
    GREATER_THAN,
    
    /** Menor que (estricto) */
    LESS_THAN,
    
    /** Mayor o igual que */
    GREATER_THAN_EQUAL,
    
    /** Menor o igual que */
    LESS_THAN_EQUAL,
    
    /** Coincidencia parcial con distinción entre mayúsculas y minúsculas (patrón exacto) */
    LIKE,
    
    /** Coincidencia parcial sin distinción de mayúsculas y minúsculas (contiene la cadena) */
    MATCH,
    
    /** Coincidencia parcial al inicio de la cadena sin distinguir mayúsculas */
    MATCH_START,
    
    /** Coincidencia parcial al final de la cadena sin distinguir mayúsculas */
    MATCH_END,
    
    /** Operador relacional IN (pertenece a una colección) */
    IN,
    
    /** Operador relacional NOT IN (no pertenece a una colección) */
    NOT_IN,
    
    /** Comprobación de valor nulo */
    IS_NULL,
    
    /** Comprobación de valor no nulo */
    IS_NOT_NULL,
    
    /** Igualdad aplicando un inner join simple sobre una relación */
    JOIN_EQUAL
}
