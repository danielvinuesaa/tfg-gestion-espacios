import React from 'react';
import { TableHead, TableRow, TableCell, Checkbox, TableSortLabel, Tooltip } from '@mui/material';
import type { Column, DataTableSortConfig, DataTableSelectionConfig } from './types';

/**
 * Interfaz que define las propiedades para el encabezado de la tabla de datos.
 * Combina la configuración de ordenación y de selección con los datos actuales.
 * 
 * @typeParam T - El tipo de la entidad de datos asociada a la tabla.
 */
interface DataTableHeadProps<T> extends DataTableSortConfig, DataTableSelectionConfig<T> {
    /** Definición de las columnas que conforman la estructura de la tabla. */
    columns: Column<T>[];
    /** Colección de datos actualmente renderizados en la vista de la tabla. */
    data: T[];
    /** Clave que identifica unívocamente a cada elemento del conjunto de datos. */
    uniqueKey: keyof T;
}

/**
 * Componente funcional que renderiza el encabezado interactivo de la tabla de datos.
 * Integra la lógica para la selección masiva de elementos y la ordenación por columnas.
 * 
 * @typeParam T - El tipo de la entidad de datos.
 * @param props - Propiedades necesarias para la configuración del encabezado.
 * @returns Componente de encabezado de React (TableHead) configurado.
 */
export function DataTableHead<T>({
    columns,
    orderBy,
    orderDirection,
    onSort,
    selectedIds = [],
    onSelectAll,
    isSelectable = () => true,
    data,
    uniqueKey
}: DataTableHeadProps<T>) {
    
    const selectableData = data.filter(isSelectable);
    const selectableIds = selectableData.map(item => item[uniqueKey] as unknown as (string | number));
    
    const isAllSelected = selectableData.length > 0 && 
                         selectableIds.every(id => selectedIds.includes(id));
    
    const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!onSelectAll) return;
        if (event.target.checked) {
            onSelectAll(selectableIds);
        } else {
            onSelectAll([]);
        }
    };

    return (
        <TableHead>
            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                {onSelectAll && (
                    <TableCell padding="checkbox" sx={{ bgcolor: '#f8f9fa' }}>
                        <Tooltip title={isAllSelected ? "Desmarcar todos" : "Seleccionar todos los de esta página"}>
                            <Checkbox
                                indeterminate={isSomeSelected}
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                color="primary"
                                size="small"
                            />
                        </Tooltip>
                    </TableCell>
                )}
                {columns.map((column) => (
                    <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ 
                            fontWeight: 'bold', 
                            color: 'text.secondary', 
                            width: column.width,
                            bgcolor: '#f8f9fa',
                            py: 1.5
                        }}
                    >
                        {column.sortable && onSort ? (
                            <TableSortLabel
                                active={orderBy === column.id}
                                direction={orderBy === column.id ? orderDirection : 'asc'}
                                onClick={() => onSort(column.id)}
                            >
                                {column.label}
                            </TableSortLabel>
                        ) : (
                            column.label
                        )}
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
}

export default DataTableHead;
