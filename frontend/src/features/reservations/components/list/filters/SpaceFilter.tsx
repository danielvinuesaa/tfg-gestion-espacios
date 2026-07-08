import React from 'react';
import { Autocomplete, TextField, Box, Typography, Link, Checkbox } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { Space } from '../../../../../shared/types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * Propiedades del componente SpaceFilter.
 */
interface SpaceFilterProps {
    allSpaces: Space[];
    selectedSpaceIds: string[];
    onChange: (ids: string[]) => void;
}

/**
 * Componente secundario para la selección de filtros por espacios físicos.
 * 
 * Expone un selector múltiple agrupadado semánticamente por la tipología del espacio
 * (aulas, laboratorios, etc.). Adicionalmente, provee una funcionalidad para seleccionar 
 * o deseleccionar en bloque todos los recursos pertenecientes a un mismo grupo, mejorando
 * la eficiencia en búsquedas amplias.
 * 
 * @param props - Propiedades del componente.
 * @param props.allSpaces - Colección global de espacios físicos disponibles en el sistema.
 * @param props.selectedSpaceIds - Conjunto de identificadores de los espacios actualmente seleccionados.
 * @param props.onChange - Callback invocado al alterar el conjunto de espacios filtrados.
 * @returns Elemento React con el autocompletado agrupado de espacios.
 */
const SpaceFilter = ({ allSpaces, selectedSpaceIds, onChange }: SpaceFilterProps) => {
    const sortedSpaces = [...allSpaces].sort((a, b) => {
        const typeA = a.type || "OTROS";
        const typeB = b.type || "OTROS";
        if (typeA !== typeB) return typeA.localeCompare(typeB);
        return a.name.localeCompare(b.name);
    });

    const handleSelectGroup = (groupSpaces: Space[]) => {
        const groupIds = groupSpaces.map(s => s.id.toString());
        const selectedInGroup = selectedSpaceIds.filter(id => groupIds.includes(id));
        const isAllSelected = selectedInGroup.length === groupIds.length;

        let newIds: string[];
        if (isAllSelected) {
            newIds = selectedSpaceIds.filter(id => !groupIds.includes(id));
        } else {
            newIds = Array.from(new Set([...selectedSpaceIds, ...groupIds]));
        }
        onChange(newIds);
    };

    return (
        <Autocomplete
            multiple size="small" disableCloseOnSelect limitTags={1} options={sortedSpaces}
            groupBy={(option) => {
                const type = option.type || "OTROS";
                return type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
            }}
            getOptionLabel={(option) => option.name}
            value={allSpaces.filter(s => selectedSpaceIds.includes(s.id.toString()))}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_e, val) => onChange(val.map(v => v.id.toString()))}
            renderInput={(params) => (
                <TextField {...params} label="Espacios" placeholder={selectedSpaceIds.length === 0 ? "Añadir espacio..." : ""} sx={{ bgcolor: 'white' }} />
            )}
            renderGroup={(params) => {
                const groupLabel = params.group;
                const groupSpaces = allSpaces.filter(s => {
                    const type = s.type || "OTROS";
                    const label = type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
                    return label === groupLabel;
                });
                const selectedInGroup = selectedSpaceIds.filter(id => groupSpaces.some(gs => gs.id.toString() === id));
                const isAllSelected = selectedInGroup.length === groupSpaces.length;

                return (
                    <Box key={params.key}>
                        <Box sx={{ 
                            px: 2, py: 0.5, display: 'flex', justifyContent: 'space-between', 
                            alignItems: 'center', bgcolor: '#f0f4f8', position: 'sticky', top: 0, zIndex: 1,
                            borderBottom: '1px solid #e0e0e0',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary.dark">{params.group.toUpperCase()}</Typography>
                            <Link component="button" variant="caption" onClick={() => handleSelectGroup(groupSpaces)} sx={{ textDecoration: 'none', fontWeight: 'bold' }}>
                                {isAllSelected ? 'DESMARCAR TODO' : 'SELECCIONAR TODO'}
                            </Link>
                        </Box>
                        <ul style={{ padding: 0, margin: 0 }}>{params.children}</ul>
                    </Box>
                );
            }}
            renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props as any;
                return (
                    <Box component="li" key={key} {...otherProps} sx={{ px: 2, py: 0.5 }}>
                        <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                        {option.name}
                    </Box>
                );
            }}
        />
    );
};

export default SpaceFilter;
