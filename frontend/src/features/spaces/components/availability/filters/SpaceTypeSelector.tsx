import React from 'react';
import { Autocomplete, Checkbox, TextField, Box } from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

/** Constante con los tipos de espacio permitidos en el sistema. */
export const SPACE_TYPES = ['AULA', 'LABORATORIO', 'SALA_ESTUDIO', 'SALON_ACTOS', 'DESPACHO', 'OTROS'];

/**
 * Propiedades para el componente SpaceTypeSelector.
 */
interface SpaceTypeSelectorProps {
    /** Lista de tipos de espacio seleccionados. */
    value: string[];
    /** Función para actualizar los tipos de espacio seleccionados. */
    onChange: (newValue: string[]) => void;
}

/**
 * Componente que provee un selector múltiple (Autocomplete) para filtrar espacios por su tipo.
 * Permite seleccionar uno o varios tipos definidos en la constante SPACE_TYPES.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el selector de tipos de espacio.
 */
const SpaceTypeSelector = ({ value, onChange }: SpaceTypeSelectorProps) => {
    return (
        <Autocomplete
            multiple
            options={SPACE_TYPES}
            disableCloseOnSelect
            limitTags={1}
            getOptionLabel={(option) => option.replace('_', ' ')}
            value={value}
            onChange={(_e, newValue) => onChange(newValue)}
            renderOption={(props, option, { selected }) => {
                const { key, ...otherProps } = props as any;
                return (
                    <li key={key} {...otherProps}>
                        <Checkbox
                            icon={icon}
                            checkedIcon={checkedIcon}
                            style={{ marginRight: 8 }}
                            checked={selected}
                        />
                        {option.replace('_', ' ')}
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField 
                    {...params} 
                    label="Tipo de Espacio" 
                    placeholder={value.length === 0 ? "Cualquier tipo" : ""} 
                />
            )}
        />
    );
};

export default SpaceTypeSelector;
