package com.tfg.backend.core.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

/**
 * Objeto de Transferencia de Datos (DTO) genérico para informar sobre los resultados
 * de cualquier proceso de importación masiva.
 * @param <C> Tipo del DTO de conflicto específico para cada entidad.
 */
@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
public class GenericImportResultDTO<C> {
    /**
     * Contador de elementos procesados y actualizados con éxito.
     */
    @Builder.Default
    private int successCount = 0;
    
    /**
     * Contador de elementos nuevos creados durante la importación.
     */
    @Builder.Default
    private int newCount = 0;

    /**
     * Contador de elementos que fallaron al importarse.
     */
    @Builder.Default
    private int failureCount = 0;
    
    /**
     * Lista de mensajes de error detallados ocurridos durante la importación.
     */
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    
    /**
     * Lista de conflictos detectados que requieren atención o resolución por parte del usuario.
     */
    @Builder.Default
    private List<C> conflicts = new ArrayList<>();

    /**
     * Registra un nuevo error y aumenta el contador de fallos.
     *
     * @param error El mensaje de error a registrar.
     */
    public void addError(String error) {
        this.errors.add(error);
        this.failureCount++;
    }

    /**
     * Registra un nuevo conflicto detectado.
     * <p>
     * Nota: No se incrementa el contador de fallos por defecto aquí, ya que un conflicto
     * puede ser informativo para decidir si se desea sobreescribir.
     * </p>
     *
     * @param conflict El conflicto a registrar.
     */
    public void addConflict(C conflict) {
        this.conflicts.add(conflict);
    }

    /**
     * Incrementa el contador de elementos procesados con éxito.
     */
    public void incrementSuccess() {
        this.successCount++;
    }

    /**
     * Incrementa el contador de elementos nuevos creados durante la importación.
     */
    public void incrementNew() {
        this.newCount++;
    }
}
