import React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

/**
 * Propiedades del componente StatusTypeFilters.
 */
interface StatusTypeFiltersProps {
    status: string;
    type: string;
    includeTerminalStates: boolean;
    onStatusChange: (val: string) => void;
    onTypeChange: (val: string) => void;
}

/**
 * Componente secundario para la selección de filtros por estado y tipo de reserva.
 * 
 * Renderiza los controles de formulario encapsulados, permitiendo al usuario acotar
 * la búsqueda según la situación del ciclo de vida de la reserva o su tipología académica.
 * 
 * @param props - Propiedades del componente.
 * @param props.status - Valor seleccionado actualmente en el filtro de estado.
 * @param props.type - Valor seleccionado actualmente en el filtro de tipología.
 * @param props.includeTerminalStates - Flag que determina si se deben ofrecer en el selector los estados finales ('RECHAZADA', 'CANCELADA').
 * @param props.onStatusChange - Callback invocado tras la actualización del filtro de estado.
 * @param props.onTypeChange - Callback invocado tras la actualización del filtro de tipo.
 * @returns Conjunto de campos de selección estructurados en el sistema de Grid.
 */
const StatusTypeFilters = ({ status, type, includeTerminalStates, onStatusChange, onTypeChange }: StatusTypeFiltersProps) => {
    return (
        <>
            <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                    <InputLabel id="reservation-status-filter-label">Estado</InputLabel>
                    <Select
                        labelId="reservation-status-filter-label"
                        id="reservation-status-filter"
                        value={status || ''} label="Estado" sx={{ bgcolor: 'white' }}
                        onChange={(e) => onStatusChange(e.target.value as string)}
                    >
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        <MenuItem value="SOLICITADA">Pendientes</MenuItem>
                        <MenuItem value="APROBADA">Aprobadas</MenuItem>
                        <MenuItem value="BLOQUEO">Bloqueos</MenuItem>
                        
                        {includeTerminalStates && [
                            <MenuItem key="RECHAZADA" value="RECHAZADA">Rechazadas</MenuItem>,
                            <MenuItem key="CANCELADA" value="CANCELADA">Canceladas</MenuItem>
                        ]}
                    </Select>
                </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                    <InputLabel id="reservation-type-filter-label">Tipo</InputLabel>
                    <Select
                        labelId="reservation-type-filter-label"
                        id="reservation-type-filter"
                        value={type || ''} label="Tipo" sx={{ bgcolor: 'white' }}
                        onChange={(e) => onTypeChange(e.target.value as string)}
                    >
                        <MenuItem value=""><em>Todos</em></MenuItem>
                        <MenuItem value="CLASE">Docencia / Clase</MenuItem>
                        <MenuItem value="EXAMEN">Examen / Evaluación</MenuItem>
                        <MenuItem value="OTRO">Otros eventos</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </>
    );
};

export default StatusTypeFilters;
