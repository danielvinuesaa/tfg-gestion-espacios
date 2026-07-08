import React, { useImperativeHandle, forwardRef } from 'react';
import DataTable from './DataTable';
import { useResource, type ResourceOptions } from '../../hooks/useResource';
import type { Column } from './types';

/**
 * Interfaz que define las propiedades requeridas para el componente ResourceTable.
 * 
 * @typeParam T - El tipo de la entidad de datos que maneja la tabla.
 */
interface ResourceTableProps<T> {
    /** La URL de la API que se utilizará para obtener los datos. */
    resourceUrl: string;
    /** Definición y configuración de las columnas que se mostrarán en la tabla. */
    columns: Column<T>[];
    /** La clave única para identificar de manera inequívoca cada fila (por ejemplo, el ID). */
    uniqueKey: keyof T;
    /** Opciones de configuración iniciales para el recurso (filtros, ordenamiento, etc.). */
    resourceOptions?: ResourceOptions;
    
    /** 
     * Función de evaluación para determinar si un elemento específico puede ser seleccionado.
     * 
     * @param item - El elemento de la fila a evaluar.
     * @returns `true` si el elemento es seleccionable, `false` en caso contrario.
     */
    isSelectable?: (item: T) => boolean;
    /** Arreglo que contiene los identificadores de los elementos actualmente seleccionados. */
    selectedIds?: (string | number)[];
    /**
     * Callback invocado al seleccionar o deseleccionar un elemento individual.
     * 
     * @param id - El identificador del elemento que ha cambiado su estado de selección.
     */
    onSelectOne?: (id: string | number) => void;
    /**
     * Callback invocado al realizar una selección o deselección global (todos los elementos).
     * 
     * @param ids - Arreglo con los identificadores de los elementos afectados por la selección masiva.
     */
    onSelectAll?: (ids: (string | number)[]) => void;
    /**
     * Callback invocado al hacer clic sobre una fila completa.
     * 
     * @param item - El elemento de datos que representa a la fila seleccionada.
     */
    onRowClick?: (item: T) => void;
    /** Componente o elemento visual a mostrar cuando la tabla se encuentre vacía. */
    emptyIcon?: React.ReactNode;
    /** Mensaje de texto descriptivo a mostrar cuando la tabla carezca de resultados. */
    emptyMessage?: string;
    /**
     * Función empleada para proveer propiedades adicionales al componente subyacente de la fila.
     * 
     * @param item - El elemento de la fila sobre la que se calcularán las propiedades.
     * @returns Un objeto conteniendo las propiedades adicionales que se inyectarán en la fila.
     */
    getRowProps?: (item: T) => any;
}

/**
 * Interfaz que expone de manera imperativa los métodos del recurso al componente padre.
 * Permite controlar internamente la tabla desde fuera de su contexto inmediato.
 */
export interface ResourceTableHandle {
    /** Método para forzar una actualización y recargar los datos desde el servidor. */
    refresh: () => void;
    /**
     * Método para aplicar o actualizar los filtros de búsqueda sobre el conjunto de datos.
     * 
     * @param filters - Objeto con los pares clave-valor que representan los nuevos filtros a aplicar.
     */
    setFilters: (filters: Record<string, any>) => void;
}

/**
 * Componente avanzado de tabla para la gestión de recursos de forma autónoma.
 * Administra internamente el estado de la carga de datos, la paginación y la ordenación
 * en función de una URL y opciones de configuración proporcionadas.
 * 
 * @typeParam T - El tipo de la entidad de datos que maneja la tabla.
 * @param props - Propiedades requeridas y opcionales para la configuración de la tabla.
 * @param ref - Referencia reactiva para acceder imperativamente a los métodos del `ResourceTableHandle`.
 * @returns Elemento de React que encapsula la lógica y la interfaz visual de la tabla.
 */
function ResourceTableInner<T>(
    {
        resourceUrl,
        columns,
        uniqueKey,
        resourceOptions,
        isSelectable,
        selectedIds,
        onSelectOne,
        onSelectAll,
        onRowClick,
        emptyIcon,
        emptyMessage,
        getRowProps
    }: ResourceTableProps<T>,
    ref: React.Ref<ResourceTableHandle>
) {
    const {
        data,
        loading,
        error,
        pagination,
        setPage,
        setSize,
        setSort,
        setFilters,
        refresh
    } = useResource<T>(resourceUrl, resourceOptions);

    // Exponer métodos útiles vía ref
    useImperativeHandle(ref, () => ({
        refresh,
        setFilters
    }));

    return (
        <DataTable
            data={data}
            columns={columns}
            uniqueKey={uniqueKey}
            loading={loading}
            error={error}
            
            // Paginación vinculada al recurso
            page={pagination.page}
            rowsPerPage={pagination.size}
            totalElements={pagination.totalElements}
            onPageChange={setPage}
            onRowsPerPageChange={setSize}
            
            // Ordenación vinculada al recurso
            orderBy={pagination.sortBy}
            orderDirection={pagination.direction}
            onSort={setSort}
            
            // Selección y eventos delegados
            isSelectable={isSelectable}
            selectedIds={selectedIds}
            onSelectOne={onSelectOne}
            onSelectAll={onSelectAll}
            onRowClick={onRowClick}
            emptyIcon={emptyIcon}
            emptyMessage={emptyMessage}
            getRowProps={getRowProps}
        />
    );
}

// Usamos forwardRef para permitir que el padre llame a refresh() o setFilters()
/**
 * Componente genérico para mostrar tablas de datos paginadas, con soporte para selección múltiple
 * y acciones en lote. Envoltorio de `ResourceTableInner` con `forwardRef` tipado fuertemente.
 */
export const ResourceTable = forwardRef(ResourceTableInner) as <T>(
    props: ResourceTableProps<T> & { ref?: React.Ref<ResourceTableHandle> }
) => React.ReactElement;
