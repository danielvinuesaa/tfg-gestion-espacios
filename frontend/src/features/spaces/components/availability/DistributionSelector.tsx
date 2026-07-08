import React, { useState, useEffect } from 'react';
import { 
    TextField, MenuItem, InputAdornment, Box, Slider, Typography, Stack 
} from '@mui/material';
import StraightenIcon from '@mui/icons-material/Straighten';

/**
 * Propiedades para el componente DistributionSelector.
 */
interface DistributionSelectorProps {
    /** Valor actual del ratio de distribución (ej. 1.0 para ocupación completa). */
    value: number;
    /** Función a ejecutar cuando cambia el ratio de distribución. */
    onChange: (value: number) => void;
}

/**
 * Componente especializado para la selección de la distribución de alumnos.
 * Maneja la conversión entre Ratio de Distribución (uso interno/backend) 
 * y Porcentaje de Ocupación (uso UI/usuario).
 * 
 * @param props - Propiedades del componente.
 * @returns Elemento React para la selección del ratio de distribución.
 */
const DistributionSelector: React.FC<DistributionSelectorProps> = ({ value, onChange }) => {
    const presets = [
        { ratio: 1.0, label: 'Distribución Estándar (100%)' },
        { ratio: 2.0, label: '1 sitio libre de separación (50%)' },
        { ratio: 3.0, label: '2 sitios libres de separación (33%)' },
    ];

    const isPresetValue = presets.some(p => Math.abs(p.ratio - value) < 0.01);
    
    // Estado local para el modo (Preset vs Personalizado)
    const [mode, setMode] = useState<'preset' | 'custom'>(isPresetValue ? 'preset' : 'custom');
    
    // Sincronizar el modo ante cambios externos drásticos (como el reset a 1.0)
    // Pero solo si el cambio no es interno (producido por el propio slider)
    const isInternalChange = React.useRef(false);

    useEffect(() => {
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        // Si el valor vuelve a ser 1.0 (Reset), volvemos a modo preset
        if (value === 1.0) {
            setMode('preset');
        }
    }, [value]);

    const currentPercentage = Math.round(100 / value);

    const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        isInternalChange.current = true;
        
        if (val === 'custom') {
            setMode('custom');
        } else {
            setMode('preset');
            onChange(parseFloat(val));
        }
    };

    const handleSliderChange = (_: Event, newValue: number | number[]) => {
        const pct = newValue as number;
        const newRatio = Math.max(1.0, 100 / pct);
        isInternalChange.current = true;
        onChange(newRatio);
    };

    return (
        <Stack spacing={2}>
            <TextField
                select
                label="Distribución / Separación"
                value={mode === 'preset' && isPresetValue ? value : 'custom'}
                onChange={handleSelectChange}
                fullWidth
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <StraightenIcon fontSize="small" color="action" />
                        </InputAdornment>
                    ),
                }}
            >
                {presets.map(p => (
                    <MenuItem key={p.ratio} value={p.ratio}>
                        {p.label}
                    </MenuItem>
                ))}
                <MenuItem value="custom"><em>Personalizado...</em></MenuItem>
            </TextField>

            {mode === 'custom' && (
                <Box sx={{ px: 2, pt: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            PORCENTAJE DE OCUPACIÓN
                        </Typography>
                        <Typography variant="caption" sx={{ bgcolor: 'primary.main', color: 'white', px: 1, borderRadius: 1, fontWeight: 'bold' }}>
                            {currentPercentage}%
                        </Typography>
                    </Stack>
                    <Slider
                        value={currentPercentage}
                        onChange={handleSliderChange}
                        min={10}
                        max={100}
                        step={5}
                        marks={[
                            { value: 25, label: '25%' },
                            { value: 50, label: '50%' },
                            { value: 75, label: '75%' },
                            { value: 100, label: '100%' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                        Equivalencia: 1 alumno ocupa {value.toFixed(2)} asientos
                    </Typography>
                </Box>
            )}
        </Stack>
    );
};

export default DistributionSelector;
