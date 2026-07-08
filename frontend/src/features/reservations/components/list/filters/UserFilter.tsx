import React from 'react';
import { Autocomplete, TextField, Checkbox, Box, Typography } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { User } from '../../../../../shared/types';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/**
 * Propiedades del componente UserFilter.
 */
interface UserFilterProps {
    allUsers: User[];
    selectedUserIds: string[];
    onChange: (ids: string[]) => void;
}

/**
 * Componente secundario para la selección de filtros por usuario o solicitante.
 * 
 * Implementa un selector múltiple (Autocomplete) que permite filtrar las reservas 
 * según los usuarios que las hayan solicitado. Presenta el nombre y el correo electrónico 
 * para facilitar la identificación inequívoca.
 * 
 * @param props - Propiedades del componente.
 * @param props.allUsers - Colección de todos los usuarios registrados disponibles para filtrar.
 * @param props.selectedUserIds - Conjunto de identificadores de los usuarios actualmente seleccionados.
 * @param props.onChange - Callback invocado tras la modificación de la selección.
 * @returns Elemento React con el campo de autocompletado y selección de usuarios.
 */
const UserFilter = ({ allUsers, selectedUserIds, onChange }: UserFilterProps) => {
    return (
        <Autocomplete
            multiple
            size="small"
            disableCloseOnSelect
            limitTags={2}
            options={allUsers}
            getOptionLabel={(o) => `${o.name} (${o.email})`}
            value={allUsers.filter(u => selectedUserIds.includes(u.id.toString()))}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_e, val) => onChange(val.map(v => v.id.toString()))}
            renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props as any;
                return (
                    <Box component="li" key={key} {...otherProps} sx={{ px: 2, py: 0.5 }}>
                        <Checkbox 
                            icon={icon} 
                            checkedIcon={checkedIcon} 
                            style={{ marginRight: 8 }} 
                            checked={selected} 
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight={selected ? "bold" : "medium"}>
                                {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.email}
                            </Typography>
                        </Box>
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Usuarios / Solicitantes" 
                    placeholder={selectedUserIds.length === 0 ? "Añadir usuario..." : ""}
                    sx={{ bgcolor: 'white' }} 
                />
            )}
        />
    );
};

export default UserFilter;
