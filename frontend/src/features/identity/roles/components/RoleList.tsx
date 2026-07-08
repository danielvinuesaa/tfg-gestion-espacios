import { useCallback, useState } from 'react';
import type { Role } from '../../../../shared/types';
import RoleForm from './RoleForm';
import RoleDetailsDrawer from './RoleDetailsDrawer';
import DeleteRoleDialog from './DeleteRoleDialog';
import BulkDeleteResourceDialog, { type BulkDeleteConfig } from '../../../../shared/components/BulkDeleteResourceDialog';
import RoleReassignmentSelector from './RoleReassignmentSelector';
import BulkActionBar from '../../../../shared/components/BulkActionBar';
import { useAuth } from '../../../../context/AuthContext';
import { useSnackbar } from '../../../../context/SnackbarContext';
import { useRoles } from '../hooks/useRoles';
import { useBulkActions } from '../../../../shared/hooks/useBulkActions';
import { useModalStack } from '../../../../shared/hooks/useModalStack';
import { Container, Paper, Alert, Typography, Button, LinearProgress, Box } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

// Sub-componentes descompuestos
import RoleHeader from './list/RoleHeader';
import RoleFilters from './list/RoleFilters';
import RoleTable from './RoleTable';
import PageLoader from '../../../../shared/components/PageLoader';

/**
 * Vista principal para la gestión de roles y permisos.
 * Permite listar, filtrar, buscar y ejecutar acciones (crear, editar, eliminar, restaurar) sobre los roles.
 * Integra acciones por lotes y sincronización con el backend mediante TanStack Query.
 * 
 * @returns Componente JSX que representa la pantalla de listado de roles.
 */
const RoleList = () => {
    const { hasPermission } = useAuth();
    const { showSnackbar } = useSnackbar();
    const canManage = hasPermission('GESTIONAR_ROLES');

    const [reassignToId, setReassignToId] = useState<number | ''>('');

    const {
        roles, allRoles, loading, isFetching, error,
        sortBy, direction, searchQuery, setSearchQuery,
        includeDeleted, setIncludeDeleted,
        handleSort, restoreRole
    } = useRoles();

    const modals = useModalStack({
        form: null as Role | null,
        delete: null as Role | null,
        details: null as Role | null
    });

    const {
        selectedIds, isGlobalSelection, bulkConflictSummary, loadingBulk,
        isBulkDeleteDialogOpen, toggleBulkDeleteModal, handleBulkDelete,
        handleSelectAll, handleSelectOne, clearSelection
    } = useBulkActions({
        resourceNamePlural: 'roles',
        endpoint: '/api/roles',
        onSuccess: (msg) => {
            showSnackbar(msg);
            setReassignToId('');
        }
    });

    /**
     * Manejador unificado de acciones.
     */
    const handleAction = useCallback(async (action: 'add' | 'edit' | 'delete' | 'details' | 'view' | 'restore', role?: Role) => {
        switch (action) {
            case 'add': 
                modals.open('form'); 
                break;
            case 'edit': 
                if (role) modals.open('form', role); 
                break;
            case 'delete': 
                if (role) modals.open('delete', role); 
                break;
            case 'view':
            case 'details': 
                if (role) modals.open('details', role); 
                break;
            case 'restore': 
                if (role) {
                    try {
                        await restoreRole(role.id);
                        showSnackbar(`Rol "${role.name}" restaurado con éxito`);
                    } catch (err) {}
                }
                break;
        }
    }, [restoreRole, showSnackbar, modals]);

    const isSearchActive = !!searchQuery.trim();

    // Estado de carga inicial (Caché vacía)
    if (loading && roles.length === 0 && !isSearchActive) {
        return <PageLoader message="Cargando configuración de seguridad..." />;
    }

    const bulkDeleteRoleConfig: BulkDeleteConfig = {
        title: "¿Eliminar Lote de Roles?",
        resourceNameSingular: "rol",
        resourceNamePlural: "roles",
        impactTypeLabel: bulkConflictSummary?.totalImpactedItems === 1 ? "usuario afectado" : "usuarios afectados",
        confirmTextWithConflicts: "Confirmar Reasignación y Eliminar"
    };

    const isPageFull = roles.length > 0 && roles.every(r => selectedIds.includes(r.id));

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, position: 'relative' }}>
            {/* Indicador de actualización en segundo plano */}
            {isFetching && !loading && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000 }}>
                    <LinearProgress sx={{ height: 3 }} />
                </Box>
            )}

            <RoleHeader 
                canManage={canManage} 
                onAdd={() => handleAction('add')} 
            />
            
            <RoleFilters 
                searchQuery={searchQuery} 
                onSearchChange={(val) => setSearchQuery(val)} 
                includeDeleted={includeDeleted} 
                onToggleDeleted={(val) => setIncludeDeleted(val)} 
            />
            
            <BulkActionBar 
                selectedCount={selectedIds.length} 
                resourceNamePlural="roles" 
                resourceNameSingular="rol" 
                onClearSelection={clearSelection} 
                onDelete={() => toggleBulkDeleteModal(true)} 
                isGlobalSelection={isGlobalSelection} 
                isPageFull={isPageFull} 
                totalElements={roles.length} 
                canDelete={canManage} 
            />
            
            {error && <Alert severity="error" variant="filled" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
            
            {loading && roles.length === 0 ? <PageLoader /> : roles.length === 0 ? (
                <Paper elevation={0} sx={{ p: 8, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 4, bgcolor: '#fcfcfc' }}>
                    <SecurityIcon sx={{ fontSize: 60, color: 'action.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        {isSearchActive ? 'No hay roles que coincidan con tu búsqueda' : 'No hay roles configurados'}
                    </Typography>
                    {isSearchActive && <Button variant="text" onClick={() => setSearchQuery('')}>Limpiar búsqueda</Button>}
                </Paper>
            ) : (
                <RoleTable 
                    roles={roles} 
                    sortBy={sortBy} 
                    direction={direction} 
                    onSort={handleSort} 
                    handleAction={handleAction} 
                    selectedIds={selectedIds} 
                    onSelectAll={(ids) => handleSelectAll(ids as number[])} 
                    onToggleSelect={handleSelectOne} 
                    loading={isFetching}
                />
            )}

            <RoleForm 
                open={modals.isOpen('form')} 
                handleClose={() => modals.close('form')} 
                onSuccess={(msg) => showSnackbar(msg)} 
                initialData={modals.getData('form')} 
            />
            
            <DeleteRoleDialog 
                open={modals.isOpen('delete')} 
                role={modals.getData('delete')} 
                allRoles={allRoles}
                handleClose={() => modals.close('delete')} 
                onSuccess={(msg) => showSnackbar(msg)} 
            />
            
            <RoleDetailsDrawer 
                open={modals.isOpen('details')} 
                role={modals.getData('details')} 
                onClose={() => modals.close('details')} 
            />
            
            <BulkDeleteResourceDialog 
                open={isBulkDeleteDialogOpen} 
                loading={loadingBulk} 
                summary={bulkConflictSummary} 
                config={bulkDeleteRoleConfig} 
                onClose={() => toggleBulkDeleteModal(false)} 
                onConfirm={() => handleBulkDelete(false, reassignToId ? { reassignToId } : {})} 
                extraActions={
                    <RoleReassignmentSelector 
                        summary={bulkConflictSummary}
                        roles={allRoles}
                        selectedIds={selectedIds}
                        reassignToId={reassignToId}
                        onReassignChange={setReassignToId}
                    />
                }
            />
        </Container>
    );
};

export default RoleList;
