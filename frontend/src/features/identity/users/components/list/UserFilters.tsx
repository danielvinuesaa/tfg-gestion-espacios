import { MenuItem, TextField } from '@mui/material';
import type { Role } from '../../../../../shared/types';
import FilterBar from '../../../../../shared/components/FilterBar';

/**
 * Propiedades del componente UserFilters.
 */
interface UserFiltersProps {
    searchName: string;
    setSearchName: (name: string) => void;
    searchRole: string | number;
    setSearchRole: (role: string | number) => void;
    includeDeleted: boolean;
    setIncludeDeleted: (include: boolean) => void;
    roles: Role[];
    clearFilters: () => void;
    setPage: (page: number) => void;
}

/**
 * Panel de filtrado avanzado para la lista de usuarios.
 * Emplea el componente genérico FilterBar para asegurar consistencia visual y de comportamiento.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento de React con la barra de filtrado y búsqueda.
 */
const UserFilters = ({ 
    searchName, setSearchName, 
    searchRole, setSearchRole, 
    includeDeleted, setIncludeDeleted,
    roles, clearFilters, setPage 
}: UserFiltersProps) => {
    
    // Filtros activos (excluyendo includeDeleted que es preferencia de vista)
    const hasActiveFilters = !!(searchName || searchRole);

    return (
        <FilterBar
            searchQuery={searchName}
            onSearchChange={setSearchName}
            searchPlaceholder="Buscar por nombre o email..."
            showDeleted={includeDeleted}
            onShowDeletedChange={(val) => { setIncludeDeleted(val); setPage(0); }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={() => { clearFilters(); setPage(0); }}
        >
            {/* Filtros Personalizados: Selector de Rol */}
            <TextField
                select 
                fullWidth 
                size="small" 
                label="Rol"
                value={searchRole} 
                onChange={(e) => { setSearchRole(e.target.value); setPage(0); }}
                sx={{ bgcolor: 'white', flex: '1 1 200px' }}
            >
                <MenuItem value=""><em>Todos los roles</em></MenuItem>
                {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                        {role.name}
                    </MenuItem>
                ))}
            </TextField>
        </FilterBar>
    );
};

export default UserFilters;
