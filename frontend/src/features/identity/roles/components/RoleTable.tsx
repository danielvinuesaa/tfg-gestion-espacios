import React, { useMemo } from 'react';
import {
    Typography,
    Box,
    Chip,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

import DataTable, { type Column } from '../../../../shared/components/DataTable';
import type { Role } from '../../../../shared/types';
import StatusChip from '../../../../shared/components/Chips/StatusChip';

// Sub-componentes refactorizados
import RoleUsageAvatar from './components/RoleUsageAvatar';
import RolePermissionsCell from './components/RolePermissionsCell';
import RoleActions from './components/RoleActions';

/**
 * Propiedades del componente {@link RoleTable}.
 */
interface RoleTableProps {
    /** Lista de roles a visualizar. */
    roles: Role[];
    /** Columna actual por la que se está ordenando. */
    sortBy: string;
    /** Dirección de la ordenación ('asc' o 'desc'). */
    direction: 'asc' | 'desc';
    /** Callback para cambiar la ordenación. */
    onSort: (field: string) => void;
    /** Función para manejar las acciones individuales sobre un rol (editar, eliminar, etc.). */
    handleAction: (action: string, role: Role) => void;
    /** Lista de IDs de roles seleccionados. */
    selectedIds: number[];
    /** Callback para seleccionar/deseleccionar un rol. */
    onToggleSelect: (id: number) => void;
    /** Callback para seleccionar/deseleccionar todos los roles. */
    onSelectAll: (ids: number[]) => void;
    /** Indica si las filas son seleccionables. */
    isSelectableAction?: boolean;
    /** Indica si la tabla está en proceso de carga. */
    loading?: boolean;
    /** Mensaje de error, si lo hubiera. */
    error?: string | null;
}

const PROTECTED_SYSTEM_ROLES = ['ADMIN'];

/**
 * Componente de tabla especializada para la visualización de roles.
 * Soporta selección múltiple, ordenación y acciones individuales por registro.
 * 
 * @param props - Propiedades del componente.
 * @returns Componente JSX que representa la tabla de roles.
 */
const RoleTable: React.FC<RoleTableProps> = ({ 
    roles, sortBy, direction, 
    onSort, handleAction,
    selectedIds, onToggleSelect, onSelectAll, isSelectableAction = true, loading, error
}) => {

    const columns = useMemo<Column<Role>[]>(() => [
        {
            id: 'name',
            label: 'Nombre y Descripción',
            sortable: true,
            render: (role) => {
                const isDeleted = role.status === 'ELIMINADO';
                return (
                    <Box onClick={() => handleAction('view', role)} sx={{ cursor: 'pointer' }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDeleted ? 'text.disabled' : '#1976d2' }}>
                                {role.name}
                            </Typography>
                            {isDeleted && (
                                <StatusChip status="ELIMINADO" />
                            )}
                        </Box>
                        <Typography variant="caption" color="textSecondary" noWrap sx={{ display: 'block', maxWidth: 250 }}>
                            {role.description || 'Sin descripción adicional.'}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            id: 'userCount',
            label: 'Uso',
            align: 'center',
            sortable: true,
            render: (role) => <RoleUsageAvatar userCount={role.userCount || 0} totalUserCount={role.totalUserCount || 0} />
        },
        {
            id: 'peso',
            label: 'Permisos (Peso)',
            sortable: true,
            render: (role) => (
                <RolePermissionsCell 
                    permissions={role.permissions} 
                    isDeleted={role.status === 'ELIMINADO'} 
                />
            )
        },
        {
            id: 'actions',
            label: 'Acciones',
            align: 'center',
            render: (role) => (
                <RoleActions 
                    role={role}
                    isSystemRole={PROTECTED_SYSTEM_ROLES.includes(role.name)}
                    handleAction={handleAction}
                />
            )
        }
    ], [handleAction]);

    return (
        <DataTable
            data={roles}
            columns={columns}
            uniqueKey="id"
            loading={loading}
            error={error}
            orderBy={sortBy}
            orderDirection={direction}
            onSort={onSort}
            selectedIds={selectedIds}
            onSelectOne={isSelectableAction ? (id) => onToggleSelect(id as number) : undefined}
            onSelectAll={isSelectableAction ? (ids) => onSelectAll(ids as number[]) : undefined}
            onRowClick={(role) => handleAction('view', role)}
            isSelectable={(r) => !PROTECTED_SYSTEM_ROLES.includes(r.name) && r.status !== 'ELIMINADO'}
            emptyIcon={<SecurityIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />}
            emptyMessage="No se han encontrado roles"
            getRowProps={(role) => ({
                sx: role.status === 'ELIMINADO' ? {
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    '& .MuiTableCell-root': {
                        color: 'text.disabled',
                    },
                    '& .MuiTypography-root': {
                        opacity: 0.7
                    }
                } : {}
            })}
        />
    );
};

export default RoleTable;
