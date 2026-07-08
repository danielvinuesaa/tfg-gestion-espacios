import { useCallback } from 'react';
import type { User } from '../../../../shared/types';
import { useAuth } from '../../../../context/AuthContext';
import { useSnackbar } from '../../../../context/SnackbarContext';
import { useApi } from '../../../../shared/utils/api';
import { useUsers } from '../hooks/useUsers';
import { useBulkActions } from '../../../../shared/hooks/useBulkActions';
import { useModalStack } from '../../../../shared/hooks/useModalStack';
import UserForm from './UserForm';
import DeleteUserDialog from './DeleteUserDialog';
import ImportUsersDialog from './ImportUsersDialog';
import ExportUsersDialog from './ExportUsersDialog';
import BulkDeleteResourceDialog, { type BulkDeleteConfig } from '../../../../shared/components/BulkDeleteResourceDialog';
import BulkActionBar from '../../../../shared/components/BulkActionBar';
import { Container, Alert, Paper, Typography, Button, LinearProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

// Sub-componentes descompuestos
import UserHeader from './list/UserHeader';
import UserFilters from './list/UserFilters';
import UserTable from './list/UserTable';
import PageLoader from '../../../../shared/components/PageLoader';
import BlockUserDialog from './BlockUserDialog';

/**
 * Componente principal para la vista de administración de usuarios.
 * Facilita el listado, filtrado, creación, edición, eliminación y exportación/importación de usuarios,
 * empleando TanStack Query para una sincronización de datos robusta.
 *
 * @returns Elemento de React que compone la interfaz completa del listado de usuarios.
 */
const UserList = () => {
    const { request } = useApi();
    const { user: currentUser, hasPermission } = useAuth();
    const { showSnackbar } = useSnackbar();
    const canManage = hasPermission('GESTIONAR_USUARIOS');

    const {
        users, roles, loading, isFetching, error, pagination, filters,
        includeDeleted, setIncludeDeleted,
        setPage, setSize, setSort, setFilters,
        clearFilters, restoreUser, updateUserStatus
    } = useUsers();

    const modals = useModalStack({
        form: null as User | null,
        delete: null as User | null,
        block: null as User | null,
        import: false,
        export: false
    });

    const getFiltersParams = useCallback(() => {
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.roleId) params.append('roleId', filters.roleId);
        params.append('includeDeleted', includeDeleted.toString());
        return params;
    }, [filters.name, filters.roleId, includeDeleted]);

    // useBulkActions ahora gestiona su propia invalidación de caché
    const {
        selectedIds, isGlobalSelection, bulkConflictSummary, loadingBulk,
        isBulkDeleteDialogOpen, toggleBulkDeleteModal, handleBulkDelete,
        handleSelectAll, handleSelectOne, clearSelection, setIsGlobalSelection
    } = useBulkActions({
        resourceNamePlural: 'usuarios',
        endpoint: '/api/users',
        onSuccess: (msg) => showSnackbar(msg),
        getFilters: getFiltersParams
    });

    const handleAction = useCallback(async (action: 'add' | 'edit' | 'delete' | 'restore' | 'block' | 'unblock', user?: User) => {
        switch (action) {
            case 'add': modals.open('form'); break;
            case 'edit': if (user) modals.open('form', user); break;
            case 'delete': if (user) modals.open('delete', user); break;
            case 'restore': 
                if (user) { 
                    try { 
                        await restoreUser(user.id); 
                        showSnackbar(`Usuario ${user.email} restaurado con éxito`); 
                    } catch (err) {} 
                } 
                break;
            case 'block':
                if (user) modals.open('block', user);
                break;
            case 'unblock':
                if (user) {
                    try {
                        await updateUserStatus(user, 'ACTIVO');
                        showSnackbar(`Usuario desbloqueado correctamente`);
                    } catch (err: any) {
                        showSnackbar(err.message || "Error al actualizar el estado del usuario", "error");
                    }
                }
                break;
        }
    }, [restoreUser, updateUserStatus, showSnackbar, modals]);

    const handleConfirmBlock = async (user: User, force: boolean) => {
        try {
            await updateUserStatus(user, 'BLOQUEADO', force);
            showSnackbar(`Usuario ${user.email} bloqueado correctamente`);
        } catch (err: any) {
            showSnackbar(err.message || "Error al bloquear usuario", "error");
        }
    };

    const handleExport = useCallback(async (columns: string[]) => {
        try {
            const params = getFiltersParams();
            if (pagination.sortBy) params.append('sort', `${pagination.sortBy},${pagination.direction}`);
            columns.forEach(col => params.append('columns', col));
            
            const blob = await request(`/api/users/export?${params.toString()}`);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showSnackbar('Exportado correctamente');
        } catch (error) {}
    }, [getFiltersParams, pagination.sortBy, pagination.direction, request, showSnackbar]);

    const hasActiveFilters = !!(filters.name || filters.roleId);

    // Pantalla de carga inicial (Caché vacía)
    if (loading && users.length === 0 && !hasActiveFilters) {
        return <PageLoader message="Cargando directorio de usuarios..." />;
    }

    const bulkDeleteUserConfig: BulkDeleteConfig = {
        title: "¿Eliminar Lote de Usuarios?",
        resourceNameSingular: "usuario",
        resourceNamePlural: "usuarios",
        impactTypeLabel: bulkConflictSummary?.totalImpactedItems === 1 ? "reserva activa" : "reservas activas",
        confirmTextWithConflicts: "Borrar y Cancelar Reservas"
    };

    const selectableUsersOnPage = users.filter(u => u.email !== 'admin@uniovi.es' && u.email !== currentUser?.email);
    const isPageFull = selectableUsersOnPage.length > 0 && selectableUsersOnPage.every(u => selectedIds.includes(u.id));

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Indicador sutil de carga en segundo plano (Background Fetching) */}
            {isFetching && !loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: 3 }} />}

            <UserHeader 
                canManage={canManage} 
                isEmpty={pagination.totalElements === 0}
                onExport={() => modals.open('export')} 
                onAddClick={() => handleAction('add')} 
                onImportClick={() => modals.open('import')} 
            />
            
            <UserFilters 
                searchName={filters.name || ''} 
                setSearchName={(val) => setFilters({ name: val })} 
                searchRole={filters.roleId || ''} 
                setSearchRole={(val) => setFilters({ roleId: val })} 
                includeDeleted={includeDeleted} 
                setIncludeDeleted={setIncludeDeleted} 
                roles={roles} 
                clearFilters={clearFilters} 
                setPage={setPage} 
            />
            
            <BulkActionBar 
                selectedCount={selectedIds.length} 
                resourceNamePlural="usuarios" 
                resourceNameSingular="usuario" 
                onClearSelection={clearSelection} 
                onDelete={() => toggleBulkDeleteModal(true)} 
                isGlobalSelection={isGlobalSelection} 
                isPageFull={isPageFull} 
                totalElements={pagination.totalElements - 1} 
                onSelectAllGlobal={() => setIsGlobalSelection(true)} 
                canDelete={canManage} 
            />
            
            {error && <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            
            {loading && users.length === 0 ? <PageLoader /> : users.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: '#fcfcfc' }}>
                    <PersonIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {hasActiveFilters ? 'No se han encontrado usuarios que coincidan con tu búsqueda' : 'No hay usuarios registrados'}
                    </Typography>
                    {hasActiveFilters && <Button variant="text" onClick={clearFilters}>Limpiar búsqueda</Button>}
                </Paper>
            ) : (
                <UserTable 
                    users={users} 
                    currentUserEmail={currentUser?.email} 
                    totalElements={pagination.totalElements} 
                    rowsPerPage={pagination.size} 
                    page={pagination.page} 
                    setPage={setPage} 
                    setRowsPerPage={setSize} 
                    sortBy={pagination.sortBy} 
                    direction={pagination.direction} 
                    handleSort={setSort} 
                    handleAction={handleAction} 
                    selectedIds={selectedIds} 
                    onSelectAll={handleSelectAll} 
                    onSelectOne={handleSelectOne} 
                    isSelectableAction={canManage} 
                    loading={isFetching} 
                />
            )}

            <UserForm 
                open={modals.isOpen('form')} 
                handleClose={() => modals.close('form')} 
                onSuccess={(msg) => showSnackbar(msg)} 
                initialData={modals.getData('form')} 
            />
            
            <DeleteUserDialog 
                open={modals.isOpen('delete')} 
                user={modals.getData('delete')} 
                handleClose={() => modals.close('delete')} 
                onSuccess={(msg) => showSnackbar(msg)} 
            />
            
            <ImportUsersDialog 
                open={modals.isOpen('import')} 
                handleClose={() => modals.close('import')} 
                onSuccess={(msg) => showSnackbar(msg)} 
            />
            <ExportUsersDialog 
                open={modals.isOpen('export')} 
                onClose={() => modals.close('export')} 
                onExport={handleExport} 
            />

            <BlockUserDialog 
                open={modals.isOpen('block')} 
                user={modals.getData('block')} 
                handleClose={() => modals.close('block')} 
                onConfirm={handleConfirmBlock}
            />

            <BulkDeleteResourceDialog 
                open={isBulkDeleteDialogOpen} 
                loading={loadingBulk} 
                summary={bulkConflictSummary} 
                config={bulkDeleteUserConfig} 
                onClose={() => toggleBulkDeleteModal(false)} 
                onConfirm={() => handleBulkDelete(true)} 
            />
        </Container>
    );
};

export default UserList;
