import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, Typography, Box, Alert } from '@mui/material';
import type { Role } from '../../../../shared/types';
import type { BulkConflictSummary } from '../../../../shared/types/bulk';

/**
 * Propiedades del componente {@link RoleReassignmentSelector}.
 */
interface RoleReassignmentSelectorProps {
    /** Resumen de los conflictos detectados (usuarios que perderían su rol). */
    summary: BulkConflictSummary | null;
    /** Catálogo de roles disponibles para la reasignación. */
    roles: Role[];
    /** Lista de identificadores de los roles que se van a eliminar. */
    selectedIds: number[];
    /** Identificador del rol de destino actualmente seleccionado. */
    reassignToId: number | '';
    /** Función callback que se ejecuta al seleccionar un nuevo rol de destino. */
    onReassignChange: (id: number) => void;
}

/**
 * Componente especializado para la selección de un rol de destino durante borrados masivos.
 * Encapsula la lógica visual y gramatical de la reasignación de usuarios para asegurar
 * la integridad referencial del sistema.
 * 
 * @param props - Propiedades necesarias para renderizar el selector.
 * @returns Componente JSX con las opciones de reasignación.
 */
const RoleReassignmentSelector: React.FC<RoleReassignmentSelectorProps> = ({
    summary,
    roles,
    selectedIds,
    reassignToId,
    onReassignChange
}) => {
    if (!summary || summary.conflictCount === 0) return null;

    const rolesForReassign = roles.filter(r => r.status !== 'ELIMINADO' && !selectedIds.includes(r.id));

    return (
        <Box sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                    {summary.conflictCount === 1 
                        ? <>Estás a punto de reasignar a <strong>{summary.totalImpactedItems} {summary.totalImpactedItems === 1 ? 'usuario' : 'usuarios'}</strong> de <strong>1 solo rol</strong>.</>
                        : <>Estás a punto de reasignar a <strong>{summary.totalImpactedItems} {summary.totalImpactedItems === 1 ? 'usuario' : 'usuarios'}</strong> de <strong>{summary.conflictCount} roles distintos</strong>.</>
                    }
                    <br />
                    {summary.totalImpactedItems === 1 
                        ? "Este usuario pasará a tener el rol que selecciones a continuación."
                        : "Todos ellos pasarán a tener el rol que selecciones a continuación."
                    }
                </Typography>
            </Alert>
            
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {summary.totalImpactedItems === 1 ? "Seleccionar Nuevo Rol para el Usuario:" : "Seleccionar Rol de Destino Único:"}
            </Typography>
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <InputLabel id="reassign-role-label">
                    {summary.totalImpactedItems === 1 ? "Nuevo rol para el usuario" : "Nuevo rol para todos los usuarios"}
                </InputLabel>
                <Select
                    labelId="reassign-role-label"
                    value={reassignToId}
                    label={summary.totalImpactedItems === 1 ? "Nuevo rol para el usuario" : "Nuevo rol para todos los usuarios"}
                    onChange={(e) => onReassignChange(e.target.value as number)}
                >
                    {rolesForReassign.map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                            <Box display="flex" alignItems="center" gap={1}>
                                <strong>{role.name}</strong>
                                <Typography variant="caption" color="text.secondary">
                                    ({role.description || 'Sin descripción'})
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontStyle: 'italic', textAlign: 'center' }}>
                Esta acción es irreversible y afectará a la totalidad de usuarios de los roles eliminados.
            </Typography>
        </Box>
    );
};

export default RoleReassignmentSelector;
