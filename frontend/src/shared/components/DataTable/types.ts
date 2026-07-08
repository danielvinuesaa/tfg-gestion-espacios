import React from 'react';
import { TableRow } from '@mui/material';

/**
 * Interfaz que define la estructura y el comportamiento visual de una columna en la tabla.
 * 
 * @typeParam T - El tipo de entidad de datos asociado.
 */
export interface Column<T> {
    /** Identificador único de la columna, generalmente alineado con la propiedad del objeto de datos. */
    id: string;
    /** El texto a mostrar en el encabezado de la columna. */
    label: string;
    /** La alineación horizontal del contenido de las celdas en la columna. */
    align?: 'left' | 'right' | 'center';
    /** Determina si la columna permite la ordenación de los datos. */
    sortable?: boolean;
    /** La anchura recomendada o forzada para la columna. */
    width?: string | number;
    /** 
     * Función de renderizado personalizado para el contenido de la celda.
     * 
     * @param item - La instancia de datos de la fila actual.
     * @returns Un nodo de React válido para ser incrustado en la celda.
     */
    render?: (item: T) => React.ReactNode;
}

/**
 * Interfaz que agrupa las propiedades de configuración relacionadas con la ordenación de la tabla.
 */
export interface DataTableSortConfig {
    /** El identificador de la columna por la cual los datos se encuentran ordenados actualmente. */
    orderBy?: string;
    /** La dirección de la ordenación actual ('asc' para ascendente o 'desc' para descendente). */
    orderDirection?: 'asc' | 'desc';
    /** 
     * Función callback desencadenada al solicitar un cambio en la ordenación por parte del usuario.
     * 
     * @param property - El identificador de la columna seleccionada para el ordenamiento.
     */
    onSort?: (property: string) => void;
}

/**
 * Interfaz que define las propiedades y funciones necesarias para la selección de elementos en la tabla.
 * 
 * @typeParam T - El tipo de la entidad de datos manejada en el conjunto seleccionado.
 */
export interface DataTableSelectionConfig<T> {
    /** Lista de identificadores de los elementos que se encuentran actualmente seleccionados. */
    selectedIds?: (string | number)[];
    /** 
     * Callback invocado al seleccionar o deseleccionar un elemento de manera individual.
     * 
     * @param id - El identificador del elemento que ha modificado su estado de selección.
     */
    onSelectOne?: (id: string | number) => void;
    /** 
     * Callback invocado al activar la selección o deselección de todos los elementos visibles.
     * 
     * @param ids - Un conjunto con los identificadores que resultan de la operación de selección global.
     */
    onSelectAll?: (ids: (string | number)[]) => void;
    /** 
     * Función de evaluación para validar si un elemento específico permite la selección.
     * 
     * @param item - La instancia de datos a evaluar.
     * @returns Verdadero si se permite su selección.
     */
    isSelectable?: (item: T) => boolean;
}

/**
 * Interfaz que compendia la configuración del motor de paginación integrado.
 */
export interface DataTablePaginationConfig {
    /** El índice (basado en cero) de la página actualmente visualizada. */
    page?: number;
    /** El número máximo de filas mostradas por página. */
    rowsPerPage?: number;
    /** La cantidad total y absoluta de elementos en el conjunto global de datos. */
    totalElements?: number;
    /** 
     * Callback invocado al transitar hacia una página diferente.
     * 
     * @param newPage - El nuevo índice de página solicitado por el usuario.
     */
    onPageChange?: (newPage: number) => void;
    /** 
     * Callback ejecutado al ajustar la cantidad de filas a mostrar por página.
     * 
     * @param newRowsPerPage - El número solicitado de filas por vista.
     */
    onRowsPerPageChange?: (newRowsPerPage: number) => void;
}

/**
 * Interfaz destinada a configurar propiedades adicionales y de interacción a nivel de fila individual.
 * 
 * @typeParam T - El tipo de entidad representada en cada fila.
 */
export interface DataTableRowConfig<T> {
    /** 
     * Callback que se ejecuta ante la interacción (clic) sobre el cuerpo de una fila.
     * 
     * @param item - El elemento que nutre la fila interactuada.
     */
    onRowClick?: (item: T) => void;
    /** 
     * Función delegada para obtener y aplicar propiedades de componente de nivel inferior a la fila (TableRow).
     * 
     * @param item - El elemento que provee el contexto para derivar propiedades a inyectar en la fila.
     * @returns Un objeto de propiedades compatibles con el componente encapsulador de la fila.
     */
    getRowProps?: (item: T) => Partial<React.ComponentProps<typeof TableRow>>;
}
