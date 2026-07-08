/**
 * Representa la estructura de datos de una asignatura dentro del sistema académico.
 * 
 * @property id - Identificador único y secuencial de la asignatura.
 * @property code - Código alfanumérico de referencia oficial de la asignatura.
 * @property name - Denominación formal y completa de la asignatura.
 * @property course - Identificación del curso académico o nivel de instrucción al que pertenece la asignatura.
 */
export interface Subject {
    id: number;
    code: string;
    name: string;
    course: string;
}
