import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

/**
 * Propiedades para el componente CapacityInput.
 */
interface CapacityInputProps {
    /** Valor actual de la capacidad ingresada. */
    value: string;
    /** Función a ejecutar cuando el usuario modifica la capacidad. */
    onChange: (value: string) => void;
}

/**
 * Componente que provee un campo numérico para introducir la capacidad deseada
 * o número de asistentes. Solo permite valores enteros no negativos.
 *
 * @param props - Propiedades del componente.
 * @returns Elemento React con el campo de entrada de capacidad.
 */
const CapacityInput = ({ value, onChange }: CapacityInputProps) => {
    return (
        <TextField
            label="Alumnos / Asistentes"
            type="number"
            value={value}
            onChange={(e) => {
                const val = e.target.value;
                if (val === '' || parseInt(val) >= 0) {
                    onChange(val);
                }
            }}
            fullWidth
            inputProps={{ min: 0 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <PeopleIcon fontSize="small" color="action" />
                    </InputAdornment>
                ),
            }}
            helperText="Número real de personas"
        />
    );
};

export default CapacityInput;
