import React from 'react';
import { TableRow, TableCell, Checkbox } from '@mui/material';
import type { Column, DataTableSelectionConfig, DataTableRowConfig } from './types';

/**
 * Interfaz que define las propiedades para el componente que renderiza una fila de la tabla.
 * Extiende las configuraciones de selección y de fila definidas globalmente.
 * 
 * @typeParam T - El tipo de la entidad de datos representada por la fila.
 */
interface DataTableRowProps<T> extends DataTableSelectionConfig<T>, DataTableRowConfig<T> {
    /** El objeto de datos que contiene la información a renderizar en esta fila específica. */
    item: T;
    /** La definición de las columnas empleadas para extraer y renderizar el contenido de los datos. */
    columns: Column<T>[];
    /** La propiedad clave empleada para extraer el identificador único del elemento de datos. */
    uniqueKey: keyof T;
}

/**
 * Componente funcional que procesa y renderiza una fila individual para una tabla de datos genérica.
 * Gestiona estados como la interacción, la selección y los estilos condicionales basados en las propiedades del elemento.
 * 
 * @typeParam T - El tipo de la entidad de datos representada por la fila.
 * @param props - Las propiedades necesarias para configurar y renderizar el contenido de la fila.
 * @returns Un componente `TableRow` interactivo integrado en el marco de trabajo de la tabla.
 */
function DataTableRow<T>({
    item,
    columns,
    uniqueKey,
    selectedIds = [],
    onSelectOne,
    isSelectable = () => true,
    onRowClick,
    getRowProps
}: DataTableRowProps<T>) {
    const id = item[uniqueKey] as unknown as (string | number);
    const isSelected = selectedIds.includes(id);
    const selectable = isSelectable(item);

    const customProps = getRowProps ? getRowProps(item) : {};
    const { sx: customSx, ...otherCustomProps } = customProps;

    return (
        <TableRow
            hover
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            selected={isSelected}
            {...otherCustomProps}
            sx={{ 
                transition: 'background-color 0.2s',
                cursor: onRowClick ? 'pointer' : 'default',
                '&.Mui-selected': { bgcolor: 'rgba(25, 118, 210, 0.04) !important' },
                ...customSx
            }}
        >
            {onSelectOne && (
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onChange={() => onSelectOne(id)}
                        disabled={!selectable}
                        color="primary"
                        size="small"
                    />
                </TableCell>
            )}
            {columns.map((column) => (
                <TableCell key={column.id} align={column.align || 'left'} sx={{ py: 1.5 }}>
                    {column.render ? column.render(item) : (item[column.id as keyof T] as unknown as React.ReactNode)}
                </TableCell>
            ))}
        </TableRow>
    );
}

export default DataTableRow;
