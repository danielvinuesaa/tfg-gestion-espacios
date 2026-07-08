import React, { useMemo } from 'react';
import { 
    Chip, Typography, Tooltip, Stack, Box
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import PersonOffIcon from '@mui/icons-material/PersonOff';

import DataTable, { type Column } from '../../../../../shared/components/DataTable';
import type { User } from '../../../../../shared/types';
import StatusChip from '../../../../../shared/components/Chips/StatusChip';

// Sub-componentes refactorizados
import UserRoleChip from './components/UserRoleChip';
import UserActions from './components/UserActions';

/**
 * Propiedades del componente UserTable.
 */
interface UserTableProps {
    users: User[];
    currentUserEmail?: string;
    totalElements: number;
    rowsPerPage: number;
    page: number;
    setPage: (page: number) => void;
    setRowsPerPage: (rows: number) => void;
    sortBy: string;
    direction: 'asc' | 'desc';
    handleSort: (field: string) => void;
    handleAction: (action: any, user: User) => void;
    // Props para selección masiva
    selectedIds: number[];
    onSelectAll: (ids: number[]) => void;
    onSelectOne: (id: number) => void;
    isSelectableAction?: boolean;
    loading?: boolean;
    error?: string | null;
}

/**
 * Componente que renderiza la tabla de datos de usuarios.
 * Actúa como orquestador delegando el renderizado específico a subcomponentes y configurando las columnas.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento de React que contiene la tabla de usuarios.
 */
const UserTable: React.FC<UserTableProps> = ({ 
    users, currentUserEmail, totalElements, rowsPerPage, page, 
    setPage, setRowsPerPage, sortBy, direction, handleSort, handleAction,
    selectedIds, onSelectAll, onSelectOne, isSelectableAction = true, loading, error
}) => {

    const columns = useMemo<Column<User>[]>(() => [
        {
            id: 'name',
            label: 'Nombre',
            sortable: true,
            render: (u) => {
                const isDeleted = u.status === 'ELIMINADO';
                const isBlocked = u.status === 'BLOQUEADO';
                return (
                    <Box display="flex" alignItems="center" gap={1}>
                        {isBlocked && (
                            <Tooltip title="Usuario Bloqueado">
                                <LockIcon fontSize="small" color="error" />
                            </Tooltip>
                        )}
                        <Typography 
                            variant="body2" 
                            fontWeight={isDeleted ? "normal" : "bold"} 
                            color={isDeleted ? "text.disabled" : "text.primary"}
                        >
                            {u.name}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            id: 'email',
            label: 'Email',
            sortable: true,
            render: (u) => (
                <Typography variant="body2" color={u.status === 'ELIMINADO' ? "text.disabled" : "text.primary"}>
                    {u.email}
                </Typography>
            )
        },
        {
            id: 'role',
            label: 'Rol / Estado',
            sortable: true,
            render: (u) => {
                const isDeleted = u.status === 'ELIMINADO';
                const isBlocked = u.status === 'BLOQUEADO';
                return (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <UserRoleChip roleName={u.role.name} isDeleted={isDeleted} />
                        {isBlocked && (
                            <StatusChip status="BLOQUEADO" />
                        )}
                        {isDeleted && (
                            <StatusChip status="ELIMINADO" />
                        )}
                    </Stack>
                );
            }
        },
        {
            id: 'actions',
            label: 'Acciones',
            align: 'center',
            render: (u) => (
                <UserActions 
                    user={u} 
                    isProtected={u.email === 'admin@uniovi.es' || u.email === currentUserEmail}
                    handleAction={handleAction} 
                />
            )
        }
    ], [currentUserEmail, handleAction]);

    return (
        <DataTable
            data={users}
            columns={columns}
            uniqueKey="id"
            loading={loading}
            error={error}
            orderBy={sortBy}
            orderDirection={direction}
            onSort={handleSort}
            selectedIds={selectedIds}
            onSelectOne={isSelectableAction ? (id) => onSelectOne(id as number) : undefined}
            onSelectAll={isSelectableAction ? (ids) => onSelectAll(ids as number[]) : undefined}
            page={page}
            rowsPerPage={rowsPerPage}
            totalElements={totalElements}
            onPageChange={setPage}
            onRowsPerPageChange={(rows) => { setRowsPerPage(rows); setPage(0); }}
            isSelectable={(u) => u.email !== 'admin@uniovi.es' && u.email !== currentUserEmail && u.status !== 'ELIMINADO'}
            emptyIcon={<PersonOffIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />}
            emptyMessage="No se han encontrado usuarios"
            getRowProps={(u) => ({
                sx: (u.status === 'ELIMINADO' || u.status === 'BLOQUEADO') ? {
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    '& .MuiTableCell-root': {
                        color: u.status === 'ELIMINADO' ? 'text.disabled' : 'inherit',
                    },
                    ...(u.status === 'ELIMINADO' && {
                        '& .MuiTypography-root': {
                            opacity: 0.7
                        }
                    })
                } : {}
            })}
        />
    );
};

export default UserTable;
