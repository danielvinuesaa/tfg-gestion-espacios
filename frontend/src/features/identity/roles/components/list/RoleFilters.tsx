import React from 'react';
import FilterBar from '../../../../../shared/components/FilterBar';

/**
 * Propiedades del componente {@link RoleFilters}.
 */
interface RoleFiltersProps {
    /** Texto de búsqueda activo en el filtro. */
    searchQuery: string;
    /** Función para actualizar el texto de búsqueda. */
    onSearchChange: (query: string) => void;
    /** Estado del interruptor que determina si se muestran los roles marcados como eliminados. */
    includeDeleted: boolean;
    /** Función para actualizar la visibilidad de los roles eliminados. */
    onToggleDeleted: (value: boolean) => void;
}

/**
 * Barra de filtrado y búsqueda para la tabla de roles.
 * Permite encontrar roles específicos y conmutar la visibilidad del historial (roles eliminados).
 * 
 * @param props - Propiedades necesarias para renderizar los controles de filtrado.
 * @returns Componente JSX que representa la barra de filtrado.
 */
const RoleFilters: React.FC<RoleFiltersProps> = ({ 
    searchQuery, onSearchChange, 
    includeDeleted, onToggleDeleted 
}) => {
    return (
        <FilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchPlaceholder="Buscar por nombre o descripción..."
            showDeleted={includeDeleted}
            onShowDeletedChange={onToggleDeleted}
            // En roles de momento no hay más filtros que disparen el botón de limpiar
            hasActiveFilters={!!searchQuery}
            onClearFilters={() => onSearchChange('')}
        />
    );
};

export default RoleFilters;
