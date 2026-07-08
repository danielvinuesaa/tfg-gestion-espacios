package com.tfg.backend.core.audit;
import com.tfg.backend.modules.space.model.Space;
import com.tfg.backend.modules.identity.model.User;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Anotación utilizada para marcar aquellos métodos cuya ejecución requiere ser auditada de forma automática.
 * El aspecto interceptor evaluará la finalización exitosa del método y procederá a registrar la acción.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    /**
     * Especifica el nombre de la entidad afectada por la acción (por ejemplo, "User", "Space").
     *
     * @return El nombre de la entidad.
     */
    String entity();

    /**
     * Define la acción específica que se está realizando sobre la entidad (por ejemplo, "CREATE", "UPDATE", "DELETE").
     *
     * @return El nombre de la acción.
     */
    String action();

    /**
     * Indica si el proceso de auditoría debe intentar extraer de forma automática el identificador de la entidad 
     * a partir de los argumentos proporcionados al método o del objeto devuelto.
     *
     * @return {@code true} para incluir la extracción del ID, {@code false} en caso contrario. El valor por defecto es {@code true}.
     */
    boolean includeId() default true;
}
